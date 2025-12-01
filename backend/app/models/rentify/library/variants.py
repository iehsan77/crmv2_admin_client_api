from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class VariantBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class VariantCreate(VariantBase):
    id: Optional[int] = Field(default=0)
    title: Optional[str] = Field(default="")
    slug: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    brand_id: Optional[int] = Field(default=0)
    brand: Optional[str] = Field(default="")
    model_id: Optional[int] = Field(default=0)
    model: Optional[str] = Field(default="")
    sort_by: Optional[int] = Field(default=0)    
    tenant_id: Optional[int] = Field(default=0)
    is_global: Optional[int] = Field(default=1)
    editable: Optional[int] = Field(default=0)

@form_body
class VariantUpdate(VariantBase):
    id: Optional[int] = Field(default=0)
    title: Optional[str] = Field(default="")
    slug: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    brand_id: Optional[int] = Field(default=0)
    brand: Optional[str] = Field(default="")
    model_id: Optional[int] = Field(default=0)
    model: Optional[str] = Field(default="")
    sort_by: Optional[int] = Field(default=0)    
    tenant_id: Optional[int] = Field(default=0)
    is_global: Optional[int] = Field(default=1)
    editable: Optional[int] = Field(default=0)


class VariantInDB(VariantBase):
    id: int

    class Config:
        orm_mode = True


