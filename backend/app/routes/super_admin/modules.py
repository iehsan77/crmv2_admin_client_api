import json
from fastapi import Request, APIRouter, status, Depends
from bson import ObjectId
from slugify import slugify
from app.helpers.globalfunctions import getLastUserId, getCountforApps, getLastFieldValue
from app.helpers.uploadimage import UploadImage
from app.models.super_admin.modules import ModuleCreate, ModuleUpdate, ModuleDelete, ModuleDBColumnCreate, ModuleDBColumnUpdate, ModuleDBColumnDelete, ModuleCustomViewCreate, ModuleCustomViewUpdate, ModuleCustomViewDelete
from app.networks.database import db
from app.utils import config, oauth2

modules = APIRouter(tags=["Super Admin - Modules"])


# ================================
#  CRUD for Modules - starting
# ================================
@modules.post("/modules/save")
async def save_modules(request: Request):
    request_form = await request.form()

    try:
        module_id = int(request_form["id"])
        title = request_form["title"].strip()
        app_id = request_form["app_id"]

        # Check if module title already exists for same app
        validation_query = {
            "title": title,
            "app_id": app_id
        }
        if module_id != 0:
            validation_query["id"] = {"$ne": module_id}

        if db.modules.find_one(validation_query):
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Module already exists",
            }

        # Shared image logic
        def get_uploaded_or_old(field: str):
            return (
                config.IMAGE_DO_URL + UploadImage.uploadImage_DO(request_form[field], "modules")
                if request_form.get(field)
                else request_form.get(f"old_{field}")
            )

        # Shared field population
        module_data = {
            "id": module_id if module_id != 0 else int(getLastUserId(db.modules, "id")) + 1,
            "app_id": app_id,
            "app": request_form["app"],
            "title": title,
            #"slug": slugify(title),
            "slug": request_form["slug"],
            "icon_class": request_form["icon_class"],
            "excerpt": request_form["excerpt"],
            "icon": get_uploaded_or_old("icon"),
            "banner": get_uploaded_or_old("banner"),
            "thumbnail": get_uploaded_or_old("thumbnail"),
            "active": int(request_form["active"]),
            "sort_by": int(request_form["sort_by"]),
            "optional": int(request_form["optional"]),
            "deletable": int(request_form["deletable"]),
        }

        if module_id == 0:
            # Create new module
            db.modules.insert_one(ModuleCreate(**module_data).dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Module has been created",
                "data": module_data,
            }
        else:
            # Update existing module
            db.modules.update_one({"id": module_id}, {"$set": ModuleUpdate(**module_data).dict()})
            return {
                "status": status.HTTP_200_OK,
                "message": "Module has been updated",
                "data": module_data,
            }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }

                
# Get Modules
@modules.post("/modules/get")
async def get_modules(request: Request):
    result_array = []
    search_query = {}
    try:
        # query_params = request.query_params
        # isActive = query_params.get('is_active')
        # isDeleted = query_params.get('is_deleted')

        # if isActive:
        #     search_query["active"] = int(isActive)

        search_query["deleted"] = {"$ne": 1}  # Exclude deleted by default
        # if isDeleted:
        #     search_query["deleted"] = int(isDeleted)

        results = db.modules.find(search_query, {"_id": 0},).sort("sort_by", 1)

        if results:
            for result in results:
                result_array.append(result)

            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
                "total_records": getCountforApps("modules", search_query),
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
            "message": str(e) + ",Something went wrong with the requested data."
        }

# Get Modules by Apps
@modules.post("/modules/get-by-apps")
def get_modules_by_apps():
    try:
        search_query = {"deleted": {"$ne": 1}}
        apps_cursor = db.apps.find(search_query).sort("sort_by", 1)
        apps = list(apps_cursor)

        result_array = []

        for app in apps:
            #app_id = app.get("_id")
            app_id = app.get("id")
            if not app_id:
                continue

            module_query = {"deleted": {"$ne": 1}, "app_id": app_id}
            modules_cursor = db.modules.find(module_query, {"_id": 0}).sort("sort_by", 1)
            modules = list(modules_cursor)

            app_dict = {
                **app,
                "_id": str(app_id),
                "modules": modules
            }
            result_array.append(app_dict)

        if result_array:
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
                "total_records": len(result_array),
            }

        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "No apps found.",
            "data": [],
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno
        }



# Get Modules By Id
@modules.post("/modules/get/{id}")
async def get_module_by_id(id: int):
    try:
        result = db.modules.find_one_and_update({"id": id},{"$set": {"deleted": 1}}, {"_id": 0})
        if result:
            return {"status": status.HTTP_200_OK, "data": result}
        else:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "data": [],
                "total_records": 0,
            }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
        }

