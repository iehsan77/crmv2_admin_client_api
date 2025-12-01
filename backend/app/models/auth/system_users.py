from datetime import datetime, timezone
from fastapi import Form, File, UploadFile, Depends, FastAPI

from pydantic import BaseModel
from bson import ObjectId
from typing import Optional, Set

from app.helpers.general_helper import form_body





class SystemUsers(BaseModel):
    _id: ObjectId
    user_id: str
    role: str
    ip: str
    ukey: str
    image: str
    name: str
    email: str
    tenant_website_id: int
    password: str
    password_reset_code: str
    contact: str
    address: str
    city_id: str
    country_id: str
    gender: str
    dob: str
    status: str
    active: str
    deleted: str
    add_by: str
    edit_by: str
    deleted_by: str
    createdon: str
    updatedon: str


@form_body
class CreateTenantAdmin(BaseModel):
    id: Optional[int] = 0
    role: Optional[int] = 0
    role_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    # tenant_website_id: Optional[int] = 0
    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    image: Optional[str] = ""
    tenant_id: Optional[int] = 0
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    user_type: Optional[int] = 0
    email: Optional[str] = ""
    password: Optional[str] = ""
    password_reset_code: Optional[str] = ""
    contact: Optional[str] = ""
    address: Optional[str] = ""
    city_id: Optional[int] = 0
    country_id: Optional[int] = 0
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    verification_code: Optional[str] = ""
    subscription_plan: Optional[str] = ""
    # tenant_industry: Optional[str] = ""
    # team_size: Optional[str] = ""
    # tenant_employee_status: Optional[str] = ""
    is_verified: Optional[int] = 0
    # company_name: Optional[str] = ""
    
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = ""
    updatedon: Optional[str] = ""


@form_body
class UpdateTenantAdmin(BaseModel):
    tenant_website_id: Optional[int] = 0
    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    image: Optional[str] = ""
    tenant_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    name: Optional[str] = ""
    last_name: Optional[str] = ""
    email: Optional[str] = ""
    password: Optional[str] = ""
    password_reset_code: Optional[str] = ""
    contact: Optional[str] = ""
    address: Optional[str] = ""
    city_id: Optional[int] = 0
    country_id: Optional[int] = 0
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    signup_code: Optional[str] = ""
    subscription_plan: Optional[str] = ""
    tenant_industry: Optional[str] = ""
    team_size: Optional[str] = ""
    tenant_employee_status: Optional[str] = ""
    # company_name: Optional[str] = ""
    # company_website: Optional[str] = ""
    
    edit_by: Optional[int] = 0
    updatedon: Optional[str] = ""


@form_body
class SystemCreateUsers(BaseModel):
    id: Optional[int] = 0
    role: Optional[int] = 0
    department_id: Optional[list] = []
    app_id: Optional[list] = []
    tenant_website_id: Optional[list] = []
    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    image: Optional[str] = ""
    name: Optional[str] = ""
    email: Optional[str] = ""
    password: Optional[str] = ""
    password_reset_code: Optional[str] = ""
    contact: Optional[str] = ""
    address: Optional[str] = ""
    city_id: Optional[int] = 0
    country_id: Optional[int] = 0
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    tenant_id: Optional[int] = 0
    
    status: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = ""
    updatedon: Optional[str] = ""


@form_body
class UpdateSystemUser(BaseModel):
    id: Optional[int] = 0
    role: Optional[int] = 0
    department_id: Optional[list] = []
    app_id: Optional[list] = []
    tenant_website_id: Optional[list] = []
    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    image: Optional[str] = ""
    name: Optional[str] = ""
    gender: Optional[str] = ""
    email: Optional[str] = ""
    password: Optional[str] = ""
    tenant_id: Optional[int] = 0
    
    edit_by: Optional[int] = 0
    updatedon: Optional[str] = ""


