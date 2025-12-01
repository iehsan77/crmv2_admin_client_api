from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.helpers.general_helper import form_body


@form_body
class CreateFormLayout(BaseModel):
    id: Optional[int] = 0
    app_id: Optional[int] = 0
    module_id: Optional[int] = 0
    tenant_id: Optional[int] = 0
    tenant_website_id: Optional[int] = 0
    form_id: Optional[int] = 0
    title: Optional[str] = ""
    
    active: Optional[int] = 1
    deletable: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class UpdateFormLayout(BaseModel):
    id: Optional[int] = 0
    app_id: Optional[int] = 0
    module_id: Optional[int] = 0
    tenant_id: Optional[int] = 0
    tenant_website_id: Optional[int] = 0
    form_id: Optional[int] = 0
    title: Optional[str] = ""
    
    active: Optional[int] = 1
    deletable: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class CreateFormLayoutFields(BaseModel):
    id: Optional[int] = 0
    tenant_id: Optional[str] = ""
    tenant_website_id: Optional[str] = ""
    field_id: Optional[int] = 0
    layout_id: Optional[int] = 0
    
    active: Optional[int] = 0
    deletable: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class UpdateFormLayoutFields(BaseModel):
    tenant_id: Optional[str] = ""
    tenant_website_id: Optional[str] = ""
    field_id: Optional[int] = 0
    layout_id: Optional[int] = 0

    active: Optional[int] = 0
    deletable: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()

