from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class BasePermission(BaseModel):
    title: str
    key: str
    permission_group_id: int
    active: int = 1
    sort_by: int = 0
    created_at: datetime = datetime.now()
    created_by: int = 0
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None
    deleted_at: Optional[datetime] = None
    deleted: int = 0

class CreatePermission(BasePermission):
    id: int

class UpdatePermission(BasePermission):
    id: int

class DeletePermission(BaseModel):
    deleted: int

class ProfilePermission(BaseModel):
    profile_id: int
    permissions: Optional[str] = None

class ProfilePermissionResponse(BaseModel):
    profile_id: int
    permissions: List[dict] 