from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db
from bson import ObjectId
import traceback
import sys
from fastapi.responses import JSONResponse
from app.utils import oauth2
from datetime import datetime
from typing import List
from app.utils.utils import generate_hashed_password
from app.helpers.uploadimage import UploadImage
from app.utils import config, oauth2

crm_settings = APIRouter(tags=["CRM Admin - Settings"])
company_collection = db.companies
companies_collection = db.companies
system_settings_collection = db.system_settings

from app.helpers.general_helper import convert_to_jsonable, get_error_details



# ================================
# CRUD for Companies - starting
# ================================
@crm_settings.post("/crm_settings/companies/save")
async def save_company(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        formated_name = " ".join(request_form["company_name"].lower().split())
        if int(request_form["id"]) == 0:
            validation = companies_collection.find_one({"company_name": formated_name})
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Company already exists"}

            company = dict(request_form)
            company["id"] = int(companies_collection.count_documents({})) + 1
            company["tenant_id"] = user_detail["tenant_id"]
            company["active"] = int(request_form.get("active", 1))
            company["sort_by"] = int(request_form.get("sort_by", 0))
            
            if request_form["logo"]:
                    newFileName = UploadImage.uploadImage_DO(
                        request_form["logo"], "crm"
                    )
                    company["logo"] = config.IMAGE_DO_URL + newFileName
            else:
                    company["logo"] = request_form["old_logo"]

            companies_collection.insert_one(company)
            return {
                "status": status.HTTP_200_OK,
                "message": "Company created successfully",
                "data": convert_to_jsonable(company)
            }
        else:
            validation = companies_collection.find_one({
                "company_name": request_form["company_name"],
                "id": {"$ne": int(request_form["id"])}
            })
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Company already exists"}

            company = dict(request_form)
            company["id"] = int(request_form["id"])
            company["tenant_id"] = user_detail["tenant_id"]
            company["active"] = int(request_form.get("active", 1))
            company["sort_by"] = int(request_form.get("sort_by", 0))

            if request_form["logo"]:
                    newFileName = UploadImage.uploadImage_DO(
                        request_form["logo"], "crm"
                    )
                    company["logo"] = config.IMAGE_DO_URL + newFileName
            else:
                    company["logo"] = request_form["old_logo"]

            companies_collection.update_one({"id": int(request_form["id"])}, {"$set": company})
            return {
                "status": status.HTTP_200_OK,
                "message": "Company updated successfully",
                "data": convert_to_jsonable(company)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/companies/get")
async def get_companies():
    try:
        results = list(companies_collection.find({}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Company details retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/companies/get/{id}")
async def get_company_details_by_id(id: int):
    try:
        result = companies_collection.find_one({"id": id}, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Company details retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Company details not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/companies/{id}/deleted/{value}")
async def delete_restore_company(id: int, value: int):
    try:
        companies_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Company deleted successfully" if value else "Company restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ================================
# CRUD for Companies - ending
# ================================







# =====================================
# CRUD for System Setting - starting
# =====================================
@crm_settings.post("/crm_settings/system/save")
async def save_system_settings(request: Request):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            settings = dict(request_form)
            settings["id"] = int(system_settings_collection.count_documents({})) + 1
            system_settings_collection.insert_one(settings)
            return {
                "status": status.HTTP_200_OK, 
                "message": "System settings created successfully", 
                "data": convert_to_jsonable(settings)
            }
        else:
            settings = dict(request_form)
            settings["id"] = int(request_form["id"])
            system_settings_collection.update_one({"id": int(request_form["id"])}, {"$set": settings})
            return {
                "status": status.HTTP_200_OK, 
                "message": "System settings updated successfully", 
                "data": convert_to_jsonable(settings)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/system/get")
async def get_system_settings():
    try:
        results = list(system_settings_collection.find({}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "System settings retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/system/get/{id}")
async def get_system_settings_by_id(id: int):
    try:
        result = system_settings_collection.find_one({"id": id}, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "System settings retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "System settings not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/system/{id}/deleted/{value}")
async def delete_restore_system_setting(id: int, value: int):
    try:
        system_settings_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Setting deleted successfully" if value else "Setting restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# =====================================
# CRUD for System Setting - ending
# =====================================





# ==========================================
# CRUD for Departments Setting - starting
# ==========================================
@crm_settings.post("/crm_settings/departments/save")
async def save_department(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if department with same slug exists
            existing = db.departments.find_one({"title": request_form["title"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Department already exists"}
            
            department = dict(request_form)
            department["id"] = int(db.departments.count_documents({})) + 1
            department["tenant_id"] = user_detail["tenant_id"]
            department["active"] = int(request_form.get("active", 1))
            department["sort_by"] = int(request_form.get("sort_by", 0))
            db.departments.insert_one(department)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Department created successfully", 
                "data": convert_to_jsonable(department)
            }
        else:
            # Check if department with same slug exists (excluding current department)
            existing = db.departments.find_one({"slug": request_form["slug"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Department with this slug already exists"}
            
            department = dict(request_form)
            department["id"] = int(request_form["id"])
            department["tenant_id"] = user_detail["tenant_id"]
            department["active"] = int(request_form.get("active", 1))
            department["sort_by"] = int(request_form.get("sort_by", 0))
            db.departments.update_one({"id": int(request_form["id"])}, {"$set": department})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Department updated successfully", 
                "data": convert_to_jsonable(department)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/departments/get")
async def get_departments(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        results = list(db.departments.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Departments retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/departments/get/{id}")
async def get_department_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.departments.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Department retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Department not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/departments/{id}/deleted/{value}")
async def delete_restore_department(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.departments.update_one(query, {"$set": {"deleted": value}})
        message = "Department deleted successfully" if value else "Department restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Departments Setting - ending
# ==========================================




# ==========================================
# CRUD for Industries Setting - starting
# ==========================================
@crm_settings.post("/crm_settings/industries/save")
async def save_industry(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if industry with same title exists
            existing = db.industries.find_one({"title": request_form["title"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Industry already exists"}
            
            industry = dict(request_form)
            industry["id"] = int(db.industries.count_documents({})) + 1
            industry["tenant_id"] = user_detail["tenant_id"]
            industry["active"] = int(request_form.get("active", 1))
            industry["sort_by"] = int(request_form.get("sort_by", 0))
            db.industries.insert_one(industry)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Industry created successfully", 
                "data": convert_to_jsonable(industry)
            }
        else:
            # Check if industry with same title exists (excluding current industry)
            existing = db.industries.find_one({"title": request_form["title"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Industry with this title already exists"}
            
            industry = dict(request_form)
            industry["id"] = int(request_form["id"])
            industry["tenant_id"] = user_detail["tenant_id"]
            industry["active"] = int(request_form.get("active", 1))
            industry["sort_by"] = int(request_form.get("sort_by", 0))
            db.industries.update_one({"id": int(request_form["id"])}, {"$set": industry})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Industry updated successfully", 
                "data": convert_to_jsonable(industry)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/industries/get")
async def get_industries(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        results = list(db.industries.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Industries retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/industries/get/{id}")
async def get_industry_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.industries.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Industry retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Industry not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/industries/{id}/deleted/{value}")
async def delete_restore_industry(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.industries.update_one(query, {"$set": {"deleted": value}})
        message = "Industry deleted successfully" if value else "Industry restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Industries Setting - ending
# ==========================================




# ==========================================
# CRUD for Designation Setting - starting
# ==========================================
@crm_settings.post("/crm_settings/designations/save")
async def save_designation(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if designation with same slug exists
            existing = db.designations.find_one({"slug": request_form["slug"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Designation with this slug already exists"}
            
            designation = dict(request_form)
            designation["id"] = int(db.designations.count_documents({})) + 1
            designation["tenant_id"] = user_detail["tenant_id"]
            designation["active"] = int(request_form.get("active", 1))
            designation["sort_by"] = int(request_form.get("sort_by", 0))
            db.designations.insert_one(designation)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Designation created successfully", 
                "data": convert_to_jsonable(designation)
            }
        else:
            # Check if designation with same slug exists (excluding current designation)
            existing = db.designations.find_one({"slug": request_form["slug"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Designation with this slug already exists"}
            
            designation = dict(request_form)
            designation["id"] = int(request_form["id"])
            designation["tenant_id"] = user_detail["tenant_id"]
            designation["active"] = int(request_form.get("active", 1))
            designation["sort_by"] = int(request_form.get("sort_by", 0))
            db.designations.update_one({"id": int(request_form["id"])}, {"$set": designation})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Designation updated successfully", 
                "data": convert_to_jsonable(designation)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/designations/get")
async def get_designations(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        results = list(db.designations.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Designations retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/designations/get/{id}")
async def get_designation_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.designations.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Designation retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Designation not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/designations/{id}/deleted/{value}")
async def delete_restore_designation(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.designations.update_one(query, {"$set": {"deleted": value}})
        message = "Designation deleted successfully" if value else "Designation restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Designation Setting - ending
# ==========================================



# ==========================================
# CRUD for Roles Setting - starting
# ==========================================
@crm_settings.post("/crm_settings/roles/save")
async def save_role(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if role with same slug exists
            existing = db.roles.find_one({"slug": request_form["slug"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Role with this slug already exists"}
            
            role = dict(request_form)
            role["id"] = int(db.roles.count_documents({})) + 1
            role["active"] = int(request_form.get("active", 1))
            role["tenant_id"] = user_detail["tenant_id"]
            role["sort_by"] = int(request_form.get("sort_by", 0))
            db.roles.insert_one(role)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Role created successfully", 
                "data": convert_to_jsonable(role)
            }
        else:
            # Check if role with same slug exists (excluding current role)
            existing = db.roles.find_one({"slug": request_form["slug"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Role with this slug already exists"}
            
            role = dict(request_form)
            role["id"] = int(request_form["id"])
            role["active"] = int(request_form.get("active", 1))
            role["tenant_id"] = user_detail["tenant_id"]
            role["sort_by"] = int(request_form.get("sort_by", 0))
            db.roles.update_one({"id": int(request_form["id"])}, {"$set": role})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Role updated successfully", 
                "data": convert_to_jsonable(role)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/roles/get")
async def get_roles(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        results = list(db.roles.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Roles retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/roles/get/{id}")
async def get_role_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.roles.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Role retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Role not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/roles/{id}/deleted/{value}")
async def delete_restore_role(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.roles.update_one(query, {"$set": {"deleted": value}})
        message = "Role deleted successfully" if value else "Role restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/roles/reassign-delete-role/{to_delete}/{to_report_to}")
async def reassign_delete_role(to_delete: int, to_report_to: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # First verify the role to delete exists
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = to_delete
        role_to_delete = db.roles.find_one(query)
        if not role_to_delete:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Role to delete not found",
                "data": None
            }
        
        # If to_report_to is 0, only delete the role
        if to_report_to == 0:
            delete_result = db.roles.delete_one({"id": to_delete})
            return {
                "status": status.HTTP_200_OK,
                "message": "Role deleted successfully",
                "data": {
                    "users_updated": 0,
                    "role_deleted": delete_result.deleted_count
                }
            }
        
        # Verify the role to report to exists
        role_to_report = db.roles.find_one({"id": to_report_to})
        if not role_to_report:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Role to report to not found",
                "data": None
            }

        # Update all users who were reporting to the deleted role
        update_result = db.roles.update_many(
            {"report_to_id": to_delete},
            {"$set": {"report_to_id": to_report_to}}
        )

        # Delete the role
        delete_result = db.roles.delete_one({"id": to_delete})

        return {
            "status": status.HTTP_200_OK,
            "message": "Role reassigned and deleted successfully",
            "data": {
                "users_updated": update_result.modified_count,
                "role_deleted": delete_result.deleted_count
            }
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Roles Setting - ending
# ==========================================




# ==========================================
# CRUD for Profiles Setting - starting
# ==========================================
@crm_settings.post("/crm_settings/profiles/save")
async def save_profile(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if profile with same title exists
            existing = db.profiles.find_one({"title": request_form["title"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Profile with this title already exists"}
            
            profile = dict(request_form)
            profile["id"] = int(db.profiles.count_documents({})) + 1
            profile["active"] = int(request_form.get("active", 1))
            profile["tenant_id"] = user_detail["tenant_id"]
            profile["sort_by"] = int(request_form.get("sort_by", 0))
            db.profiles.insert_one(profile)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Profile created successfully", 
                "data": convert_to_jsonable(profile)
            }
        else:
            # Check if profile with same title exists (excluding current profile)
            existing = db.profiles.find_one({"title": request_form["title"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Profile with this title already exists"}
            
            profile = dict(request_form)
            profile["id"] = int(request_form["id"])
            profile["active"] = int(request_form.get("active", 1))
            profile["sort_by"] = int(request_form.get("sort_by", 0))
            db.profiles.update_one({"id": int(request_form["id"])}, {"$set": profile})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Profile updated successfully", 
                "data": convert_to_jsonable(profile)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/profiles/get")
async def get_profiles(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {"tenant_id": user_detail["tenant_id"]}
        results = db.profiles.find(query, {"_id": 0}).sort("sort_by", 1)

        result_array = []
        for result in results:
            result = dict(result)  # ensure it's mutable
            profile_id = int(result["id"])
            result["users"] = list(db.users.find({"profile_id": profile_id}, {"_id": 0}))
            result["permissions"] = db.profile_permissions.find_one(
                {"profile_id": profile_id}, {"_id": 0}
            )
            result_array.append(result)

        return {
            "status": status.HTTP_200_OK,
            "message": "Profiles retrieved successfully",
            "data": convert_to_jsonable(result_array),
        }

    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/profiles/get/{id}")
async def get_profile_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.profiles.find_one(query, {"_id": 0})
        if result:
            result["users"] = list(db.users.find({}, {"_id": 0}))
            result["permissions"] = db.profile_permissions.find_one({"profile_id": int(id)}, {"_id": 0})
           
            return {
                "status": status.HTTP_200_OK,
                "message": "Profile retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Profile not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/profiles/{id}/deleted/{value}")
async def delete_restore_profile(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.profiles.update_one(query, {"$set": {"deleted": value}})
        message = "Profile deleted successfully" if value else "Profile restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Profiles Setting - ending
# ==========================================





# ===================================
# CRUD for User Setting - starting
# ===================================
@crm_settings.post("/crm_settings/users/save")
async def save_user(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if user with same email exists for the same tenant
            existing = db.users.find_one({
                "email": request_form["email"],
                "tenant_id": user_detail["tenant_id"]
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "User with this email already exists in this tenant"}
            
            user = dict(request_form)
            user["id"] = int(db.users.count_documents({})) + 1
            user["active"] = int(request_form.get("active", 1))
            user["sort_by"] = int(request_form.get("sort_by", 0))
            user["tenant_id"] = user_detail["tenant_id"]
            user["user_type"] = 2
            user["created_at"] = datetime.utcnow()
            user["updated_at"] = datetime.utcnow()
            
            
            # Hash password before saving
            user["password"] = generate_hashed_password(user["password"])
            
            db.users.insert_one(user)
            return {
                "status": status.HTTP_200_OK, 
                "message": "User created successfully", 
                "data": convert_to_jsonable(user)
            }
        else:
            # Check if user with same email exists for the same tenant (excluding current user)
            existing = db.users.find_one({
                "email": request_form["email"],
                "tenant_id": user_detail["tenant_id"],
                "id": {"$ne": int(request_form["id"])}
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "User with this email already exists in this tenant"}
            
            user = dict(request_form)
            user["id"] = int(request_form["id"])
            user["active"] = int(request_form.get("active", 1))
            user["sort_by"] = int(request_form.get("sort_by", 0))
            user["tenant_id"] = user_detail["tenant_id"]
            user["user_type"] = 2
            user["updated_at"] = datetime.utcnow()
            
            # Only update password if it's provided
            if "password" in request_form and request_form["password"]:
                user["password"] = oauth2.get_password_hash(user["password"])
            else:
                # Remove password from update if not provided
                user.pop("password", None)
            
            db.users.update_one({"id": int(request_form["id"])}, {"$set": user})
            return {
                "status": status.HTTP_200_OK, 
                "message": "User updated successfully", 
                "data": convert_to_jsonable(user)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/users/get")
async def get_users(request: Request, current_user: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    query = {}
    
    try:
        # Get tenant_id from current_user
        query["tenant_id"] = current_user["tenant_id"]
        query["user_type"] = 2
        
        results = db.users.find(query, {"_id": 0, "password": 0}).sort("sort_by", 1)
        result_array = []
        for result in results:
            # result["profile"] = db.profiles.find_one({"id": result["profile_id"]}, {"_id": 0})
            result_array.append(result)
        return {
            "status": status.HTTP_200_OK,
            "message": "Users retrieved successfully",
            "data": convert_to_jsonable(result_array)
        }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/users/get-by-tenant")
async def get_users(current_user: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = current_user["tenant_id"]
        if not tenant_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Tenant ID is missing",
                "data": []
            }

        query = {"tenant_id": tenant_id}
        results = list(db.users.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Users retrieved successfully",
            "data": convert_to_jsonable(results)
        }

    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/users/get/{id}")
async def get_user_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.users.find_one(query, {"_id": 0, "password": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "User retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "User not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/users/{id}/deleted/{value}")
async def delete_restore_user(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.users.update_one(query, {"$set": {"deleted": value}})
        message = "User deleted successfully" if value else "User restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e) 
# ==================================
# CRUD for User Setting - ending
# ==================================    





# ===================================
# CRUD for SMS Integration Setting - starting
# ===================================
"""
Provider Name (Twilio, Nexmo, etc.)
API URL
API Key / Auth Token
Sender ID or Phone Number
Message Template (optional)
Country Code Prefix (optional)
Enable/Disable Toggle

provider_name
api_url
api_key
sender_id
sender_phone
default
"""
@crm_settings.post("/crm_settings/integrations/sms/save")
async def save_sms_integration(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            existing = db.integration_sms.find_one({
                "sender_id": request_form["sender_id"],
                "api_key": request_form["api_key"],
                "tenant_id": user_detail["tenant_id"]
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "SMS integration already exists"}
            
            sms = dict(request_form)
            sms["id"] = int(db.integration_sms.count_documents({})) + 1
            sms["tenant_id"] = user_detail["tenant_id"]
            
            sms["provider_name"] = request_form.get("provider_name")
            sms["api_url"] = request_form.get("api_url")
            sms["api_key"] = request_form.get("api_key")
            sms["sender_id"] = request_form.get("sender_id")
            sms["sender_phone"] = request_form.get("sender_phone")
            sms["default"] = int(request_form.get("default", 0))
            
            sms["active"] = int(request_form.get("active", 1))
            sms["sort_by"] = int(request_form.get("sort_by", 0))
            sms["created_at"] = datetime.utcnow()
            sms["updated_at"] = datetime.utcnow()
            
            db.integration_sms.insert_one(sms)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Record created successfully", 
                "data": convert_to_jsonable(sms)
            }
        else:
            existing = db.integration_sms.find_one({
                "sender_id": request_form["sender_id"],
                "api_key": request_form["api_key"],
                "tenant_id": user_detail["tenant_id"],
                "id": {"$ne": int(request_form["id"])}
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "SMS integration already exists"}
            
            sms = dict(request_form)
            sms["id"] = int(request_form["id"])
                        
            sms["provider_name"] = request_form.get("provider_name")
            sms["api_url"] = request_form.get("api_url")
            sms["api_key"] = request_form.get("api_key")
            sms["sender_id"] = request_form.get("sender_id")
            sms["sender_phone"] = request_form.get("sender_phone")
            sms["default"] = int(request_form.get("default", 0))
            
            sms["active"] = int(request_form.get("active", 1))
            sms["sort_by"] = int(request_form.get("sort_by", 0))
            sms["tenant_id"] = user_detail["tenant_id"]
            
            db.integration_sms.update_one({"id": int(request_form["id"])}, {"$set": sms})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Record updated successfully", 
                "data": convert_to_jsonable(sms)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/integrations/sms/get")
async def get_sms_integration(request: Request, current_user: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {"tenant_id": current_user.get("tenant_id")}
        results = list(
            db.integration_sms.find(query, {"_id": 0}).sort("sort_by", -1)
        )
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": results
        }
    except Exception as e:
        return get_error_details(e)
    
@crm_settings.post("/crm_settings/integrations/sms/get/{id}")
async def get_sms_integration_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.integration_sms.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.get("/crm_settings/integrations/sms/{id}/deleted/{value}")
async def delete_restore_sms_integration(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.integration_sms.update_one(query, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e) 
# ============================================
# CRUD for SMS Integration Setting - ending
# ============================================    





# ===================================
# CRUD for Whatsapp Integration Setting - starting
# ===================================
"""
provider_name
sandbox_mode
api_key
phone_number_id
business_phone_number
webhook_url
webhook_verify_token
webhook_events
business_display_name
business_website
"""
@crm_settings.post("/crm_settings/integrations/whatsapp/save")
async def save_whatsapp_integration(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            existing = db.integration_whatsapp.find_one({
                "business_phone_number": request_form["business_phone_number"],
                "api_key": request_form["api_key"],
                "tenant_id": user_detail["tenant_id"]
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Whatsapp integration already exists"}
            
            whatsapp = dict(request_form)
            whatsapp["id"] = int(db.integration_whatsapp.count_documents({})) + 1
            whatsapp["tenant_id"] = user_detail["tenant_id"]
            
            whatsapp["provider_name"] = request_form.get("provider_name")
            whatsapp["sandbox_mode"] = request_form.get("sandbox_mode")
            whatsapp["api_key"] = request_form.get("api_key")
            whatsapp["phone_number_id"] = request_form.get("phone_number_id")
            whatsapp["business_phone_number"] = request_form.get("business_phone_number")
            whatsapp["webhook_url"] = request_form.get("webhook_url")
            whatsapp["webhook_verify_token"] = request_form.get("webhook_verify_token")
            whatsapp["webhook_events"] = request_form.get("webhook_events")
            whatsapp["business_display_name"] = request_form.get("business_display_name")
            whatsapp["business_website"] = request_form.get("business_website")
            
            whatsapp["active"] = int(request_form.get("active", 1))
            whatsapp["sort_by"] = int(request_form.get("sort_by", 0))
            whatsapp["created_at"] = datetime.utcnow()
            whatsapp["updated_at"] = datetime.utcnow()
            
            db.integration_whatsapp.insert_one(whatsapp)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Record created successfully", 
                "data": convert_to_jsonable(whatsapp)
            }
        else:
            existing = db.integration_whatsapp.find_one({
                "business_phone_number": request_form["business_phone_number"],
                "api_key": request_form["api_key"],
                "tenant_id": user_detail["tenant_id"],
                "id": {"$ne": int(request_form["id"])}
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Whatsapp integration already exists"}
            
            whatsapp = dict(request_form)
            whatsapp["id"] = int(request_form["id"])
                        
            whatsapp["provider_name"] = request_form.get("provider_name")
            whatsapp["sandbox_mode"] = request_form.get("sandbox_mode")
            whatsapp["api_key"] = request_form.get("api_key")
            whatsapp["phone_number_id"] = request_form.get("phone_number_id")
            whatsapp["business_phone_number"] = request_form.get("business_phone_number")
            whatsapp["webhook_url"] = request_form.get("webhook_url")
            whatsapp["webhook_verify_token"] = request_form.get("webhook_verify_token")
            whatsapp["webhook_events"] = request_form.get("webhook_events")
            whatsapp["business_display_name"] = request_form.get("business_display_name")
            whatsapp["business_website"] = request_form.get("business_website")
            
            whatsapp["active"] = int(request_form.get("active", 1))
            whatsapp["sort_by"] = int(request_form.get("sort_by", 0))
            whatsapp["tenant_id"] = user_detail["tenant_id"]
            
            db.integration_whatsapp.update_one({"id": int(request_form["id"])}, {"$set": whatsapp})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Record updated successfully", 
                "data": convert_to_jsonable(whatsapp)
            }
    except Exception as e:
        return get_error_details(e)

@crm_settings.post("/crm_settings/integrations/whatsapp/get")
async def get_whatsapp_integration(request: Request, current_user: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {"tenant_id": current_user.get("tenant_id")}
        results = list(
            db.integration_whatsapp.find(query, {"_id": 0}).sort("sort_by", -1)
        )
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": results
        }
    except Exception as e:
        return get_error_details(e)

# ============================================
# CRUD for Whatsapp Integration Setting - ending
# ============================================   