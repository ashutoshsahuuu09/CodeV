from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from datetime import datetime
import re

from app.database.mongodb import get_db
from app.models.mongo_models import User, Organization, OrganizationMember
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Database = Depends(get_db)):
    """Registers a new user, creates their default organization, and returns a JWT token."""
    existing_user = db[User.COLLECTION].find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    # 1. Create User
    new_user = User.new(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db[User.COLLECTION].insert_one(new_user)

    # 2. Create Organization
    org_name = payload.organization_name or f"{payload.full_name}'s Workspace"
    slug = re.sub(r"[^a-z0-9\-]", "-", payload.email.split("@")[0].lower()) + "-org"
    existing_slugs = db[Organization.COLLECTION].count_documents(
        {"slug": {"$regex": f"^{re.escape(slug)}"}}
    )
    if existing_slugs > 0:
        slug = f"{slug}-{existing_slugs + 1}"

    new_org = Organization.new(name=org_name, slug=slug, plan="starter")
    db[Organization.COLLECTION].insert_one(new_org)

    # 3. Add User as Admin Member
    member = OrganizationMember.new(
        organization_id=new_org["_id"],
        user_id=new_user["_id"],
        role="admin",
    )
    db[OrganizationMember.COLLECTION].insert_one(member)

    token = create_access_token(subject=new_user["_id"], org_id=new_org["_id"])
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=new_user["_id"],
            email=new_user["email"],
            full_name=new_user["full_name"],
            avatar_url=new_user.get("avatar_url"),
            is_active=new_user["is_active"],
        ),
        current_organization_id=new_org["_id"],
    )


@auth_router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Database = Depends(get_db)):
    """Authenticates email & password, returning JWT access token."""
    user = db[User.COLLECTION].find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Find user's primary organization
    membership = db[OrganizationMember.COLLECTION].find_one({"user_id": user["_id"]})
    org_id = membership["organization_id"] if membership else ""

    token = create_access_token(subject=user["_id"], org_id=org_id)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            avatar_url=user.get("avatar_url"),
            is_active=user["is_active"],
        ),
        current_organization_id=org_id,
    )


@auth_router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserOut(
        id=current_user["_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        avatar_url=current_user.get("avatar_url"),
        is_active=current_user["is_active"],
    )


@auth_router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logs out user (invalidates client session)."""
    return {"message": "Successfully logged out"}
