from pydantic import BaseModel, Field
from typing import Optional, List
from app.helpers.general_helper import form_body


class AttachmentBase(BaseModel):
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = ""
    updatedon: Optional[str] = ""

@form_body
class AttachmentCreate(AttachmentBase):
    id: Optional[int] = 0
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    
    file_name: Optional[str] = Field(default="")
    attached_by: Optional[str] = Field(default="")
    attached_date: Optional[str] = Field(default="")
    old_file: Optional[str] = Field(default="")

    original_filename: Optional[str] = Field(default="")
    file_path: Optional[str] = Field(default="")
    file_url: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)
    content_type: Optional[str] = Field(default="")
    file_extension: Optional[str] = Field(default="")
    file_type: Optional[str] = Field(default="")
    uploaded_at: Optional[str] = Field(default="")

    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

@form_body
class AttachmentUpdate(AttachmentBase):
    id: int
    related_to: Optional[str] = Field(default="")
    related_to_id: Optional[int] = Field(default=0)
    
    file_name: Optional[str] = Field(default="")
    attached_by: Optional[str] = Field(default="")
    attached_date: Optional[str] = Field(default="")
    old_file: Optional[str] = Field(default="")

    original_filename: Optional[str] = Field(default="")
    file_path: Optional[str] = Field(default="")
    file_url: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)
    content_type: Optional[str] = Field(default="")
    file_extension: Optional[str] = Field(default="")
    file_type: Optional[str] = Field(default="")
    uploaded_at: Optional[str] = Field(default="")

    tenant_id: Optional[int] = Field(default=None)
    user_id: Optional[int] = Field(default=None)
    active: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)

class AttachmentInDB(AttachmentBase):
    id: int
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True
