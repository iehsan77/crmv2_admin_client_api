import email

from pydantic import BaseModel, BaseConfig
from typing import Optional, Set
from datetime import datetime

BaseConfig.arbitrary_types_allowed = True 

class website_tenant_model(BaseModel):
    id:Optional[int] = 0
    website: Optional[str] = ''
    company_name: Optional[str] = ''
    website_for: Optional[str] = ''
    tenant_id: Optional[int] = 0
    favicon: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/website_assets/images/favicon.ico'
    active: Optional[int] = 0
    theme_id:Optional[str] = 'default_theme'
    tenant_website_id: Optional[int] = 0
    address:Optional[str] = ''
    contact:Optional[str] = ''
    email:Optional[str] = ''
    about_excerpt: Optional[str] = ''
    facebook: Optional[str] = ''
    linkedin : Optional[str] = ''
    twitter: Optional[str] = ''
    youtube: Optional[str] = ''
    whatsapp: Optional[str] = ''
    header_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    footer_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    sticky_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    copyright_text: Optional[str] = ''
    working_hours_text: Optional[str] =''
    user_integration:Optional[int] = 0
    facebook_login:Optional[int] = 0
    google_login:Optional[int] =0
    linkedin_login:Optional[int] = 0
    country_id:Optional[int] = 0
    
    active: Optional[int] = 1
    sortby: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()
    
class Update_website_tenant_model(BaseModel):
    id:Optional[int] = 0
    website: Optional[str] = ''
    company_name: Optional[str] = ''
    favicon: Optional[str] = ''
    header_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    footer_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    sticky_logo: Optional[str] = 'https://jocdn.sfo3.cdn.digitaloceanspaces.com/classified_images/wllabel/logo.png'
    copyright_text: Optional[str] = ''
    working_hours_text: Optional[str] =''
    tenant_website_id: Optional[int] = 0
    tenant_id: Optional[int] = 0
    address:Optional[str] = ''
    contact:Optional[str] = ''
    email:Optional[str] = ''
    about_excerpt: Optional[str] = ''
    facebook: Optional[str] = ''
    linkedin : Optional[str] = ''
    twitter: Optional[str] = ''
    youtube: Optional[str] = ''
    whatsapp: Optional[str] = ''
    theme_id:Optional[str] = 'default_theme'
    user_integration:Optional[int] = 0
    facebook_login:Optional[int] = 0
    google_login:Optional[int] =0
    linkedin_login:Optional[int] = 0
    country_id:Optional[int] = 0
    
    active: Optional[int] = 1
    sort_by: Optional[int] = 0
    
class CreateTenantPurchaseApp(BaseModel):
    id:Optional[int] = 0
    tenant_id: Optional[int] = 0
    tenant_app_id: Optional[int] = 0
    
    active: Optional[int] = 1
    sortby: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()

class UpdateTenantPurchaseApp(BaseModel):
    id:Optional[int] = 0
    tenant_id: Optional[int] = 0
    tenant_app_id: Optional[int] = 0
    
    active: Optional[int] = 1
    sortby: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()
    