# Delete Modules
@modules.get("/modules/{id}/deleted/{value}")
async def delete_restore_app_by_id(id: int, value: int):                
    try:
        #Delete modules
        module_delete = ModuleDelete()
        module_delete.deleted = int(value)

        db.modules.update_one(
            {"id": int(id)}, 
            {"$set": module_delete.dict()}
        )

        message = "Record Successfully deleted"
        if value == 0:
            message = "Record Successfully Restored"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "update_recorded": module_delete
        }
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": id + " " + value,
            "line_no": e.__traceback__.tb_lineno,
        }
# ================================
#  CRUD for Modules - ending
# ================================





# =========================================
#  CRUD for Module DB Columns - starting
# =========================================
@modules.post("/modules/db-columns/save")
async def save_module_db_columns(request: Request):
    request_form = await request.form()

    try:
        id = int(request_form["id"])
        module_id = int(request_form["module_id"])
        title = request_form["title"].strip()
        db_field_name = request_form["db_field_name"].strip()

        # Check if module title already exists for same app
        validation_query = {
            "title": title,
            "module_id": module_id,
            "db_field_name": db_field_name,
        }
        if id != 0:
            validation_query["id"] = {"$ne": id}

        if db.modules_db_columns.find_one(validation_query):
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Module DB Column already exists",
            }


        # Shared field population
        module_data = {
            "id": id if id != 0 else int(getLastUserId(db.modules_db_columns, "id")) + 1,
            "module_id": int(request_form["module_id"]),
            "title": title,
            "db_field_name": db_field_name,
            "mandatory": int(request_form["mandatory"]),
            "active": int(request_form["active"]),
            "sort_by": int(request_form["sort_by"]),
            "deletable": int(request_form["deletable"]),
        }

        if id == 0:
            # Create new module
            db.modules_db_columns.insert_one(ModuleDBColumnCreate(**module_data).dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Module DB Colmns has been created",
                "data": module_data,
            }
        else:
            # Update existing module
            db.modules_db_columns.update_one({"id": id}, {"$set": ModuleDBColumnUpdate(**module_data).dict()})
            return {
                "status": status.HTTP_200_OK,
                "message": "Module DB Column has been updated",
                "data": module_data,
            }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }

@modules.post("/modules/db-columns/get")
async def get_module_db_columns(request: Request):
    result_array = []
    search_query = {}
    request_form = await request.form()
    try:
        search_query["deleted"] = {"$ne": 1}
        results = db.modules_db_columns.find(search_query, {"_id": 0},).sort("sort_by", 1)
        if results:
            for result in results:
                result_array.append(result)
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
                "total_records": getCountforApps("modules", search_query),
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

@modules.get("/modules/db-columns/get-by-module-id/{id}")
async def get_db_columns_by_module_id(id: int):
    result_array = []
    search_query = {}
    try:
        module_id = int(id)
        search_query["module_id"] = {"$in": [module_id, 0]}
        search_query["deleted"] = {"$ne": 1}
        results = db.modules_db_columns.find(search_query, {"_id": 0},).sort("sort_by", 1)
        if results:
            for result in results:
                result_array.append(result)
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
                "total_records": getCountforApps("modules", search_query),
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

@modules.get("/modules/db-columns/{id}/deleted/{value}")
async def delete_restore_db_column_by_id(id: int, value: int):                
    try:
        #Delete modules
        module_db_column_delete = ModuleDBColumnDelete()
        module_db_column_delete.deleted = int(value)

        db.modules.update_one(
            {"id": int(id)}, 
            {"$set": module_db_column_delete.dict()}
        )

        message = "Record Successfully deleted"
        if value == 0:
            message = "Record Successfully Restored"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "update_recorded": module_db_column_delete
        }
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": id + " " + value,
            "line_no": e.__traceback__.tb_lineno,
        }
# =========================================
#  CRUD for Module DB Columns - ending
# =========================================





