from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class CallBase(BaseModel):
    outgoing_status_id: Optional[int] = 1
    status_id: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class CallCreate(CallBase):
    id: Optional[int] = 0
    ukey: Optional[str] = Field(default="")
    subject: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default="")
    start_time: Optional[str] = Field(default="")
    end_time: Optional[str] = Field(default="")
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    owner_id: Optional[int] = Field(default=0)
    purpose_id: Optional[int] = Field(default="")
    favorite: Optional[int] = Field(default=0)
    duration: Optional[str] = Field(default="")
    description: Optional[str] = Field(default="")
    result: Optional[str] = Field(default="")
    tag: Optional[str] = Field(default="")
    agenda: Optional[str] = Field(default="")
    reminder_id: Optional[int] = Field(default="")
    caller_id: Optional[str] = Field(default="")
    dialled_number: Optional[str] = Field(default="")
    call_for: Optional[str] = Field(default="")
    call_for_id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    closed: Optional[int] = Field(default=0)
    deletable: Optional[int] = Field(default=0)
    assigned_to_id: Optional[int] = Field(default=0)

@form_body
class CallUpdate(CallBase):
    id: Optional[int] = Field(default=0)
    ukey: Optional[str] = Field(default="")
    subject: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default="")
    start_time: Optional[str] = Field(default="")
    end_time: Optional[str] = Field(default="")
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    owner_id: Optional[int] = Field(default=0)
    purpose_id: Optional[int] = Field(default="")
    duration: Optional[str] = Field(default="")
    favorite: Optional[int] = Field(default=0)
    description: Optional[str] = Field(default="")
    result: Optional[str] = Field(default="")
    tag: Optional[str] = Field(default="")
    agenda: Optional[str] = Field(default="")
    reminder_id: Optional[int] = Field(default="")
    caller_id: Optional[str] = Field(default="")
    dialled_number: Optional[str] = Field(default="")
    call_for: Optional[str] = Field(default="")
    call_for_id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    closed: Optional[int] = Field(default=0)
    deletable: Optional[int] = Field(default=0)
    assigned_to_id: Optional[int] = Field(default=0)
@form_body
class CallUpdatePurpose(CallBase):
    purpose_id: Optional[str] = Field(default="")

@form_body
class CallUpdateStatus(CallBase):
    status_id: Optional[int] = Field(default=0)

class CallInDB(CallBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True 