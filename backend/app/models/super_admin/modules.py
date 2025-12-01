from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.helpers.general_helper import form_body

class CommanModuleModel(BaseModel):
    created_at: Optional[datetime] = datetime.now()
    created_by: Optional[int] = 0
    updated_at: Optional[datetime] = datetime.now()
    updated_by: Optional[int] = 0
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0

@form_body
class ModuleCreate(CommanModuleModel):
    id: Optional[int] = 0
    app_id: Optional[int] = 0
    app: Optional[str] = ""
    title: Optional[str] = ""
    slug: Optional[str] = ""
    icon: Optional[str] = ""
    icon_class: Optional[str] = ""
    excerpt: Optional[str] = ""
    banner: Optional[str] = ""
    thumbnail: Optional[str] = ""
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    optional: Optional[int] = 0
    deletable: Optional[int] = 0

    
@form_body
class ModuleUpdate(CommanModuleModel):
    id: Optional[int] = 0
    app_id: Optional[int] = 0
    app: Optional[str] = ""
    title: Optional[str] = ""
    slug: Optional[str] = ""
    icon: Optional[str] = ""
    icon_class: Optional[str] = ""
    excerpt: Optional[str] = ""
    banner: Optional[str] = ""
    thumbnail: Optional[str] = ""
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    optional: Optional[int] = 0
    deletable: Optional[int] = 0  

@form_body
class ModuleDelete(BaseModel):
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0
    
    

@form_body
class ModuleDBColumnCreate(CommanModuleModel):
    id: Optional[int] = 0
    module_id: Optional[int] = 0
    title: Optional[str] = ""
    db_field_name: Optional[str] = ""
    mandatory: Optional[int] = 0
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deletable: Optional[int] = 0
    
@form_body
class ModuleDBColumnUpdate(CommanModuleModel):
    id: Optional[int] = 0
    module_id: Optional[int] = 0
    title: Optional[str] = ""
    db_field_name: Optional[str] = ""
    mandatory: Optional[int] = 0
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deletable: Optional[int] = 0  

@form_body
class ModuleDBColumnDelete(BaseModel):
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0    
    
    
    
@form_body
class ModuleCustomViewCreate(CommanModuleModel):
    id: Optional[int] = 0
    ukey: Optional[str] = ""
    tenant_id: Optional[int] = 0
    module_id: Optional[int] = 0
    title: Optional[str] = ""
    slug: Optional[str] = ""
    columns: Optional[str] = ""
    criterea: Optional[str] = ""
    query: Optional[str] = ""  
    query_type: Optional[int] = 1  
    system_defined: Optional[int] = 0
    default: Optional[int] = 0
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deletable: Optional[int] = 0  
    
@form_body
class ModuleCustomViewUpdate(CommanModuleModel):
    id: Optional[int] = 0
    ukey: Optional[str] = ""
    tenant_id: Optional[int] = 0
    module_id: Optional[int] = 0
    title: Optional[str] = ""
    slug: Optional[str] = ""
    columns: Optional[str] = ""
    criterea: Optional[str] = ""
    query: Optional[str] = ""    
    query_type: Optional[int] = 1    
    system_defined: Optional[int] = 0
    default: Optional[int] = 0
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deletable: Optional[int] = 0  

@form_body
class ModuleCustomViewDelete(BaseModel):
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0    
    
    
    