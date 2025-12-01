import string
from app.helpers.general_helper import random_with_n_digits, sendChangePasswordEmail
from fastapi import APIRouter,Depends, Request, Body, Form, status
from app.models.auth.system_users import *
from app.networks.database import db, db_meta
import json
import re
from app.helpers.globalfunctions import *
from random import *
from random import randint
import urllib.parse
import requests

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.helpers.uploadimage import UploadImage
from app.utils import utils, config, oauth2
from datetime import datetime
from app.utils.utils import generate_hashed_password
#import bcrypt
#from app.routes.super_admin.settings import get_settings
from fastapi.responses import JSONResponse
from typing import List
import user_agents
from bson import ObjectId
import importlib.util


tenant_admin_auth = APIRouter( tags= ['Autherization - CRM User']) 
listing_views_collection = db.listing_views
NO_ID_PROJECTION = {"_id": 0}

# Import CreateTenantAdmin from system_users module
spec = importlib.util.spec_from_file_location("system_users", "app/models/auth/system_users.py")
system_users = importlib.util.module_from_spec(spec)
spec.loader.exec_module(system_users)
CreateTenantAdmin = system_users.CreateTenantAdmin
CreateOrganization = system_users.CreateOrganization

# ==================================
# Tenant Onboarding API - starting
# ==================================
async def process_module_layouts(modules_str: str, tenant_id: int) -> dict:

    try:
        # Parse the modules JSON string
        modules_data = json.loads(modules_str)
        
        # For each app and its modules
        for app_id, module_ids in modules_data.items():
            app_id = int(app_id)
            
            # For each module in the app
            for module_id in module_ids:
                # First check if layout exists in tenant layouts
                existing_layout = db.layouts.find_one({
                    "app_id": app_id,
                    "module_id": module_id,
                    "tenant_id": tenant_id,
                },{"_id":0})
                
                if not existing_layout:
                    # If not found in tenant layouts, check default layouts
                    default_layout = db.layouts.find_one({
                        "app_id": app_id,
                        "module_id": module_id,
                        "tenant_id": 0
                    },{"_id":0})
                    
                    if default_layout:
                        # Create new layout from default layout
                        new_layout = default_layout.copy()
                        if "_id" in new_layout:
                            del new_layout["_id"]
                        new_layout["tenant_id"] = tenant_id
                        new_layout["id"] = int(getLastUserId(db.layouts, "id")) + 1
                        new_layout["createdon"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        new_layout["updatedon"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        db.layouts.insert_one(new_layout)

                        # new_layout = {
                        #     "id": int(getLastUserId(db.layouts, "id")) + 1,
                        #     "app_id": app_id,
                        #     "module_id": module_id,
                        #     "tenant_id": tenant_id,
                        #     "layout": default_layout.get("layout", {}),
                        #     "active": 1,
                        #     "createdon": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        #     "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        # }
                        
                        # Insert new layout
                        # db.layouts.insert_one(new_layout)  # Already inserted above
                        
                        # If default layout has a form, create a new form
                        default_listing_view= db.listing_views.find_one({
                            "layout_id": default_layout["id"],
                            "module_id": module_id,
                            "tenant_id": tenant_id
                        },{"_id":0})
                        
                        if not default_listing_view:
                            # This block is likely incorrect: you can't copy a None object. Instead, you probably want to copy from the default listing_view (tenant_id=0)
                            default_listing_view_template = db.listing_views.find_one({
                                "layout_id": default_layout["id"],
                                "module_id": module_id,
                                "tenant_id": 0
                            },{"_id":0})
                            if default_listing_view_template:
                                new_listing_view = default_listing_view_template.copy()
                                if "_id" in new_listing_view:
                                    del new_listing_view["_id"]
                                new_listing_view["tenant_id"] = tenant_id
                                last_listing_view = db.listing_views.find_one({}, sort=[('ukey', -1)])
                                if last_listing_view and 'ukey' in last_listing_view and str(last_listing_view['ukey']).isdigit():
                                    ukey = int(last_listing_view['ukey']) + 1
                                else:
                                    ukey = 1
                                new_listing_view["ukey"] = str(ukey)
                                new_listing_view["id"] = int(getLastUserId(db.listing_views, "id")) + 1
                                new_listing_view["createdon"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                new_listing_view["updatedon"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                db.listing_views.insert_one(new_listing_view)



                            # new_form = {
                            #     "id": int(getLastUserId(db.forms, "id")) + 1,
                            #     "layout_id": new_layout["id"],
                            #     "module_id": module_id,
                            #     "tenant_id": tenant_id,
                            #     "form": default_form.get("form", {}),
                            #     "active": 1,
                            #     "createdon": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            #     "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            # }
                            # db.forms.insert_one(new_form)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Module layouts processed successfully"
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"Invalid modules JSON format: {str(e)}"
        }
    except Exception as e:
        return {
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": f"Error processing module layouts: {str(e)}"
        }

@tenant_admin_auth.post('/auth/tenant-signup')
async def tenant_signup(request: Request):
    try:
        # Get form data
        request_form = await request.form()
        
        # Get and validate required fields
        first_name = request_form.get('first_name')
        last_name = request_form.get('last_name')
        email = request_form.get('email')
        password = request_form.get('password')
        
        # Validate required fields
        if not all([first_name, last_name, email, password]):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "All fields are required",
                    "error": True
                }
            )

        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "Invalid email format",
                    "error": True
                }
            )

        # Check if email already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "Email already registered",
                    "error": True
                }
            )

        # Generate verification code
        verification_code = random_with_n_digits(6)
        
        # Hash password
        hashed_password = generate_hashed_password(password)
        
        # Create new Tenant user using CreateTenantAdmin model
        new_tenant = CreateTenantAdmin(
            id=int(db.users.count_documents({})) + 1,
            first_name=first_name,
            last_name=last_name,
            email=email,
            user_type=1,
            password=hashed_password,
            role=1,  # Tenant role
            tenant_id=int(db.users.count_documents({})) + 1,
            verification_code=verification_code,
            is_verified=0,
            active=0,
            deleted=0,
            createdon=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            updatedon=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Convert model to dict and insert into database
        result = db.users.insert_one(new_tenant.dict(exclude_none=True))
        
        if not result.inserted_id:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "Failed to create user",
                    "error": True
                }
            )
        
        # Send verification email
        try:
            message = Mail(
                from_email='noreply@businessesify.com',
                to_emails=email,
                subject='Verify your email address',
                html_content=f'Your verification code is: {verification_code}'
            )
            sg = SendGridAPIClient(config.SENDGRID_API_KEY)
            sg.send(message)
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            # Don't return error here as user is already created
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": status.HTTP_200_OK,
                "message": "Tenant registered successfully. Please check your email for verification code.",
                "data": {"email": email},
                "error": False
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": f"Something went wrong: {str(e)}",
                "error": True,
                "line_no": e.__traceback__.tb_lineno
            }
        )

