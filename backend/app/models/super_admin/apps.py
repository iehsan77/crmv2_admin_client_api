from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.helpers.general_helper import form_body

class CommonAppModel(BaseModel):
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    created_at: Optional[datetime] = datetime.now()
    created_by: Optional[int] = 0
    updated_at: Optional[datetime] = datetime.now()
    updated_by: Optional[int] = 0
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0
    deleteable: Optional[int] = 0

@form_body
class CreateApp(CommonAppModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    slug: Optional[str] = ""
    parent_id: Optional[int] = ""
    parent: Optional[int] = ""
    root_url: Optional[str] = ""
    icon: Optional[str] = ""
    banner: Optional[str] = ""
    thumbnail: Optional[str] = ""
    icon_class: Optional[str] = ""
    excerpt: Optional[str] = ""
    
@form_body
class UpdateApp(CommonAppModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    slug: Optional[str] = ""
    parent_id: Optional[int] = ""
    parent: Optional[int] = ""
    root_url: Optional[str] = ""
    icon: Optional[str] = ""
    banner: Optional[str] = ""
    thumbnail: Optional[str] = ""
    icon_class: Optional[str] = ""
    excerpt: Optional[str] = ""

@form_body
class DeleteApp(BaseModel):
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0