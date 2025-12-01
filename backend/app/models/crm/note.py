from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class NoteBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class NoteCreate(NoteBase):
    id: Optional[int] = 0
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    note: Optional[str] = Field(default="")
    files: Optional[str] = Field(default="[]")  # JSON string for files
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

@form_body
class NoteUpdate(NoteBase):
    id: Optional[int] = 0
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    note: Optional[str] = Field(default="")
    files: Optional[str] = Field(default="[]")  # JSON string for files
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

class NoteInDB(NoteBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True 