@tenant_admin_auth.post('/auth/tenant-verify')
async def tenant_verify(request: Request):
    try:
        request_form = await request.form()
        
        # Get form data
        email = request_form.get('email')
        verification_code = request_form.get('verification_code')
        
        # Validate required fields
        if not all([email, verification_code]):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "All fields are required"
            }

        # Find Tenant by email
        tenant = db.users.find_one({"email": email})
        if not tenant:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant not found"
            }
            
        # Verify code
        if tenant.get("verification_code") != verification_code:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Invalid verification code"
            }
            
        # Create update data while preserving existing fields
        update_data = {
            "is_verified": 1,
            "active": 1,
            "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Update Tenant status
        db.users.update_one(
            {"email": email},
            {"$set": update_data}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Email verified successfully"
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

@tenant_admin_auth.post('/auth/tenant-company-info')
async def tenant_company_info(request: Request):
    try:
        request_form = await request.form()
        
        # Get form data
        email = request_form.get('email')
        company_name = request_form.get('company_name')
        industry = request_form.get('industry')
        company_size = request_form.get('company_size')
        
        # Validate required fields
        if not all([email, company_name, industry, company_size]):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "All fields are required"
            }

        # Find Tenant by email
        user_data = db.users.find_one({"email": email})
        if not user_data:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "User not found"
            }

        # Create update data while preserving existing fields
        update_data = {
            "company_name": company_name,
            "industry": industry,
            "company_size": company_size,
            "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Update Tenant company information
        db.companies.insert_one(
            {
                "id" : int(db.companies.count_documents({})) + 1,
                "user_id": user_data["id"],
                "company_name": company_name,
                "industry": industry,
                "tenant_id": user_data["tenant_id"],
                "company_size": company_size,
                "createdon": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
           
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Company information updated successfully"
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

@tenant_admin_auth.post('/auth/tenant-domain-info')
async def tenant_domain_info(request: Request):
    try:
        request_form = await request.form()
        
        # Get form data
        email = request_form.get('email')
        domain_type = request_form.get('domain_type')
        domain = request_form.get('domain')
        
        # Validate required fields
        if not all([email, domain_type, domain]):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "All fields are required"
            }

        # Find Tenant by email
        user_data = db.users.find_one({"email": email})
        if not user_data:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "User not found"
            }

        # Create organization using CreateOrganization model
        company_data = CreateOrganization(
            # name=Tenant.get("company_name", ""),
            domain=domain,
            domain_type = domain_type,
            tenant_id=user_data.get("tenant_id"),
            # createdon=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            # updatedon=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Insert organization
        result = db.companies.update_one(
            {"user_id": user_data.get("id")},
            {"$set": company_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Domain information updated successfully"
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

@tenant_admin_auth.post('/auth/tenant-modules')
async def tenant_modules(request: Request):
    try:
        request_form = await request.form()
        
        # Get form data
        email = request_form.get('email')
        modules_str = request_form.get('apps')
        
        # Validate required fields
        if not all([email, modules_str]):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "All fields are required"
            }

        # Find Tenant by email
        tenant = db.users.find_one({"email": email})
        if not tenant:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant not found"
            }

        # Get tenant_id
        tenant_id = tenant.get("id")

        # Create tenant app entry
        app_data = {
            "id": int(getLastUserId(db.tenant_apps, "id")) + 1,
            "tenant_id": tenant_id,
            "apps": modules_str,
            "active": 1,
            "createdon": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "updatedon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Insert into tenant_apps
        db.tenant_apps.insert_one(app_data)

        # Process modules and layouts
        layout_result = await process_module_layouts(modules_str, tenant["tenant_id"])
        if layout_result["status"] != status.HTTP_200_OK:
            return layout_result
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Modules and layouts updated successfully"
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }
# ==================================
# Tenant Onboarding API - ending
# ==================================


# Collections
permissions_collection = db.permissions
profile_permissions_collection = db.profile_permissions

# =====================================
# Tenant Login/Logout API - starting
# =====================================
def get_privilegesbyroleid(id):
    result_array = []    
    resultItem = db.roles_privileges_add.find({"role_id": int(id), "deleted": 0},{"_id":0})
    if resultItem:
        for result in resultItem:
            result_array.append(result)
        
        return result_array
    else:
        return []    

def get_browser_info(user_agent_string: str) -> dict:
    """Extract browser and device information from user agent string."""
    try:
        user_agent = user_agents.parse(user_agent_string)
        return {
            "browser": user_agent.browser.family,
            "browser_version": f"{user_agent.browser.version_string}",
            "os": user_agent.os.family,
            "os_version": user_agent.os.version_string,
            "device": user_agent.device.family,
            "device_type": "mobile" if user_agent.is_mobile else "tablet" if user_agent.is_tablet else "desktop"
        }
    except:
        return {
            "browser": "Unknown",
            "browser_version": "Unknown",
            "os": "Unknown",
            "os_version": "Unknown",
            "device": "Unknown",
            "device_type": "Unknown"
        }

def single_entity(item) -> dict:
    return {item["key"]: item["value"]}

def records_entity(settings_list) -> dict:
    merged = {}
    for item in settings_list:
        merged.update(single_entity(item))
    return merged

def get_permissions(profile_id):
    """Get permissions for a profile with full permission details"""
    try:
        # Get profile permissions (contains permission IDs like "[1,3,7]")
        profile_perms = profile_permissions_collection.find_one({"profile_id": profile_id}, {"_id": 0, "permissions": 1})
        
        if not profile_perms or not profile_perms.get("permissions"):
            return []
        
        # Parse the permissions string to get permission IDs
        permissions_str = profile_perms["permissions"]
        if isinstance(permissions_str, str):
            # Remove brackets and split by comma
            permissions_str = permissions_str.strip("[]")
            permission_ids = [int(pid.strip()) for pid in permissions_str.split(",") if pid.strip()]
        elif isinstance(permissions_str, list):
            permission_ids = permissions_str
        else:
            return []
        
        # Fetch full permission details from permissions collection
        permissions = list(permissions_collection.find(
            {"id": {"$in": permission_ids}, "deleted": {"$ne": 1}},
            {"_id": 0}
        ).sort("sort_by", 1))
        
        # Convert to list of permission objects
        result = []
        for permission in permissions:
            permission_data = {
                "id": permission["id"],
                "title": permission["title"],
                "key": permission.get("key", ""),
                "active": permission.get("active", 1),
                "permission_group_id": permission.get("permission_group_id", ""),
                "sort_by": permission.get("sort_by", 0)
            }
            result.append(permission_data)
        
        return result
        
    except Exception as e:
        print(f"Error getting permissions for profile {profile_id}: {str(e)}")
        return []

@tenant_admin_auth.post("/auth/tenant-login")
async def tenant_login(request: Request):
    try:
        # Get and validate form data
        try:
            user_credentials = await request.form()
            email = user_credentials.get("email")
            password = user_credentials.get("password")
        except Exception as form_error:
            # If form parsing fails, try JSON
            try:
                body = await request.json()
                email = body.get("email")
                password = body.get("password")
            except Exception as json_error:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "status": status.HTTP_400_BAD_REQUEST,
                        "message": "Failed to parse request data. Expected form data or JSON.",
                        "form_error": str(form_error),
                        "json_error": str(json_error)
                    }
                )

        if not email or not password:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": status.HTTP_400_BAD_REQUEST, 
                    "message": "Email and password are required"
                }
            )

        # Get browser info from user agent
        user_agent = request.headers.get("user-agent", "")
        browser_info = get_browser_info(user_agent)

        # Get tenant from database with all required fields
        tenant = db.users.find_one(
            {"email": email},
            {
                "_id": 0,
                "id": 1,
                "email": 1,
                "password": 1,
                "role": 1,
                "settings": 1,
                "tenant_id": 1,
                "name": 1,
                "last_name": 1,
                "is_verified": 1,
                "active": 1,
                "deleted": 1
            }
        )
        
        if not tenant:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"status": status.HTTP_404_NOT_FOUND, "message": "tenant not found"}
            )

        # Check if account is active and not deleted
        if tenant.get("active", 0) == 0 or tenant.get("deleted", 0) == 1:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"status": status.HTTP_403_FORBIDDEN, "message": "Account is not active or has been deleted"}
            )

        # Check if email is verified
        if tenant.get("is_verified", 0) == 0:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"status": status.HTTP_403_FORBIDDEN, "message": "Please verify your email first"}
            )

        # Verify password
        if not utils.verify(password, tenant["password"]):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"status": status.HTTP_401_UNAUTHORIZED, "message": "Invalid credentials"}
            )

        # Create access token
        access_token = oauth2.create_businessify_token(data={
            "id": int(tenant['id']), 
            "role": tenant["role"], 
            "tenant_id": tenant.get("tenant_id", tenant["id"])  # Use tenant_id if exists, otherwise use id
        })

        # Get tenant_apps
        tenant_apps = list(db.tenant_apps.find({"tenant_id": tenant.get("tenant_id", tenant["id"])}, {"_id": 0}))

        # Process tenant_apps
        # Convert tenant_apps to list of dicts and handle ObjectId, excluding _id
        tenant_apps = [{k: str(v) if isinstance(v, ObjectId) else v for k, v in app.items() if k != '_id'} for app in tenant_apps]

        # Process layouts for each tenant app
        for tenant_app in tenant_apps:
            layout_result = await process_module_layouts(tenant_app["apps"], tenant.get("tenant_id"))
            if layout_result["status"] != status.HTTP_200_OK:
                return layout_result
        
        # Organize apps and modules
        apps_dict = {}
        for tenant_app in tenant_apps:
            try:
                # Parse the apps JSON string
                apps_data = json.loads(tenant_app["apps"])
                
                # For each app and its modules
                for app_id, module_ids in apps_data.items():
                    app_id = str(app_id)
                    
                    # Get app details
                    app = db.apps.find_one({"id": int(app_id)})
                    if not app:
                        continue
                        
                    # Convert app to dict and handle ObjectId, excluding _id
                    app_dict = {k: str(v) if isinstance(v, ObjectId) else v for k, v in app.items() if k != '_id'}
                        
                    if app_id not in apps_dict:
                        apps_dict[app_id] = {
                            "id": app_id,
                            "title": app_dict["title"],
                            "slug": app_dict["slug"],
                            "root_url": app_dict["root_url"],
                            "icon": app_dict["icon"],
                            "banner": app_dict["banner"],
                            "thumbnail": app_dict["thumbnail"],
                            "excerpt": app_dict["excerpt"],
                            "icon_class": app_dict["icon_class"],
                            "active": app_dict["active"],
                            "sort_by": app_dict["sort_by"],                            
                            "modules": []
                        }
                    
                    # Get modules for this app
                    modules = list(db.modules.find(
                        {
                            "id": {"$in": module_ids},
                            "app_id": int(app_id)
                        },
                        {"_id": 0}
                    ).sort("sort_by", 1))

                    for module in modules:

                        """
                        layouts = list(db.layouts.find({
                            "module_id": int(module["id"]),
                            "tenant_id": tenant.get("tenant_id")
                        },{"_id": 0}))

                        layout_forms = []
                        for layout in layouts:
                            layout["form"] = db.forms.find_one({"layout_id": layout["id"],"module_id": int(module["id"]),"tenant_id": tenant.get("tenant_id")})
                            layout_forms.append(layout)
                        # Convert modules to list of dicts and handle ObjectId, excluding _id
                        modules = [{k: str(v) if isinstance(v, ObjectId) else v for k, v in module.items() if k != '_id'} for module in modules]
                        custom_views_url = listing_views_collection.find_one({"module": module["slug"],"tenant_id": tenant.get("tenant_id"),"default": 1},{"_id": 0,"ukey":1})
                        
                        # Add modules to the app
                        module["layouts"] = layout_forms
                        """
                        
                        # Get custom view URL for the module
                        custom_views_url = db.modules_custom_views.find_one(
                            {
                                "module_id": module["id"],
                                "tenant_id": int(tenant.get("tenant_id")),
                                "default": 1,
                                "deleted": {"$ne": 1}
                            },
                            {"_id": 0, "ukey": 1}
                        )
                        
                        # Set custom view URL with fallback
                        """
                        module["custom_view_url"] = (
                            f"custom-view/{custom_views_url['ukey']}" 
                            if custom_views_url and custom_views_url.get("ukey")
                            else "custom-view/1"
                        )
                        """
                        if custom_views_url and custom_views_url.get("ukey"):
                            module["custom_view_url"] = f"custom-view/{custom_views_url['ukey']}"
                        else:
                            module["custom_view_url"] = "custom-view/1"
                        
                        # Get layouts for the module
                        module["layouts"] = list(db.layouts.find(
                            {
                                "module_id": int(module["id"]), 
                                "tenant_id": int(tenant.get("tenant_id")),
                                "deleted": {"$ne": 1}
                            },
                            {"_id": 0}
                        ))
                        
                            
                        apps_dict[app_id]["modules"].append(module)

                    
                    # for module in modules:
                    #     #module = db.modules.find_one
                    #     layouts = list(db.layouts.find({
                    #         "module_id": {"$in": module_ids},
                    #         "tenant_id": tenant.get("tenant_id")
                    #     },{"_id": 0}))

                    #     for layout in layouts:
                    #         layout["form"] = db.forms.find_one({"layout_id": layout["id"],"module_id": module,"tenant_id": tenant.get("tenant_id")})

                    #     layout_forms = []
                    #     for layout in layouts:
                    #         layout["form"] = db.forms.find_one({"layout_id": layout["id"],"module_id": module,"tenant_id": tenant.get("tenant_id")})
                    #         layout_forms.append(layout)
                        
                    # # Convert modules to list of dicts and handle ObjectId, excluding _id
                    # modules = [{k: str(v) if isinstance(v, ObjectId) else v for k, v in module.items() if k != '_id'} for module in modules]
                    
                    # Add modules to the app
                    # for module in modules:
                    #     module["layouts"] = layout_forms
                    #     apps_dict[app_id]["modules"].append(module)
                        
                        

            except json.JSONDecodeError:
                continue

        # Convert tenant to dict and handle ObjectId, excluding _id
        tenant_dict = {k: str(v) if isinstance(v, ObjectId) else v for k, v in tenant.items() if k != '_id'}

        # Prepare tenant data
        tenant_data = {
            "id": tenant_dict["id"],
            "email": tenant_dict["email"],
            "first_name": tenant_dict.get("first_name", ""),
            "last_name": tenant_dict.get("last_name", ""),
            "role": tenant_dict["role"],
            "tenant_id": str(tenant_dict.get("tenant_id", tenant_dict["id"])),
            "apps": list(apps_dict.values()),
            "settings": tenant_dict.get("settings", {}),
            
        }

        # Convert any remaining datetime fields in tenant_data
        for key, value in tenant_dict.items():
            if isinstance(value, datetime):
                tenant_data[key] = value.strftime("%Y-%m-%d %H:%M:%S")

        # Create response data
        response_data = {
            "status": status.HTTP_200_OK,
            "message": "Login successful",
            "token": access_token,
            "data":{
            "id": tenant_dict["id"],
            "email": tenant_dict["email"],
            "first_name": tenant_dict.get("first_name", ""),
            "last_name": tenant_dict.get("last_name", ""),
            "role": tenant_dict["role"],
            "tenant_id": str(tenant_dict.get("tenant_id", tenant_dict["id"])),
            "apps": list(apps_dict.values()),
            "settings": tenant_dict.get("settings", {}),
            "permissions": get_permissions(tenant_dict.get("profile_id")),
            }
            ,"tenant_apps": json.loads(tenant_apps[0]["apps"]) if tenant_apps else {}
        }

        # Convert any remaining datetime objects in the response
        def convert_datetime(obj):
            if isinstance(obj, dict):
                return {key: convert_datetime(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(item) for item in obj]
            elif isinstance(obj, datetime):
                return obj.strftime("%Y-%m-%d %H:%M:%S")
            elif isinstance(obj, ObjectId):
                return str(obj)
            return obj

        response_data = convert_datetime(response_data)

        # Store login log with enhanced client information
        login_log = {
            "user_id": tenant["id"],
            "tenant_id": tenant.get("tenant_id", tenant["id"]),
            "email": email,
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": user_agent,
            "browser": browser_info["browser"],
            "browser_version": browser_info["browser_version"],
            "os": browser_info["os"],
            "os_version": browser_info["os_version"],
            "device": browser_info["device"],
            "device_type": browser_info["device_type"],
            "login_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "success",
            "createdon": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        db.tenant_login_logs.insert_one(login_log)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response_data
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": str(e)
            }
        )

    
