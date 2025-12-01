from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class DealBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class DealCreate(DealBase):
    id: Optional[int] = 0
    ukey: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    account_id: Optional[int] = Field(default=0)
    contact_id: Optional[int] = Field(default=0)
    source_id: Optional[int] = Field(default=0)
    title: Optional[str] = Field(default="")
    type_id: Optional[str] = Field(default="")
    lead_id: Optional[int] = Field(default=0)
    campaign_source_id: Optional[int] = Field(default=0)
    
    lead_source_id: Optional[int] = Field(default=0)
    amount: Optional[int] = Field(default=0)
    closing_date: Optional[str] = Field(default="")
    status_id: Optional[int] = Field(default="1")
    probability: Optional[int] = Field(default=0)
    expected_revenue: Optional[int] = 0
    description: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)


@form_body
class DealUpdate(DealBase):
    id: Optional[int] = 0
    ukey: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    account_id: Optional[int] = Field(default=0)
    contact_id: Optional[int] = Field(default=0)
    source_id: Optional[int] = Field(default=0)
    campaign_source_id: Optional[int] = Field(default=0)
    title: Optional[str] = Field(default="")
    type_id: Optional[str] = Field(default="")
    lead_id: Optional[int] = Field(default=0)
    lead_source_id: Optional[int] = Field(default=0)
    amount: Optional[int] = Field(default=0)
    closing_date: Optional[str] = Field(default="")
    status_id: Optional[int] = Field(default="1")
    probability: Optional[int] = Field(default=0)
    expected_revenue: Optional[int] = 0
    description: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

@form_body
class DealsUpdateStage(DealBase):
    status_id: Optional[int] = Field(default="1")

class DealInDB(DealBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True
