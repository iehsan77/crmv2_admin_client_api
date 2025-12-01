from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class FeatureBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = None
    updatedon: Optional[str] = None


@form_body
class FeatureCreate(FeatureBase):
    id: Optional[int] = Field(default=0)
    icon: Optional[str] = Field(default="")
    title: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    sort_by: Optional[int] = Field(default=0)
    is_global: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)

@form_body
class FeatureUpdate(FeatureBase):
    id: Optional[int] = Field(default=0)
    icon: Optional[str] = Field(default="")
    title: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    sort_by: Optional[int] = Field(default=0)
    is_global: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)


class FeatureInDB(FeatureBase):
    id: int

    class Config:
        orm_mode = True


