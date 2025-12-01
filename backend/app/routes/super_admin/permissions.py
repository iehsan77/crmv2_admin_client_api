from fastapi import APIRouter, Request, status, Depends
from typing import List

from app.networks.database import db
from app.utils import oauth2
from app.helpers.general_helper import convert_to_jsonable, get_error_details

# Avoid overwriting the router with a db collection
permissions_management = APIRouter(tags=["Super Admin - Permissions Management"])

# DB collections
permission_categories = db.permission_categories
permission_groups = db.permission_groups
permissions = db.permissions

# Projection
NO_ID_PROJECTION = {"_id": 0}

# ============================================
# CRUD for Permission Categories - starting
# ============================================
@permissions_management.post("/permission/categories/save")
async def save_record(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    form_data = dict(await request.form())
    try:
        record_id = int(form_data.get("id", 0))
        slug = form_data.get("slug", "").strip()

        if not slug:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "Slug is required"}

        # Check uniqueness
        existing = permission_categories.find_one(
            {"slug": slug, "id": {"$ne": record_id}} if record_id else {"slug": slug}
        )
        if existing:
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Record with this slug already exists"
            }

        record = {
            "id": record_id or permission_categories.count_documents({}) + 1,
            "title": form_data.get("title", "").strip(),
            "slug": slug,
            "sort_by": int(form_data.get("sort_by", 0)),
            "active": int(form_data.get("active", 1)),
        }

        if record_id == 0:
            permission_categories.insert_one(record)
            message = "Record created successfully"
        else:
            permission_categories.update_one({"id": record_id}, {"$set": record})
            message = "Record updated successfully"

        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(record)
        }

    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permission/categories/get")
async def get_records(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        results = list(permission_categories.find({}, NO_ID_PROJECTION).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permission/categories/get/{id}")
async def get_record(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = permission_categories.find_one({"id": id}, NO_ID_PROJECTION)
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

@permissions_management.get("/permission/categories/{id}/deleted/{value}")
async def delete_restore_record(
    id: int,
    value: int,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        permission_categories.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ============================================
# CRUD for Permission Categories - ending
# ============================================




# ============================================
# CRUD for Permission Groups - starting
# ============================================
@permissions_management.post("/permission/groups/save")
async def save_record(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form_data = dict(await request.form())
        record_id = int(form_data.get("id", 0))
        category_id = int(form_data.get("category_id", 0))
        slug = form_data.get("slug", "").strip()

        if not slug:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "Slug is required"}

        # Check uniqueness
        existing = permission_groups.find_one(
            {"slug": slug, "id": {"$ne": record_id}} if record_id else {"slug": slug}
        )
        if existing:
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Record with this slug already exists"
            }

        record = {
            "id": record_id or permission_groups.count_documents({}) + 1,
            "title": form_data.get("title", "").strip(),
            "slug": slug,
            "category_id": category_id,
            "category": form_data.get("category", ""),
            "sort_by": int(form_data.get("sort_by", 0)),
            "active": int(form_data.get("active", 1)),
        }

        if record_id == 0:
            permission_groups.insert_one(record)
            message = "Record created successfully"
        else:
            permission_groups.update_one({"id": record_id}, {"$set": record})
            message = "Record updated successfully"

        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(record)
        }

    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permission/groups/get")
async def get_records(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        results = list(permission_groups.find({}, NO_ID_PROJECTION).sort("id", -1))
        """
        if results:
            for result in results:
                result["category"] = permission_categories.find_one({"id": result["category_id"]}, NO_ID_PROJECTION)
        """            
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permission/groups/get/{id}")
async def get_record(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = permission_groups.find_one({"id": id}, NO_ID_PROJECTION)
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


@permissions_management.get("/permission/groups/{id}/deleted/{value}")
async def delete_restore_record(
    id: int,
    value: int,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        permission_groups.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ============================================
# CRUD for Permission Groups - ending
# ============================================




# ============================================
# CRUD for Permission - starting
# ============================================
@permissions_management.post("/permissions/save")
async def save_record(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form_data = dict(await request.form())
        record_id = int(form_data.get("id", 0))

        category_id = int(form_data.get("category_id", 0))
        category = int(form_data.get("category", 0))

        group_id = int(form_data.get("group_id", 0))
        group = int(form_data.get("group", 0))

        title = form_data.get("title", "").strip()
        key = form_data.get("key", "").strip()

        if not key:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "Permission key is required"}

        # Check uniqueness
        existing = permissions.find_one(
            {"key": key, "id": {"$ne": record_id}} if record_id else {"key": key}
        )
        if existing:
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Permission key already exists"
            }

        record = {
            "id": record_id or permissions.count_documents({}) + 1,
            "title": title,
            "key": key,
            "permission_group_id": permission_group_id,
            "permission_group": form_data.get("permission_group", ""),
            "sort_by": int(form_data.get("sort_by", 0)),
            "active": int(form_data.get("active", 1)),
        }

        if record_id == 0:
            permissions.insert_one(record)
            message = "Record created successfully"
        else:
            permissions.update_one({"id": record_id}, {"$set": record})
            message = "Record updated successfully"

        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(record)
        }

    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permissions/get")
async def get_records(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        results = list(permissions.find({}, NO_ID_PROJECTION).sort("id", -1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@permissions_management.post("/permissions/get/{id}")
async def get_record(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = permissions.find_one({"id": id}, NO_ID_PROJECTION)
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


@permissions_management.get("/permissions/{id}/deleted/{value}")
async def delete_restore_record(
    id: int,
    value: int,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        permissions.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ============================================
# CRUD for Permission - ending
# ============================================