@tenant_admin_auth.post("/auth/tenant-logout")
async def tenant_logout(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get current time for logout
        logout_time = datetime.now()
        logout_time_str = logout_time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Get tenant ID from token
        user_id = user_detail.get("id")
        tenant_id = user_detail.get("tenant_id")
        
        # Update user's login status
        db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "is_logged": False,
                    "last_logout": logout_time_str,
                    "updatedon": logout_time_str
                }
            }
        )

        # Find the most recent successful login log for this tenant
        last_login_log = db.tenant_login_logs.find_one(
            {
                "user_id": user_id,
                "status": "success"
            },
            sort=[("login_time", -1)]  # Sort by login_time descending to get most recent
        )

        if last_login_log:
            # Calculate session duration
            login_time = datetime.strptime(last_login_log["login_time"], "%Y-%m-%d %H:%M:%S")
            session_duration = (logout_time - login_time).total_seconds()  # Duration in seconds

            # Update the login log with logout information
            db.tenant_login_logs.update_one(
                {"_id": last_login_log["_id"]},
                {
                    "$set": {
                        "tenant_id":tenant_id,"logout_time": logout_time_str,
                        "session_duration": session_duration,
                        "updatedon": logout_time_str
                    }
                }
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": status.HTTP_200_OK,
                "message": "Logout successful",
                "data": {
                    "user_id": user_id,
                    "logout_time": logout_time_str,
                    "session_duration": session_duration if last_login_log else None
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": str(e)
            }
        )

