import re
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List

from app.database.mongodb import get_db
from app.models.mongo_models import User, Organization, OrganizationMember
from app.schemas.schemas import OrgCreate, OrgOut, OrgMemberAdd, OrgMemberOut
from app.auth.dependencies import get_current_user, get_current_organization

org_router = APIRouter(prefix="/organizations", tags=["Organizations"])


@org_router.get("", response_model=List[OrgOut])
def list_user_organizations(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """Lists all organizations the user is a member of."""
    memberships = list(db[OrganizationMember.COLLECTION].find({"user_id": current_user["_id"]}))
    results = []
    for m in memberships:
        org = db[Organization.COLLECTION].find_one({"_id": m["organization_id"]})
        if org:
            results.append(
                OrgOut(
                    id=org["_id"],
                    name=org["name"],
                    slug=org["slug"],
                    description=org.get("description"),
                    plan=org.get("plan", "starter"),
                    created_at=org["created_at"],
                    role=m["role"],
                )
            )
    return results


@org_router.post("", response_model=OrgOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrgCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """Creates a new organization workspace and adds user as admin."""
    slug = re.sub(r"[^a-z0-9\-]", "-", payload.name.lower())
    count = db[Organization.COLLECTION].count_documents(
        {"slug": {"$regex": f"^{re.escape(slug)}"}}
    )
    if count > 0:
        slug = f"{slug}-{count + 1}"

    new_org = Organization.new(
        name=payload.name,
        slug=slug,
        description=payload.description,
        plan="starter",
    )
    db[Organization.COLLECTION].insert_one(new_org)

    member = OrganizationMember.new(
        organization_id=new_org["_id"],
        user_id=current_user["_id"],
        role="admin",
    )
    db[OrganizationMember.COLLECTION].insert_one(member)

    return OrgOut(
        id=new_org["_id"],
        name=new_org["name"],
        slug=new_org["slug"],
        description=new_org.get("description"),
        plan=new_org.get("plan", "starter"),
        created_at=new_org["created_at"],
        role="admin",
    )


@org_router.get("/current", response_model=OrgOut)
def get_current_org_info(current_org: dict = Depends(get_current_organization)):
    """Returns current active organization context."""
    return OrgOut(
        id=current_org["_id"],
        name=current_org["name"],
        slug=current_org["slug"],
        description=current_org.get("description"),
        plan=current_org.get("plan", "starter"),
        created_at=current_org["created_at"],
        role="admin",
    )


@org_router.get("/members", response_model=List[OrgMemberOut])
def get_organization_members(
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Lists all team members in the current organization."""
    members = list(
        db[OrganizationMember.COLLECTION].find({"organization_id": current_org["_id"]})
    )
    results = []
    for m in members:
        user = db[User.COLLECTION].find_one({"_id": m["user_id"]})
        if user:
            results.append(
                OrgMemberOut(
                    id=m["_id"],
                    user_id=user["_id"],
                    email=user["email"],
                    full_name=user["full_name"],
                    role=m["role"],
                    created_at=m["created_at"],
                )
            )
    return results


@org_router.post("/members", response_model=OrgMemberOut)
def add_organization_member(
    payload: OrgMemberAdd,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Adds or invites a user to the current organization."""
    user = db[User.COLLECTION].find_one({"email": payload.email})
    if not user:
        from app.models.mongo_models import User as UserModel
        from app.auth.security import get_password_hash
        user = UserModel.new(
            email=payload.email,
            full_name=payload.email.split("@")[0].capitalize(),
            hashed_password=get_password_hash("placeholder_needs_invite_acceptance"),
            is_active=True,
        )
        db[User.COLLECTION].insert_one(user)

    existing = db[OrganizationMember.COLLECTION].find_one(
        {"organization_id": current_org["_id"], "user_id": user["_id"]}
    )
    if existing:
        db[OrganizationMember.COLLECTION].update_one(
            {"_id": existing["_id"]}, {"$set": {"role": payload.role}}
        )
        existing["role"] = payload.role
        return OrgMemberOut(
            id=existing["_id"],
            user_id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            role=payload.role,
            created_at=existing["created_at"],
        )

    membership = OrganizationMember.new(
        organization_id=current_org["_id"],
        user_id=user["_id"],
        role=payload.role,
    )
    db[OrganizationMember.COLLECTION].insert_one(membership)
    return OrgMemberOut(
        id=membership["_id"],
        user_id=user["_id"],
        email=user["email"],
        full_name=user["full_name"],
        role=membership["role"],
        created_at=membership["created_at"],
    )
