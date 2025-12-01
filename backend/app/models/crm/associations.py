from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from app.helpers.general_helper import form_body

class AssociationBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class AssociationCreate(AssociationBase):
    id: Optional[int] = 0
    source_module: Optional[str] = Field(default="", description="Source module name (e.g., 'deal', 'account', 'contact')")
    source_module_id: Optional[int] = Field(default=0, description="ID of the source module entity")
    target_module: Optional[str] = Field(default="", description="Target module name (e.g., 'deal', 'account', 'contact')")
    target_module_ids: Optional[List[int]] = Field(default_factory=list, description="List of target module entity IDs")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    file: Optional[str] = Field(default="")

@form_body
class AssociationUpdate(AssociationBase):
    id: Optional[int] = 0
    source_module: Optional[str] = Field(default="", description="Source module name (e.g., 'deal', 'account', 'contact')")
    source_module_id: Optional[int] = Field(default=0, description="ID of the source module entity")
    target_module: Optional[str] = Field(default="", description="Target module name (e.g., 'deal', 'account', 'contact')")
    target_module_ids: Optional[List[int]] = Field(default_factory=list, description="List of target module entity IDs")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    file: Optional[str] = Field(default="")

class AssociationInDB(AssociationBase):
    id: int
    source_module: str
    source_module_id: int
    target_module: str
    target_module_ids: List[int]
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True

