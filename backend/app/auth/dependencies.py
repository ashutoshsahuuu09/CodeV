from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from pymongo.database import Database
from typing import Optional

from app.database.mongodb import get_db
from app.auth.security import decode_token
from app.models.mongo_models import User, Organization, OrganizationMember

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    db: Database = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
) -> dict:
    actual_token = None
    if token:
        actual_token = token
    elif authorization and authorization.startswith("Bearer "):
        actual_token = authorization.replace("Bearer ", "")

    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(actual_token)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db[User.COLLECTION].find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    return user


def get_current_organization(
    user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id"),
) -> dict:
    """
    Enforces multi-tenancy. Resolves the current organization for the user.
    """
    if x_org_id:
        membership = db[OrganizationMember.COLLECTION].find_one(
            {"organization_id": x_org_id, "user_id": user["_id"]}
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not a member of this organization",
            )
        org = db[Organization.COLLECTION].find_one({"_id": x_org_id})
        if org:
            return org

    # Fallback to first membership
    first_membership = db[OrganizationMember.COLLECTION].find_one({"user_id": user["_id"]})
    if not first_membership:
        # Create a default personal organization
        import re
        slug = re.sub(r"[^a-z0-9\-]", "-", user["email"].split("@")[0].lower()) + "-workspace"
        new_org = Organization.new(
            name=f"{user['full_name']}'s Workspace",
            slug=slug,
        )
        db[Organization.COLLECTION].insert_one(new_org)
        member = OrganizationMember.new(
            organization_id=new_org["_id"],
            user_id=user["_id"],
            role="admin",
        )
        db[OrganizationMember.COLLECTION].insert_one(member)
        return new_org

    org = db[Organization.COLLECTION].find_one({"_id": first_membership["organization_id"]})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org
