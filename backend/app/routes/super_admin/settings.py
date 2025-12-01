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

super_admin_settings = APIRouter(tags=["Super Admin - Settings"])
company_collection = db.company_details
companies_collection = db.companies
system_settings_collection = db.system_settings

from app.helpers.general_helper import convert_to_jsonable, get_error_details


# =================================================
#  This is for our Company Information - starting
# =================================================
@super_admin_settings.post("/settings/company/save")
async def save_company(request: Request):
    request_form = await request.form()
    try:

        formated_name = " ".join(request_form["name"].lower().split())
        if int(request_form["id"]) == 0:
            validation = company_collection.find_one({"name": formated_name})
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Company already exists"}
            
            company = dict(request_form)
            company["id"] = int(company_collection.count_documents({})) + 1
            company["active"] = int(request_form.get("active", 1))
            company["sort_by"] = int(request_form.get("sort_by", 0))
            company_collection.insert_one(company)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Company created successfully", 
                "data": convert_to_jsonable(company)
            }
        else:
            validation = company_collection.find_one({"name": request_form["name"], "id": {"$ne": int(request_form["id"])}})
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Company already exists"}
            
            company = dict(request_form)
            company["id"] = int(request_form["id"])
            company["active"] = int(request_form.get("active", 1))
            company["sort_by"] = int(request_form.get("sort_by", 0))
            company_collection.update_one({"id": int(request_form["id"])}, {"$set": company})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Company updated successfully", 
                "data": convert_to_jsonable(company)
            }
    except Exception as e:
        return get_error_details(e)

@super_admin_settings.post("/settings/company/get")
async def get_company_details():
    try:
        results = list(company_collection.find({}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Company details retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@super_admin_settings.post("/settings/company/get/{id}")
async def get_company_details_by_id(id: int):
    try:
        result = company_collection.find_one({"id": id}, {"_id": 0})
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

@super_admin_settings.get("/settings/company/{id}/deleted/{value}")
async def delete_restore_company(id: int, value: int):
    try:
        company_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Company deleted successfully" if value else "Company restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# =================================================
#  This is for our Company Information - ending
# =================================================



# ========================================
#  CRUD for System Settings - starting
# ========================================
@super_admin_settings.post("/settings/system/save")
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

@super_admin_settings.post("/settings/system/get")
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

@super_admin_settings.post("/settings/system/get/{id}")
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

@super_admin_settings.get("/settings/system/{id}/deleted/{value}")
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
# ========================================
#  CRUD for System Settings - ending
# ========================================