@form_body
class CreateSystemUser(BaseModel):
    id: Optional[int] = 0
    tenant_id: Optional[int] = 0
    role: Optional[int] = 4
    name: Optional[str] = ""
    email: Optional[str] = ""
    image: Optional[str] = ""
    password: Optional[str] = ""
    password_reset_code: Optional[str] = ""
    contact: Optional[str] = ""
    address: Optional[str] = ""
    city_id: Optional[int] = 0
    country_id: Optional[int] = 0
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    
    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    last_login: Optional[str] = ""

    status: Optional[int] = 0
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class UpdateSystemUser(BaseModel):
    id: Optional[int] = 0
    role: Optional[int] = 4
    name: Optional[str] = ""
    email: Optional[str] = ""
    image: Optional[str] = ""
    contact: Optional[str] = ""
    address: Optional[str] = ""
    city_id: Optional[int] = 0
    country_id: Optional[int] = 0
    gender: Optional[str] = ""
    dob: Optional[str] = ""

    ip: Optional[str] = ""
    ukey: Optional[str] = ""
    last_login: Optional[str] = ""
    
    status: Optional[int] = 0
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class CreateUsersAppAccess(BaseModel):
    id: Optional[int] = 0
    user_id: Optional[int] = 0
    user_role_id: Optional[int] = 0
    tenant_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    app_id: Optional[int] = 0

    status: Optional[int] = 0
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    # Session User Role Info
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class UpdateUsersAppAccess(BaseModel):
    # id: Optional[int] = 0
    user_role_id: Optional[int] = 0
    profile_id: Optional[int] = 0

    status: Optional[int] = 0
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    # Session User Role Info
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    updatedon: Optional[str] = datetime.now(timezone.utc)

@form_body
class UpdateSAdminUser(BaseModel):
    id: Optional[int] = 0
    tenant_website_id: Optional[int] = 0
    image: Optional[str] = ""
    name: Optional[str] = ""
    gender: Optional[str] = ""
    email: Optional[str] = ""
    password: Optional[str] = ""
    contact : Optional[str] = ""
    address: Optional[str] = ""


@form_body
class TenantAdminApps(BaseModel):
    id: Optional[int] = 0
    tenant_admin_id: Optional[int] = 0
    tenant_website_id: Optional[int] = 0
    app_id: Optional[int] = 0
    module_id:Optional[int] = 0
    
    
    status: Optional[int] = 0
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = ""
    
    
@form_body
class UpdateTenantAdminApps(BaseModel):
    id: Optional[int] = 0
    tenant_admin_id: Optional[int] = 0
    tenant_website_id: Optional[int] = 0
    tenant_app_id: Optional[int] = 0
    tenant_feature_group_ids: Optional[list] = []
    
    sort_by: Optional[int] = 0
    active: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = ""


@form_body
class CreateOrganization(BaseModel):
    id: Optional[int] = 0
    name: Optional[str] = ""
    domain: Optional[str] = ""
    domain_type: Optional[str] = ""
    tenant_id: Optional[int] = 0
    phone: Optional[str] = ""
    mobile: Optional[str] = ""
    fax_no: Optional[str] = ""
    address: Optional[str] = ""
    language: Optional[str] = ""
    user_timezone: Optional[str] = ""
    
    active: Optional[int] = 0
    deletable: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)
    
    
