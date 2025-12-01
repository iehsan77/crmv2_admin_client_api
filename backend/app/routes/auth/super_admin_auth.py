from fastapi import APIRouter, Request, status
from app.utils import utils, oauth2
from app.networks.database import db
from fastapi.responses import JSONResponse
from typing import List
import json
from bson import ObjectId

super_admin_auth = APIRouter(tags=['Authorization - Super Admin'])
NO_ID_PROJECTION = {"_id": 0}


@super_admin_auth.post('/auth/admin-login')
async def login(request: Request):
    try:
        form_data = await request.form()
        email = form_data.get('email')
        password = form_data.get('password')

        if not email or not password:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Email and password are required"
            }

        user = db.users.find_one(
            {"email": email, "role": 0, "deleted": 0},
            {"_id": 0}
        )

        if not user:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "User does not exist with this email"
            }

        if int(user.get("active", 0)) == 0:
            return {
                "status": status.HTTP_403_FORBIDDEN,
                "message": "Your account is not active. Please contact support."
            }

        if not user.get('password') or not utils.verify(password, user['password']):
            return {
                "status": status.HTTP_403_FORBIDDEN,
                "message": "Invalid credentials"
            }

        token_data = {
            "id": int(user['id']),
            "role": user["role"],
            "tenant_id": user["id"]
        }
        access_token = oauth2.create_businessify_token(data=token_data)

        user.pop("password", None)
        user.pop("password_reset_code", None)

        user["apps"] = await get_all_apps()
        user["settings"] = list(db.settigs.find({}, {"_id": 0}).sort("sort_by", 1))

        return {
            "status": status.HTTP_200_OK,
            "message": "Login successful",
            "token": access_token,
            "data": user
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

async def get_all_apps():
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
