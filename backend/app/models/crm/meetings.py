from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class MeetingBase(BaseModel):
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class MeetingCreate(MeetingBase):
    id: Optional[int] = 0
    ukey: Optional[str] = Field(default="")
    title: Optional[str] = Field(default="")
    venue: Optional[str] = Field(default="")
    location: Optional[str] = Field(default="")
    start_time: Optional[str] = Field(default="")
    end_time: Optional[str] = Field(default="")
    all_day: Optional[int] = Field(default=0)
    owner_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    meeting_for: Optional[str] = Field(default="")
    meeting_for_ids: Optional[str] = Field(default="[]")
    related_to: Optional[str] = Field(default="")
    related_to_ids: Optional[str] = Field(default="[]")
    participant_ids: Optional[str] = Field(default="[]")
    reminder_id: Optional[int] = Field(default="")
    description: Optional[str] = Field(default="")
    deletable: Optional[int] = Field(default=1)
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)

@form_body
class MeetingUpdate(MeetingBase):
    id: Optional[int] = 0
    title: Optional[str] = Field(default="")
    venue: Optional[str] = Field(default="")
    location: Optional[str] = Field(default="")
    start_time: Optional[str] = Field(default="")
    end_time: Optional[str] = Field(default="")
    all_day: Optional[int] = Field(default=0)
    owner_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    meeting_for: Optional[str] = Field(default="")
    meeting_for_ids: Optional[str] = Field(default="[]")
    related_to: Optional[str] = Field(default="")
    related_to_ids: Optional[str] = Field(default="[]")
    participant_ids: Optional[str] = Field(default="[]")
    reminder_id: Optional[int] = Field(default="")
    description: Optional[str] = Field(default="")
    deletable: Optional[int] = Field(default=1)
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)



@form_body
class MeetingUpdateVenue(MeetingBase):
    venue: Optional[str] = Field(default="")

@form_body
class MeetingUpdateStatus(MeetingBase):
    status_id: Optional[int] = Field(default=0)

class MeetingInDB(MeetingBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True 