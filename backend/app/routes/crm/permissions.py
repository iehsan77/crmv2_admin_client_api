from fastapi import APIRouter, status, Request
from app.networks.database import db
from app.helpers.globalfunctions import getCountforApps, getLastUserId
from app.models.crm.permissions import (
    CreatePermission, 
    UpdatePermission, 
    DeletePermission,
    ProfilePermission,
    ProfilePermissionResponse
)


permissions = APIRouter(tags=["CRM Admin - Permissions"])

# Collections
permissions_collection = db.permissions
permission_groups_collection = db.permission_groups
permission_categories_collection = db.permission_categories
profile_permissions_collection = db.profile_permissions



# =========================
#  FUNCTION - Starting
# =========================
def single_entity(item) -> dict:
    return {
        "id": item["id"],
        "title": item["title"],
        "key": item["key"],
        "permission_group_id": item["permission_group_id"],
        "active": item["active"],
        "sort_by": item["sort_by"],
        "created_at": item["created_at"],
        "created_by": item["created_by"],
        "updated_at": item["updated_at"],
        "updated_by": item["updated_by"],
        "deleted_at": item["deleted_at"],
        "deleted": item["deleted"],
    }

def records_entity(entity) -> list:
    return [single_entity(item) for item in entity]
# =========================
#  FUNCTION - Ending
# =========================





# =========================
#  ROUTE - Starting
# =========================
@permissions.get("/permissions/get-all")
async def get_all_permissions():
    try:
        # Get all categories
        categories = permission_categories_collection.find(
            {"deleted": {"$ne": 1}},
            {"_id": 0}
        ).sort("sort_by", 1)

        result = []
        for category in categories:
            category_data = {
                "id": category["id"],
                "title": category["title"],
                "groups": []
            }

            # Get groups for this category
            groups = permission_groups_collection.find(
                {
                    "category_id": category["id"],
                    "deleted": {"$ne": 1}
                },
                {"_id": 0}
            ).sort("sort_by", 1)

            for group in groups:
                group_data = {
                    "id": group["id"],
                    "title": group["title"],
                    "permissions": []
                }

                # Get permissions for this group
                permissions = permissions_collection.find(
                    {
                        "permission_group_id": group["id"],
                        "deleted": {"$ne": 1}
                    },
                    {"_id": 0}
                ).sort("sort_by", 1)

                for permission in permissions:
                    permission_data = {
                        "id": permission["id"],
                        "title": permission["title"],
                        "key": permission.get("key", ""),
                        "active": permission.get("active", 1)
                    }
                    group_data["permissions"].append(permission_data)

                category_data["groups"].append(group_data)

            result.append(category_data)

        return {
            "status": status.HTTP_200_OK,
            "data": result,
            "total_records": getCountforApps("permissions", {"deleted": {"$ne": 1}})
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data."
        }

@permissions.get("/permissions/get-by-category/{category_id}")
async def get_permissions_by_category(category_id: int):
    try:
        # Get category
        category = permission_categories_collection.find_one(
            {
                "id": category_id,
                "deleted": {"$ne": 1}
            },
            {"_id": 0}
        )

        if not category:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Category not found.",
                "data": {}
            }

        category_data = {
            "id": category["id"],
            "title": category["title"],
            "groups": []
        }

        # Get groups for this category
        groups = permission_groups_collection.find(
            {
                "category_id": category_id,
                "deleted": {"$ne": 1}
            },
            {"_id": 0}
        ).sort("sort_by", 1)

        for group in groups:
            group_data = {
                "id": group["id"],
                "title": group["title"],
                "permissions": []
            }

            # Get permissions for this group
            permissions = permissions_collection.find(
                {
                    "group_id": group["id"],
                    "deleted": {"$ne": 1}
                },
                {"_id": 0}
            ).sort("sort_by", 1)

            for permission in permissions:
                permission_data = {
                    "id": permission["id"],
                    "title": permission["title"],
                    "key": permission.get("key", ""),
                    "active": permission.get("active", 1)
                }
                group_data["permissions"].append(permission_data)

            category_data["groups"].append(group_data)

        return {
            "status": status.HTTP_200_OK,
            "data": category_data
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data."
        }
