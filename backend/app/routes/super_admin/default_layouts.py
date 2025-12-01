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


default_layouts = APIRouter(tags=["Super Admin - Default Layout"])


# ========================================
#  CRUD for Default Layouts - starting
# ========================================
@default_layouts.post("/default-layouts/save")
async def save_layout(request: Request):
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
            layout["tenant_id"] = int(0)
            layout["app_id"] = int(request_form["app_id"])
            layout["module_id"] = int(request_form["module_id"])
            layout["active"] = int(request_form.get("active", 1))
            layout["sort_by"] = int(request_form.get("sort_by", 0))
            layout["deletable"] = int(0)
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
            layout["tenant_id"] = int(0)
            layout["app_id"] = int(request_form["app_id"])
            layout["module_id"] = int(request_form["module_id"])
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

@default_layouts.post("/default-layouts/form/save")
async def save_layout(request: Request):
    try:
        request_form = await request.form()
        layout_id = int(request_form.get("id"))
        form_data = request_form.get("form")

        

        if not form_data:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Missing form data"},
            )

        result = db.layouts.update_one(
            {"id": layout_id},
            {"$set": {"form": form_data}}
        )


        if result.modified_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "No layout updated"},
            )
        # If you want to return the updated layout, you may need to fetch it again
        layout = db.layouts.find_one({"id": layout_id})

        return {
            "status": status.HTTP_200_OK,
            "message": "Layout updated successfully",
            "data": convert_to_jsonable(layout)
        }

    except Exception as e:
        return get_error_details(e)

@default_layouts.post("/default-layouts/get")
async def get_layouts():
    try:
        results = list(db.layouts.find({"tenant_id":0}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Layouts retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@default_layouts.post("/default-layouts/get/{id}")
async def get_layout_by_id(id: int):
    try:
        result = db.layouts.find_one({"id": id, "tenant_id":0}, {"_id": 0})
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

@default_layouts.get("/default-layouts/{id}/deleted/{value}")
async def delete_restore_layout(id: int, value: int):
    try:
        db.layouts.update_one({"id": id, "tenant_id":0}, {"$set": {"deleted": value}})
        message = "Layout deleted successfully" if value else "Layout restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e) 
# ========================================
#  CRUD for Default Layouts - ending
# ========================================