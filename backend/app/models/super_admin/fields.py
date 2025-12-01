from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.helpers.general_helper import form_body

class CommonFieldModel(BaseModel):
    sort_by: Optional[int] = 0
    created_at: Optional[datetime] = datetime.now()
    created_by: Optional[int] = 0
    updated_at: Optional[datetime] = datetime.now()
    updated_by: Optional[int] = 0
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0
    deleteable: Optional[int] = 0

@form_body
class CreateField(CommonFieldModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    form_element_type: Optional[str] = ""
    icon: Optional[str] = ""
    type: Optional[str] = ""
    active: Optional[int] = 0

@form_body
class UpdateField(CommonFieldModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    form_element_type: Optional[str] = ""
    icon: Optional[str] = ""
    type: Optional[str] = ""
    active: Optional[int] = 0

@form_body
class DeleteField(BaseModel):
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0