@tenant_admin_auth.post('/apps/modules')
async def get_all_apps(user_detail: dict = Depends(oauth2.get_businessify_user)):
    try:
        data = []    
        apps = db.apps.find({}, {"_id": 0}).sort("sort_by", 1)
        if apps:
            for app in apps:
                app_id = str(app['id'])

                app['modules'] = list(db.modules.find({'app_id': {'$eq': app_id}}, {"_id": 0}).sort("sort_by", 1))
                data.append(app)

        return data
    
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

@tenant_admin_auth.get("/auth/user-login-history")
async def get_user_login_history( user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find all login logs for the given tenant_id
        login_logs = list(db.tenant_login_logs.find(
            {"tenant_id": user_detail["tenant_id"]},
            {"_id": 0}  # Exclude MongoDB _id field
        ).sort("login_time", -1))  # Sort by login time descending (most recent first)

        # Convert datetime objects to strings in the response
        for log in login_logs:
            log["first_name"] = db.users.find_one({"id": log["user_id"]}, {"first_name": 1, "_id": 0}).get("first_name", "")
            log["last_name"] = db.users.find_one({"id": log["user_id"]}, {"last_name": 1, "_id": 0}).get("last_name", "")
            log["id"] = user_detail["tenant_id"]
            for key, value in log.items():
                if isinstance(value, datetime):
                    log[key] = value.strftime("%Y-%m-%d %H:%M:%S")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": status.HTTP_200_OK,
                "message": "Login history retrieved successfully",
                "data": login_logs
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": str(e)
            }
        )
# =====================================
# Tenant Login/Logout API - ending
# =====================================