# =========================================
#  CRUD for Module Custom Views - starting
# =========================================
@modules.post("/modules/custom-views/save")
async def save_module_custom_view(request: Request):
    request_form = await request.form()

    try:
        id = int(request_form["id"])
        module_id = int(request_form["module_id"])
        title = request_form["title"].strip()
        slug = request_form["slug"].strip()

        # Check if module title already exists for same app
        validation_query = {
            "title": title,
            "module_id": module_id,
            "slug": slug,
        }
        if id != 0:
            validation_query["id"] = {"$ne": id}

        if db.modules_custom_views.find_one(validation_query):
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Module custom view already exists",
            }


        # Shared field population
        module_data = {
            "id": id if id != 0 else int(getLastUserId(db.modules_custom_views, "id")) + 1,
            "module_id": int(request_form["module_id"]),
            #"ukey": int(request_form["ukey"]) if id != 0 else int(getLastFieldValue(db.modules_custom_views, "ukey")) + 1,
            "ukey": (
                f"{getLastFieldValue(db.modules_custom_views, 'id') + 1:08d}"
                if id == 0
                else int(request_form["ukey"])
            ),
            "columns": request_form["columns"],
            "title": title,
            "slug": slug,
            "system_defined": int(request_form["system_defined"]),
            "default": int(request_form["default"]),
            "active": int(request_form["active"]),
            "sort_by": int(request_form["sort_by"]),
            "deletable": int(request_form["deletable"]),
        }

        if id == 0:
            # Create new module
            db.modules_custom_views.insert_one(ModuleCustomViewCreate(**module_data).dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Module DB Colmns has been created",
                "data": module_data,
            }
        else:
            # Update existing module
            db.modules_custom_views.update_one({"id": id}, {"$set": ModuleCustomViewUpdate(**module_data).dict()})
            return {
                "status": status.HTTP_200_OK,
                "message": "Module DB Column has been updated",
                "data": module_data,
            }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }

