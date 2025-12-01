from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class AffiliateNoteBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc).isoformat()
    updatedon: Optional[str] = datetime.now(timezone.utc).isoformat()


@form_body
class AffiliateNoteCreate(AffiliateNoteBase):
    id: Optional[int] = 0
    affiliate_id: Optional[int] = Field(default=0)
    content: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    created_by: Optional[int] = Field(default=0)


@form_body
class AffiliateNoteUpdate(AffiliateNoteBase):
    id: Optional[int] = 0
    affiliate_id: Optional[int] = Field(default=0)
    content: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    edit_by: Optional[int] = Field(default=0)


class AffiliateNoteInDB(AffiliateNoteBase):
    id: int
    affiliate_id: int
    content: str
    tenant_id: int
    created_by: int
    active: int
    deleted: int

    class Config:
        orm_mode = True


# Customer Notes Models
@form_body
class CustomerNoteCreate(AffiliateNoteBase):
    id: Optional[int] = 0
    customer_id: Optional[int] = Field(default=0)
    content: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    created_by: Optional[int] = Field(default=0)


@form_body
class CustomerNoteUpdate(AffiliateNoteBase):
    id: Optional[int] = 0
    customer_id: Optional[int] = Field(default=0)
    content: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    edit_by: Optional[int] = Field(default=0)


class CustomerNoteInDB(AffiliateNoteBase):
    id: int
    customer_id: int
    content: str
    tenant_id: int
    created_by: int
    active: int
    deleted: int

    class Config:
        orm_mode = True


