from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class AccountBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class AccountCreate(AccountBase):
    id: Optional[int] = Field(default=0)
    uid: Optional[str] = Field(default="")
    ukey: Optional[str] = Field(default="")

    title: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    parent_id: Optional[int] = Field(default=0)
    location: Optional[str] = Field(default="")
    account_number: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default=0)
    industry_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    annual_revenue: Optional[str] = Field(default="")
    employees: Optional[str] = Field(default="")
    phone: Optional[str] = Field(default="")
    mobile: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    website: Optional[str] = Field(default="")
    fax: Optional[str] = Field(default="")
    rating: Optional[str] = Field(default="")
    description: Optional[str] = Field(default="")

    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    last_activity: Optional[str] = Field(default="")

@form_body
class AccountUpdate(AccountBase):
    id: Optional[int] = Field(default=0)
    uid: Optional[str] = Field(default="")
    ukey: Optional[str] = Field(default="")

    title: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    parent_id: Optional[int] = Field(default=0)
    location: Optional[str] = Field(default="")
    account_number: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default=0)
    industry_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    annual_revenue: Optional[str] = Field(default="")
    employees: Optional[str] = Field(default="")
    phone: Optional[str] = Field(default="")
    mobile: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    website: Optional[str] = Field(default="")
    fax: Optional[str] = Field(default="")
    rating: Optional[str] = Field(default="")
    description: Optional[str] = Field(default="")

    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    last_activity: Optional[str] = Field(default="")

class AccountInDB(AccountBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True

@form_body
class AccountUpdateStatus(BaseModel):
    status_id: Optional[int] = Field(default=0)

@form_body
class AccountUpdateOwner(BaseModel):
    owner_id: Optional[int] = Field(default=0)