@form_body
class UpdateOrganization(BaseModel):
    name: Optional[str] = ""
    tenant_id: Optional[int] = 0
    phone: Optional[str] = ""
    email: Optional[str] = ""
    mobile: Optional[str] = ""
    fax_no: Optional[str] = ""
    address: Optional[str] = ""
    language: Optional[str] = ""
    user_timezone: Optional[str] = ""
    
    deleted: Optional[int] = 0
    edit_by: Optional[int] = 0
    role_id: Optional[int] = 0
    deleted_by: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class CreateRoles(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    tenant_id:Optional[int] = 0
    report_to:Optional[int] = 0
    tier:Optional[int] = 1
    app_id:Optional[int] = 0
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()

@form_body
class UpdateRoles(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    tenant_id: Optional[int] = 0
    report_to: Optional[int] = 0
    tier:Optional[int] = 1
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()


@form_body
class CreateProfile(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    description: Optional[str] = ""
    tenant_id:Optional[int] = 0
    app_id:Optional[int] = 0
    is_admin_profile:Optional[int] = 0
    is_administrator:Optional[int] = 0
    system_define:Optional[int] = 0
    
    active: Optional[int] = 1
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()

@form_body
class UpdateProfile(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    description: Optional[str] = ""
    tenant_id: Optional[int] = 0
    app_id: Optional[int] = 0
    
    active: Optional[int] = 1
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()


@form_body
class CreatePermissionGroup(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    # tenant_id: Optional[int] = 0
    app_id: Optional[int] = 0
    group_type: Optional[str] = ""
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class UpdatePermissionGroup(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    # tenant_id: Optional[int] = 0
    app_id: Optional[int] = 0
    group_type: Optional[str] = ""
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()


@form_body
class CreatePermission(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    tenant_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    app_id: Optional[int] = 0
    permission_group_id: Optional[int] = 0
    module_id: Optional[int] = 0
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class UpdatePermission(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    tenant_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    app_id: Optional[int] = 0
    permission_group_id: Optional[int] = 0
    module_id: Optional[int] = 0
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()


@form_body
class CreateRolePermission(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    tenant_id: Optional[int] = 0
    profile_id: Optional[int] = 0
    app_id: Optional[int] = 0
    permission_group_id: Optional[int] = 0
    permission_id: Optional[int] = 0
    module_id: Optional[int] = 0

    view: Optional[int] = 1
    add: Optional[int] = 0
    edit: Optional[int] = 0
    delete: Optional[int] = 0
    import_record: Optional[int] = 0
    export_record: Optional[int] = 0
    sale_person_filter: Optional[int] = 0
    assign_filter: Optional[int] = 0
    
    active: Optional[int] = 1
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0

    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


@form_body
class UpdateRolePermission(BaseModel):
    id: Optional[int] = 0
    add: Optional[int] = 0
    edit: Optional[int] = 0
    delete: Optional[int] = 0
    view: Optional[int] = 0
    import_record: Optional[int] = 0
    export_record: Optional[int] = 0
    sale_person_filter: Optional[int] = 0
    assign_filter: Optional[int] = 0

    active: Optional[int] = 1
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    
    role_id: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 0
    updatedon: Optional[str] = datetime.now()


@form_body
class CreateProfilePrivileges(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    profile_id: Optional[int] = 0
    privilege_group_id: Optional[int] = 0
    department_id: Optional[int] = 0
    app_id: Optional[int] = 0
    tenant_website_id:Optional[int] = 0
    tenant_id:Optional[int] = 0
    role_id: Optional[int] = 0
    add: Optional[int] = 1
    edit: Optional[int] = 1
    delete: Optional[int] = 1
    view: Optional[int] = 1
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 1
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()
   
@form_body
class UpdateProfilePrivileges(BaseModel):
    id: Optional[int] = 0
    title: Optional[str] = ""
    privilege_id: Optional[int] = 0
    privilege_group_id: Optional[int] = 0
    department_id: Optional[int] = 0
    app_id: Optional[int] = 0
    tenant_website_id:Optional[int] = 0
    tenant_id:Optional[int] = 0
    role_id: Optional[int] = 0
    add: Optional[int] = 0
    edit: Optional[int] = 0
    delete: Optional[int] = 0
    view: Optional[int] = 0
    
    active: Optional[int] = 0
    sort_by: Optional[int] = 0
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    deletable: Optional[int] = 1
    createon: Optional[str] = datetime.now()
    updatedon: Optional[str] = datetime.now()


class company_search_filters(BaseModel):
    nPerPage: Optional[int] = 0
    pageNumber: Optional[int] = 0
    search_filters: Optional[list] = []
    
    # tenant_website_id: Optional[int] = 0
    # layout_id: Optional[int] = 0
    
    isDeleted: Optional[int] = 0
    isActive: Optional[int] = 0


@form_body
class TenantSignupStep1(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

@form_body
class TenantVerificationStep2(BaseModel):
    email: str
    verification_code: str

@form_body
class TenantCompanyInfoStep3(BaseModel):
    company_name: str
    industry: str
    company_size: str

@form_body
class TenantDomainInfoStep4(BaseModel):
    domain_type: str
    domain: str

@form_body
class TenantModulesStep5(BaseModel):
    modules: str  # JSON string of selected modules