"""

@modules.post("/modules/custom-views/sync-with-users")
async def sync_with_users(request: Request):
    request_form = await request.form()

    try:
        # Get all tenant_apps records
        tenant_apps = list(db.tenant_apps.find({"tenant_id": {"$ne": 1} , "deleted": {"$ne": 1}}, {"_id": 0}))
        
        synced_count = 0
        skipped_count = 0
        
        # Get the starting ID for new custom views
        start_id = int(getLastUserId(db.modules_custom_views, "id")) + 1
        current_id = start_id
        
        # Get the last ukey value for incremental generation
        last_ukey = getLastFieldValue(db.modules_custom_views, "ukey")
        if not last_ukey:
            last_ukey = 0
        else:
            # Convert string ukey to integer for incrementing
            try:
                last_ukey = int(last_ukey)
            except (ValueError, TypeError):
                last_ukey = 0
        current_ukey = last_ukey + 1
        
        for tenant_app in tenant_apps:
            tenant_id = tenant_app.get("tenant_id")
            apps_str = tenant_app.get("apps", "{}")
            
            try:
                # Parse apps JSON string
                apps_data = json.loads(apps_str)
                
                # Process each app and its modules
                for app_id, module_ids in apps_data.items():
                    app_id = int(app_id)
                    
                    # Get modules for this app
                    modules = list(db.modules.find(
                        {
                            "id": {"$in": module_ids},
                            "app_id": app_id,
                            "deleted": {"$ne": 1}
                        },
                        {"_id": 0}
                    ))
                    
                    # Process each module
                    for module in modules:
                        module_id = module.get("id")
                        
                        
                        # Find all existing custom views for this tenant (any module) to use as templates
                        template_custom_views = list(db.modules_custom_views.find({
                            "tenant_id": tenant_id,
                            "module_id": module_id,
                            "deleted": {"$ne": 1}
                        }))
                        
                        if template_custom_views:
                            # Loop through all template custom views and clone each one for this module
                            for template_custom_view in template_custom_views:
                                # Check if this specific configuration already exists for this module
                                existing_specific_view = db.modules_custom_views.find_one({
                                    "tenant_id": tenant_id,
                                    "module_id": module_id,
                                    "deleted": {"$ne": 1}
                                })

                                if existing_specific_view:
                                    # Skip if this specific configuration already exists
                                    skipped_count += 1
                                    continue
                                
                                # Clone from template_custom_view with new id, ukey, module_id
                                new_custom_view = {
                                    "id": current_id,
                                    "ukey": f"{current_ukey:08d}",
                                    "tenant_id": tenant_id,
                                    "module_id": module_id,
                                    "title": template_custom_view.get('title', 'Module'),
                                    "slug": template_custom_view.get('slug', 'module'),
                                    "columns": template_custom_view.get("columns", ""),
                                    "criterea": template_custom_view.get("criterea", ""),
                                    "query": template_custom_view.get("query", ""),
                                    "system_defined": template_custom_view.get("system_defined", 1),
                                    "default": template_custom_view.get("default", 1),
                                    "active": template_custom_view.get("active", 1),
                                    "sort_by": template_custom_view.get("sort_by", 0),
                                    "deletable": template_custom_view.get("deletable", 0),
                                    "deleted": 0
                                }
                                
                                # Insert the new custom view
                                db.modules_custom_views.insert_one(new_custom_view)
                                synced_count += 1
                                current_id += 1
                                current_ukey += 1
                       
                        
            except json.JSONDecodeError:
                # Skip invalid JSON in apps field
                continue
        
        return {
            "status": status.HTTP_200_OK,
            "message": f"Sync completed successfully. {synced_count} new custom views created, {skipped_count} existing views skipped.",
            "data": {
                "synced_count": synced_count,
                "skipped_count": skipped_count
            }
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }








@modules.post("/modules/custom-views/sync-with-users")
async def sync_with_users(request: Request):
    request_form = await request.form()

    try:
        # Get all tenant_apps records
        tenant_apps = list(db.tenant_apps.find({"tenant_id": {"$ne": 1} , "deleted": {"$ne": 1}}, {"_id": 0}))
        
        synced_count = 0
        skipped_count = 0
        
        # Get the starting ID for new custom views
        start_id = int(getLastUserId(db.modules_custom_views, "id")) + 1
        current_id = start_id
        
        # Get the last ukey value for incremental generation
        last_ukey = getLastFieldValue(db.modules_custom_views, "ukey")
        if not last_ukey:
            last_ukey = 0
        else:
            # Convert string ukey to integer for incrementing
            try:
                last_ukey = int(last_ukey)
            except (ValueError, TypeError):
                last_ukey = 0
        current_ukey = last_ukey + 1
        
        for tenant_app in tenant_apps:
            tenant_id = tenant_app.get("tenant_id")
            apps_str = tenant_app.get("apps", "{}")
            
            try:
                # Parse apps JSON string
                apps_data = json.loads(apps_str)
                
                # Process each app and its modules
                for app_id, module_ids in apps_data.items():
                    app_id = int(app_id)

                    if module_ids:
                        # Process each module
                        for module_id in module_ids:
                            
                            default_views = list(db.modules_custom_views.find({
                                "tenant_id": 0,
                                "module_id": module_id,
                                "system_defined": 1,
                                "deleted": {"$ne": 1}
                            }))
                            
                            if default_views:
                                # Loop through all default views and clone each one 
                                for default_view in default_views:
                                    template_custom_view = list(db.modules_custom_views.find({
                                        "tenant_id": tenant_id,
                                        "module_id": module_id,
                                    }))
                            
                                    if not template_custom_view:
                                        new_custom_view = {
                                            "id": current_id,
                                            "ukey": f"{current_ukey:08d}",
                                            "tenant_id": tenant_id,
                                            "module_id": module_id,
                                            "title": template_custom_view.get('title', ""),
                                            "slug": template_custom_view.get('slug', ""),
                                            "columns": template_custom_view.get("columns", ""),
                                            "criterea": template_custom_view.get("criterea", ""),
                                            "query": template_custom_view.get("query", ""),
                                            "query_type": template_custom_view.get("query_type", 1),
                                            "system_defined": template_custom_view.get("system_defined", 1),
                                            "default": template_custom_view.get("default", 1),
                                            "active": template_custom_view.get("active", 1),
                                            "sort_by": template_custom_view.get("sort_by", 0),
                                            "deletable": template_custom_view.get("deletable", 0),
                                            "deleted": 0
                                        }

            except json.JSONDecodeError:
                # Skip invalid JSON in apps field
                continue
        
        return {
            "status": status.HTTP_200_OK,
            "message": f"Sync completed successfully. {synced_count} new custom views created, {skipped_count} existing views skipped.",
            "data": {
                "synced_count": synced_count,
                "skipped_count": skipped_count
            }
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }
"""

