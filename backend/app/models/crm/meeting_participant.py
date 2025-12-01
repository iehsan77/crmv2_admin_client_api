from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class MeetingParticipantBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class MeetingParticipantCreate(MeetingParticipantBase):
    id: Optional[int] = 0
    meeting_id: Optional[int] = Field(default=0)
    type: Optional[str] = Field(default="")
    participants: Optional[str] = Field(default="[]")  # JSON string for participants
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

@form_body
class MeetingParticipantUpdate(MeetingParticipantBase):
    id: int
    meeting_id: Optional[int] = Field(default=0)
    type: Optional[str] = Field(default="")
    participants: Optional[str] = Field(default="[]")  # JSON string for participants
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

class MeetingParticipantInDB(MeetingParticipantBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True 