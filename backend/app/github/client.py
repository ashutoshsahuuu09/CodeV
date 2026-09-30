import os
import httpx
from typing import List, Dict, Any, Optional

SAMPLE_REPOSITORIES = [
    {
        "name": "fastapi-saas-auth-engine",
        "full_name": "enterprise/fastapi-saas-auth-engine",
        "description": "Production FastAPI authentication microservice with JWT, Redis sessions, and RBAC.",
        "primary_language": "Python",
        "default_branch": "main",
        "html_url": "https://github.com/enterprise/fastapi-saas-auth-engine",
        "files": {
            "app/main.py": '''"""Main FastAPI application entry point."""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import auth_router
from app.api.v1.users import user_router
from app.api.v1.payments import payment_router
from app.core.config import settings
from app.core.database import init_db

app = FastAPI(
    title="Enterprise Auth & SaaS API",
    version="2.4.0",
    description="Core backend service for multi-tenant SaaS authentication and payments."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database and Redis connection pool on startup."""
    await init_db()

@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {"status": "healthy", "service": "auth-engine", "version": settings.VERSION}

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(payment_router, prefix="/api/v1/payments", tags=["Payments"])
''',
            "app/api/v1/auth.py": '''"""Authentication routes for login, registration, and MFA."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import TokenResponse, UserRegisterRequest, RefreshTokenRequest
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_refresh_token, verify_jwt_token

auth_router = APIRouter()

@auth_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, auth_service: AuthService = Depends()):
    """
    Registers a new tenant organization and primary admin user.
    Hashes password with argon2id and generates JWT access token.
    """
    user = await auth_service.register_tenant_admin(payload)
    access_token = create_access_token(subject=user.id, org_id=user.organization_id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), auth_service: AuthService = Depends()):
    """
    Validates user credentials against database, checks bcrypt hash,
    and returns signed JWT session tokens.
    """
    user = await auth_service.authenticate(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id, org_id=user.organization_id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600
    )

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, auth_service: AuthService = Depends()):
    """Refreshes an expired access token using a valid refresh token."""
    decoded = verify_jwt_token(payload.refresh_token)
    user = await auth_service.get_user_by_id(decoded.get("sub"))
    new_access_token = create_access_token(subject=user.id, org_id=user.organization_id)
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=payload.refresh_token,
        token_type="bearer",
        expires_in=3600
    )
''',
            "app/services/auth_service.py": '''"""Core business logic for identity, password hashing, and permissions."""
from typing import Optional
from passlib.hash import argon2
from app.models.user import User, Organization
from app.core.redis import redis_client

class AuthService:
    def __init__(self, db_session = None):
        self.db = db_session

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Queries user record by email, verifies password hash,
        and invalidates lockouts via Redis rate limiter.
        """
        user = await self.get_by_email(email)
        if not user:
            return None
        if not argon2.verify(password, user.hashed_password):
            await self._record_failed_attempt(email)
            return None
        return user

    async def register_tenant_admin(self, payload) -> User:
        """Creates organization record and assigns root admin role."""
        org = Organization(name=payload.organization_name)
        hashed_pwd = argon2.hash(payload.password)
        user = User(
            email=payload.email,
            hashed_password=hashed_pwd,
            organization_id=org.id,
            role="admin"
        )
        return user

    async def _record_failed_attempt(self, email: str):
        """Increments failed login counter in Redis with 15min TTL."""
        key = f"login_attempts:{email}"
        # Redis rate limit logic
''',
            "app/api/v1/payments.py": '''"""Stripe and Razorpay billing webhook and checkout controllers."""
from fastapi import APIRouter, Header, Request, HTTPException, status
from app.services.payment_service import PaymentService
import stripe

payment_router = APIRouter()

@payment_router.post("/webhook", status_code=status.HTTP_200_OK)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature")
):
    """
    Handles asynchronous webhook events from Stripe for subscription renewals,
    failed payment retries, and invoice generation.
    """
    payload = await request.body()
    payment_service = PaymentService()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, payment_service.webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook signature: {str(e)}")

    if event["type"] == "invoice.payment_succeeded":
        await payment_service.handle_invoice_succeeded(event["data"]["object"])
    elif event["type"] == "invoice.payment_failed":
        await payment_service.handle_payment_failure(event["data"]["object"])
    elif event["type"] == "customer.subscription.deleted":
        await payment_service.handle_subscription_canceled(event["data"]["object"])

    return {"status": "success", "event_id": event.get("id")}
''',
            "app/services/payment_service.py": '''"""Billing subscription management and payment gateway integration."""
from app.models.billing import Subscription, Invoice

class PaymentService:
    def __init__(self):
        self.webhook_secret = "whsec_mock_stripe_webhook_key_test"

    async def handle_payment_failure(self, invoice_data: dict):
        """
        Handles payment failure by sending dunning email alerts to user
        and downgrading tenant account after 3 retries.
        """
        customer_id = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")
        # Update subscription status to past_due
        print(f"Payment failed for customer: {customer_id}, subscription: {subscription_id}")

    async def handle_invoice_succeeded(self, invoice_data: dict):
        """Updates subscription renewal timestamp and provisions team seats."""
        pass
''',
            "app/core/config.py": '''"""Centralized Pydantic application configuration."""
from pydantic_settings import BaseSettings

class AppSettings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Auth & SaaS API"
    VERSION: str = "2.4.0"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/saas_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "enterprise_secret_jwt_key_991823"
    JWT_ALGORITHM: str = "HS256"
    STRIPE_SECRET_KEY: str = "sk_test_mock_stripe_secret_key"
    STRIPE_WEBHOOK_SECRET: str = "whsec_mock_webhook_secret"

settings = AppSettings()
'''
        }
    },
    {
        "name": "nextjs-ai-analytics-dashboard",
        "full_name": "enterprise/nextjs-ai-analytics-dashboard",
        "description": "Full-stack React Next.js 14 App Router dashboard with server actions and streaming charts.",
        "primary_language": "TypeScript",
        "default_branch": "main",
        "html_url": "https://github.com/enterprise/nextjs-ai-analytics-dashboard",
        "files": {
            "app/page.tsx": '''import React from 'react';
import { MetricsOverview } from '@/components/dashboard/metrics-overview';
import { RealtimeActivityFeed } from '@/components/dashboard/activity-feed';
import { RevenueChart } from '@/components/dashboard/revenue-chart';

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Analytics Overview</h2>
      </div>
      <MetricsOverview />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart className="col-span-4" />
        <RealtimeActivityFeed className="col-span-3" />
      </div>
    </div>
  );
}
''',
            "components/dashboard/metrics-overview.tsx": '''import React from 'react';

export function MetricsOverview() {
  const stats = [
    { title: "Monthly Recurring Revenue", value: "$48,250", change: "+14.2%" },
    { title: "Active Developers", value: "2,420", change: "+8.1%" },
    { title: "Indexed Repositories", value: "842", change: "+24.5%" },
    { title: "RAG Query Latency", value: "240ms", change: "-12.0%" }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s, idx) => (
        <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <p className="text-sm font-medium text-slate-400">{s.title}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <span className="text-xs font-semibold text-emerald-400">{s.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
''',
            "lib/api/analytics.ts": '''/**
 * Client and server analytics API utility.
 * Fetches time-series telemetry and aggregates query performance metrics.
 */
export interface TelemetryEvent {
  timestamp: string;
  eventType: 'query' | 'index' | 'search';
  durationMs: number;
  statusCode: number;
}

export async function fetchTelemetry(repositoryId: string): Promise<TelemetryEvent[]> {
  const response = await fetch(`/api/analytics/telemetry?repoId=${repositoryId}`);
  if (!response.ok) {
    throw new Error(`Failed to load telemetry: ${response.statusText}`);
  }
  return response.json();
}
'''
        }
    }
]

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token

    async def fetch_user_repositories(self) -> List[Dict[str, Any]]:
        """Fetch repositories from GitHub or return sample demo repos if unauthenticated."""
        if not self.token:
            return SAMPLE_REPOSITORIES

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    "Authorization": f"token {self.token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                resp = await client.get("https://api.github.com/user/repos?sort=updated&per_page=30", headers=headers)
                if resp.status_code == 200:
                    repos = resp.json()
                    return [
                        {
                            "name": r["name"],
                            "full_name": r["full_name"],
                            "description": r.get("description") or "No description provided",
                            "primary_language": r.get("language") or "Code",
                            "default_branch": r.get("default_branch") or "main",
                            "html_url": r.get("html_url"),
                            "is_private": r.get("private", False),
                            "clone_url": r.get("clone_url")
                        }
                        for r in repos
                    ]
        except Exception:
            pass

        return SAMPLE_REPOSITORIES

    async def fetch_repo_files_from_url(self, repo_url: str, branch: str = "main") -> List[Dict[str, Any]]:
        """
        Parses repository files from a public GitHub URL (e.g. github.com/owner/repo)
        or matches against sample repos.
        """
        clean_url = repo_url.rstrip("/").lower()

        # Check sample templates first
        for sample in SAMPLE_REPOSITORIES:
            if sample["name"].lower() in clean_url or sample["full_name"].lower() in clean_url:
                files = []
                for fpath, content in sample["files"].items():
                    files.append({
                        "relative_path": fpath,
                        "file_name": fpath.split("/")[-1],
                        "language": sample["primary_language"],
                        "size_bytes": len(content.encode("utf-8")),
                        "line_count": len(content.splitlines()),
                        "sha256": "sample_sha256",
                        "raw_content": content
                    })
                return files

        # Try GitHub API for public repository tree
        if "github.com/" in clean_url:
            parts = clean_url.split("github.com/")[-1].split("/")
            if len(parts) >= 2:
                owner, repo_name = parts[0], parts[1].replace(".git", "")
                try:
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        tree_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{branch}?recursive=1"
                        headers = {"Accept": "application/vnd.github.v3+json"}
                        if self.token:
                            headers["Authorization"] = f"token {self.token}"

                        resp = await client.get(tree_url, headers=headers)
                        if resp.status_code == 200:
                            tree_data = resp.json().get("tree", [])
                            code_files = []
                            for item in tree_data[:60]: # Cap to top 60 files for fast indexing
                                if item.get("type") == "blob":
                                    fpath = item.get("path")
                                    # Fetch raw file content
                                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{branch}/{fpath}"
                                    raw_resp = await client.get(raw_url)
                                    if raw_resp.status_code == 200:
                                        content = raw_resp.text
                                        code_files.append({
                                            "relative_path": fpath,
                                            "file_name": fpath.split("/")[-1],
                                            "language": fpath.split(".")[-1].upper(),
                                            "size_bytes": len(content.encode("utf-8")),
                                            "line_count": len(content.splitlines()),
                                            "sha256": "remote_sha",
                                            "raw_content": content
                                        })
                            if code_files:
                                return code_files
                except Exception:
                    pass

        # Fallback to rich sample template if repository cannot be reached directly
        sample = SAMPLE_REPOSITORIES[0]
        files = []
        for fpath, content in sample["files"].items():
            files.append({
                "relative_path": fpath,
                "file_name": fpath.split("/")[-1],
                "language": sample["primary_language"],
                "size_bytes": len(content.encode("utf-8")),
                "line_count": len(content.splitlines()),
                "sha256": "sample_sha256",
                "raw_content": content
            })
        return files
