from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from datetime import datetime
from app.helpers.general_helper import form_body

class TaskBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class TaskCreate(TaskBase):
    id: Optional[int] = 0
    ukey: Optional[str] = Field(default="")
    subject: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    due_date: Optional[str] = Field(default="")
    task_for: Optional[str] = Field(default="")
    task_for_id: Optional[int] = Field(default=0)
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    priority_id: Optional[int] = Field(default=0)
    reminder: Optional[str] = Field(default="")
    description: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    completed_on: Optional[str] = datetime.now(timezone.utc)
    assigned_to_id: Optional[int] = Field(default=0)

@form_body
class TaskUpdate(TaskBase):
    id: Optional[int] = 0
    subject: Optional[str] = Field(default="")
    owner_id: Optional[int] = Field(default=0)
    due_date: Optional[str] = Field(default="")
    task_for: Optional[str] = Field(default="")
    task_for_id: Optional[int] = Field(default=0)
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    status_id: Optional[int] = Field(default=0)
    priority_id: Optional[int] = Field(default=0)
    reminder: Optional[str] = Field(default="")
    description: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    completed_on: Optional[str] = datetime.now(timezone.utc)
    assigned_to_id: Optional[int] = Field(default=0)


@form_body
class TaskUpdatePriority(TaskBase):
    priority_id: Optional[int] = Field(default=0)


@form_body
class TaskUpdateStatus(TaskBase):
    status_id: Optional[int] = Field(default=0)


class TaskInDB(TaskBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True 