"""
@permissions.post("/permissions/save")
async def save_permission(request: Request):
    request_form = await request.form()
    try:
        # Create Permission
        if int(request_form["id"]) == 0:
            validation = permissions_collection.find_one({"key": request_form["key"]})
            if validation:
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Permission already exists",
                }
            
            create_permission = CreatePermission()
            new_id = int(getLastUserId(permissions_collection, "id")) + 1
            create_permission.id = new_id
            create_permission.title = request_form["title"]
            create_permission.key = request_form["key"]
            create_permission.permission_group_id = int(request_form["permission_group_id"])
            create_permission.active = int(request_form.get("active", 1))
            create_permission.sort_by = int(request_form.get("sort_by", 0))

            permissions_collection.insert_one(create_permission.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Permission has been created",
                "data": create_permission,
            }
        
        # Update Permission
        if int(request_form["id"]) != 0:
            validation = permissions_collection.find_one(
                {
                    "key": request_form["key"],
                    "id": {"$ne": int(request_form["id"])}
                }
            )

            if validation and validation["id"] == int(request_form["id"]):
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Permission already exists",
                }
            
            has_record = permissions_collection.find_one({"id": int(request_form["id"])})
            if has_record:
                update_permission = UpdatePermission()
                update_permission.id = int(request_form["id"])
                update_permission.title = request_form["title"]
                update_permission.key = request_form["key"]
                update_permission.permission_group_id = int(request_form["permission_group_id"])
                update_permission.active = int(request_form.get("active", 1))
                update_permission.sort_by = int(request_form.get("sort_by", 0))

                permissions_collection.update_one(
                    {"id": int(request_form["id"])}, 
                    {"$set": update_permission.dict()}
                )
                return {
                    "status": status.HTTP_200_OK,
                    "message": "Record Successfully updated",
                    "data": update_permission
                }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data.",
            "data": request_form,
            "line_no": e.__traceback__.tb_lineno,
        }

@permissions.post("/permissions/get")
async def get_permissions(request: Request):
    search_query = {}
    try:
        query_params = request.query_params
        isActive = query_params.get('is_active')
        isDeleted = query_params.get('is_deleted')
        
        if isActive:
            search_query["active"] = int(isActive)
        
        search_query["deleted"] = {"$ne": 1}  # Exclude deleted by default
        if isDeleted:
            search_query["deleted"] = int(isDeleted)

        results = permissions_collection.find(search_query, {"_id": 0}).sort("sort_by", 1)

        if results:
            data = records_entity(results)
            return {
                "status": status.HTTP_200_OK,
                "data": data,
                "total_records": getCountforApps("permissions", search_query),
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found.",
                "data": [],
            }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ", Something went wrong with the requested data."
        }
"""
@permissions.post("/permissions/profile/save")
async def save_profile_permissions(request: Request):
    try:
        request_form = await request.form()
        profile_id = int(request_form["profile_id"])
        permissions_str = request_form["permissions"]
        
        # Create ProfilePermission object with string permissions
        profile_permission = ProfilePermission(
            profile_id=profile_id,
            permissions=permissions_str
        )
        
   
        # Check if profile exists
        existing_profile = profile_permissions_collection.find_one({"profile_id": profile_permission.profile_id})
        
        if existing_profile:
            # Update existing profile permissions
            profile_permissions_collection.update_one(
                {"profile_id": profile_permission.profile_id},
                {"$set": {"permissions": permissions_str}}
            )
            message = "Profile permissions updated successfully"
        else:
            # Create new profile permissions with list format for database
            db_profile_permission = {
                "profile_id": profile_permission.profile_id,
                "permissions": permissions_str
            }
            profile_permissions_collection.insert_one(db_profile_permission)
            message = "Profile permissions created successfully"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": profile_permission
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

@permissions.get("/permissions/profile/{profile_id}")
async def get_profile_permissions(profile_id: int):
    try:
        # Get profile permissions
        profile_permission = profile_permissions_collection.find_one({"profile_id": profile_id})
        
        if not profile_permission:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Profile permissions not found",
                "data": {"profile_id": profile_id, "permissions": []}
            }
        
        # Get detailed permission information for each permission ID
        permission_details = []
        for perm_id in profile_permission["permissions"]:
            permission = permissions_collection.find_one(
                {"id": perm_id, "deleted": {"$ne": 1}},
                {"_id": 0}
            )
            if permission:
                permission_details.append(single_entity(permission))
        
        response_data = {
            "profile_id": profile_id,
            "permissions": permission_details
        }
        
        return {
            "status": status.HTTP_200_OK,
            "data": response_data
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ", Something went wrong with the requested data."
        }
# =========================
#  ROUTE - Ending
# =========================



