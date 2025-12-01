import string
from app.models.super_admin.layouts import CreateFormLayout
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
from app.models.super_admin.tenant_registration import CreateTenantPurchaseApp, UpdateTenantPurchaseApp, website_tenant_model, Update_website_tenant_model
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.helpers.uploadimage import UploadImage
from app.utils import utils, config, oauth2
from datetime import datetime
from app.utils.utils import generate_hashed_password
import bcrypt
#from app.routes.super_admin.settings import get_settings
from fastapi.responses import JSONResponse
from typing import List
import user_agents
from bson import ObjectId

from app.helpers.general_helper import convert_to_jsonable, random_with_n_digits, sendChangePasswordEmail, get_error_details


layout = APIRouter(tags=["CRM Admin - Layout"])




# ================================
#  CRUD for Layouts - starting
# ================================
@layout.post("/layouts/save")
async def save_layout(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        # Validate required fields
        if not request_form.get("module_id") or not request_form.get("app_id"):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Module ID and app_id are required fields"
            }

        # Normalize title: convert to lowercase and remove extra spaces
        normalized_title = " ".join(request_form["title"].lower().split())

        if int(request_form["id"]) == 0:
            # Check for existing layout with same normalized title in the same module
            validation = db.layouts.find_one({
                "title": normalized_title,
                "module_id": request_form["module_id"],
                "app_id": request_form["app_id"]
            })
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Layout with this title already exists in this module"}
            
            layout = dict(request_form)
            layout["id"] = int(db.layouts.count_documents({})) + 1
            layout["tenant_id"]: user_detail["tenant_id"]
            layout["active"] = int(request_form.get("active", 1))
            layout["sort_by"] = int(request_form.get("sort_by", 0))
            layout["title"] = request_form["title"]  # Store normalized title
            db.layouts.insert_one(layout)
            return {
                "status": status.HTTP_200_OK,
                "message": "Layout created successfully",
                "data": convert_to_jsonable(layout)
            }
        else:
            # Check for existing layout with same normalized title in the same module, excluding current layout
            validation = db.layouts.find_one({
                "title": normalized_title ,
                "module_id": request_form["module_id"],
                "app_id": request_form["app_id"],
                "id": {"$ne": int(request_form["id"])}
            })
            if validation:
                return {"status": status.HTTP_302_FOUND, "message": "Layout with this title already exists in this module"}
            
            layout = dict(request_form)
            layout["id"] = int(request_form["id"])
            layout["tenant_id"]: user_detail["tenant_id"]
            layout["active"] = int(request_form.get("active", 1))
            layout["sort_by"] = int(request_form.get("sort_by", 0))
            layout["title"] = request_form["title"]  # Store normalized title
            db.layouts.update_one({"id": int(request_form["id"])}, {"$set": layout})
            return {
                "status": status.HTTP_200_OK,
                "message": "Layout updated successfully",
                "data": convert_to_jsonable(layout)
            }
    except Exception as e:
        return get_error_details(e)

@layout.post("/layouts/get")
async def get_layouts(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        results = list(db.layouts.find({"tenant_id": user_detail["tenant_id"]}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Layouts retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)
    
@layout.post("/layout/get-by-module-id")
async def get_layouts(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        results = list(db.layouts.find({"module_id":request_form["module_id"], "tenant_id": user_detail["tenant_id"]}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Layouts retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)    

@layout.post("/layouts/get/{id}")
async def get_layout_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = db.layouts.find_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Layout retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Layout not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@layout.get("/layouts/{id}/deleted/{value}")
async def delete_restore_layout(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        db.layouts.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Layout deleted successfully" if value else "Layout restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e) 
# ===============================
#  CRUD for Layouts - ending
# ===============================