@modules.post("/modules/custom-views/sync-with-users")
async def sync_with_users(request: Request):
    request_form = await request.form()

    try:
        tenant_apps = list(db.tenant_apps.find(
            {"tenant_id": {"$ne": 1}, "deleted": {"$ne": 1}},
            {"_id": 0}
        ))

        synced_count = 0
        skipped_count = 0

        current_id = int(getLastUserId(db.modules_custom_views, "id")) + 1
        last_ukey = getLastFieldValue(db.modules_custom_views, "ukey")
        try:
            current_ukey = int(last_ukey) + 1 if last_ukey else 1
        except (ValueError, TypeError):
            current_ukey = 1

        # Pre-fetch all system-defined default views for faster lookup
        default_views_lookup = {}
        default_views_cursor = db.modules_custom_views.find({
            "tenant_id": 0,
            "system_defined": 1,
            "deleted": {"$ne": 1}
        }, {"_id": 0})
        for view in default_views_cursor:
            key = (view["module_id"])
            default_views_lookup.setdefault(key, []).append(view)

        new_views = []

        for tenant_app in tenant_apps:
            tenant_id = tenant_app.get("tenant_id")
            apps_str = tenant_app.get("apps", "{}")

            try:
                apps_data = json.loads(apps_str)
            except json.JSONDecodeError:
                continue  # Skip invalid JSON

            for module_ids in apps_data.values():
                if not module_ids:
                    continue

                for module_id in module_ids:
                    defaults = default_views_lookup.get(module_id, [])
                    if not defaults:
                        continue

                    # Check if tenant already has views for this module
                    existing = db.modules_custom_views.count_documents({
                        "tenant_id": tenant_id,
                        "module_id": module_id
                    })

                    if existing > 0:
                        skipped_count += 1
                        continue

                    for default_view in defaults:
                        new_views.append({
                            "id": current_id,
                            "ukey": f"{current_ukey:08d}",
                            "tenant_id": tenant_id,
                            "module_id": module_id,
                            "title": default_view.get("title", ""),
                            "slug": default_view.get("slug", ""),
                            "columns": default_view.get("columns", ""),
                            "criterea": default_view.get("criterea", ""),
                            "query": default_view.get("query", ""),
                            "query_type": default_view.get("query_type", 1),
                            "system_defined": default_view.get("system_defined", 1),
                            "default": default_view.get("default", 1),
                            "active": default_view.get("active", 1),
                            "sort_by": default_view.get("sort_by", 0),
                            "deletable": default_view.get("deletable", 0),
                            "deleted": 0
                        })
                        synced_count += 1
                        current_id += 1
                        current_ukey += 1

        # Bulk insert for better performance
        if new_views:
            db.modules_custom_views.insert_many(new_views)

        return {
            "status": status.HTTP_200_OK,
            "message": f"Sync completed successfully. {synced_count} new custom views created, {skipped_count} existing views skipped.",
            "data": {
                "synced_count": synced_count,
                "skipped_count": skipped_count
            }
        }

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": f"{str(e)}, Something went wrong with the requested data.",
            "data": dict(request_form),
            "line_no": e.__traceback__.tb_lineno,
        }




@modules.post("/modules/custom-views/get")
async def get_module_custom_views(request: Request):
    result_array = []
    search_query = {}
    request_form = await request.form()
    try:
        search_query["deleted"] = {"$ne": 1}
        results = db.modules_custom_views.find(search_query, {"_id": 0},).sort("sort_by", 1)
        if results:
            for result in results:
                result_array.append(result)
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found.",
                "data": []
            }    
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ", Something went wrong with the requested data.",
            "data": []
        }

@modules.get("/modules/custom-views/get-by-module-id/{id}")
async def get_custom_views_by_module_id(id: int):
    result_array = []
    search_query = {}
    try:
        module_id = int(id)
        search_query["module_id"] = {"$in": [module_id, 0]}
        search_query["deleted"] = {"$ne": 1}
        results = db.modules_custom_views.find(search_query, {"_id": 0},).sort("sort_by", 1)
        if results:
            for result in results:
                result_array.append(result)
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found.",
                "data": []
            }    
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ", Something went wrong with the requested data.",
            "data": []
        }

@modules.get("/modules/custom-views/get-default-views-by-module-id/{id}")
async def get_custom_views_by_module_id(id: int):
    result_array = []
    search_query = {}
    try:
        module_id = int(id)
        search_query["tenant_id"] = 0
        search_query["module_id"] = {"$in": [module_id, 0]}
        search_query["deleted"] = {"$ne": 1}
        results = db.modules_custom_views.find(search_query, {"_id": 0},).sort("sort_by", 1)
        if results:
            for result in results:
                result_array.append(result)
            return {
                "status": status.HTTP_200_OK,
                "data": result_array,
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found.",
                "data": []
            }    
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ", Something went wrong with the requested data.",
            "data": []
        }

@modules.get("/modules/custom-views/{id}/deleted/{value}")
async def delete_restore_module_custom_view_id(id: int, value: int):                
    try:
        #Delete modules
        module_custom_view_delete = ModuleCustomViewDelete()
        module_custom_view_delete.deleted = int(value)

        db.modules_custom_views.update_one(
            {"id": int(id)}, 
            {"$set": module_custom_view_delete.dict()}
        )

        message = "Record Successfully deleted"
        if value == 0:
            message = "Record Successfully Restored"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "update_recorded": module_custom_view_delete
        }
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": id + " " + value,
            "line_no": e.__traceback__.tb_lineno,
        }
# =========================================
#  CRUD for Module Custom Views - ending
# =========================================
