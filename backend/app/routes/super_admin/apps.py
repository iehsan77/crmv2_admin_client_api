from fastapi import Request, APIRouter, status
from slugify import slugify
from app.helpers.globalfunctions import getLastUserId, getCountforApps
from app.helpers.uploadimage import UploadImage
from app.models.super_admin.apps import CreateApp, UpdateApp, DeleteApp
from app.networks.database import db
from app.utils import config

from app.helpers.general_helper import convert_to_jsonable

apps = APIRouter(tags=["Super Admin - Apps"])
collection = db.apps




# ============================
# CRUD for Apps - starting
# ============================
@apps.post("/apps/save")
async def save_apps(request: Request):
    request_form = await request.form()
    try:
        #normalized_title = " ".join(request_form["title"].lower().split())
        #raw_title = normalized_title
        
        
        request_form_title = request_form["title"].strip()    # Removes spaces from start and end only
        lower_title = request_form_title.lower()  # Trim and convert to lowercase
        if not request_form_title:
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Apps title is required",
            }
    
        # Create Apps
        if int(request_form["id"]) == 0:
            validation = collection.find_one(
                {
                    "title": request_form_title
                }
            )

            if validation:
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Apps already exist",
                }
            
            create_app = CreateApp()
            new_id = int(getLastUserId(collection, "id")) + 1
            create_app.id = new_id
            create_app.title = request_form_title
            #create_app.slug = slugify(request_form_title)
            create_app.slug = request_form["slug"]
            create_app.parent_id = request_form["parent_id"]
            create_app.parent = request_form["parent"]
            create_app.root_url = request_form["root_url"]
            create_app.icon_class = request_form["icon_class"]
            create_app.excerpt = request_form["excerpt"]
            
            # icon
            if request_form["icon"]:
                newFileName = UploadImage.uploadImage_DO(
                    request_form["icon"], "apps"
                )
                create_app.icon = config.IMAGE_DO_URL + newFileName
            else:
                create_app.icon = request_form["old_icon"]
            # banner
            if request_form["banner"]:
                newFileName = UploadImage.uploadImage_DO(
                    request_form["banner"], "apps"
                )
                create_app.banner = config.IMAGE_DO_URL + newFileName
            else:
                create_app.banner = request_form["old_banner"]
            # thumbnail
            if request_form["thumbnail"]:
                newFileName = UploadImage.uploadImage_DO(
                    request_form["thumbnail"], "apps"
                )
                create_app.thumbnail = config.IMAGE_DO_URL + newFileName
            else:
                create_app.thumbnail = request_form["old_thumbnail"]

            create_app.active = request_form["active"]
            create_app.sort_by = request_form["sort_by"]

            collection.insert_one(create_app.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Apps has been created",
                "data": create_app,
            }
        
        #Update Apps
        if int(request_form["id"]) != 0:
            has_id = collection.find_one(
                {
                    'id': {
                        '$eq': int(request_form["id"])
                    }
                }
            )
            if not has_id:
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Record not found.",
                }
            

            validation = collection.find_one(
                {
                    "title": request_form_title,
                    "id": {"$ne": int(request_form["id"])}
                }
            )

            if validation and validation["id"] == int(request_form["id"]):
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Apps already exist",
                }
            
            has_record = collection.find_one(
                {
                    "id": int(request_form["id"])
                }
            )

            if has_record:
                update_app = UpdateApp()
                update_app.id = int(request_form["id"])
                update_app.title = request_form_title
                #update_app.slug = slugify(request_form_title)
                update_app.slug = request_form["slug"]
                update_app.parent_id = request_form["parent_id"]
                update_app.root_url = request_form["root_url"]
                update_app.parent = request_form["parent"]
                update_app.icon_class = request_form["icon_class"]
                update_app.excerpt = request_form["excerpt"]
                # icon
                if request_form["icon"]:
                    newFileName = UploadImage.uploadImage_DO(
                        request_form["icon"], "apps"
                    )
                    update_app.icon = config.IMAGE_DO_URL + newFileName
                else:
                    update_app.icon = request_form["old_icon"]
                # banner
                if request_form["banner"]:
                    newFileName = UploadImage.uploadImage_DO(
                        request_form["banner"], "apps"
                    )
                    update_app.banner = config.IMAGE_DO_URL + newFileName
                else:
                    update_app.banner = request_form["old_banner"]
                # thumbnail
                if request_form["thumbnail"]:
                    newFileName = UploadImage.uploadImage_DO(
                        request_form["thumbnail"], "apps"
                    )
                    update_app.thumbnail = config.IMAGE_DO_URL + newFileName
                else:
                    update_app.thumbnail = request_form["old_thumbnail"]
                    
                update_app.active = request_form["active"]
                update_app.sort_by = request_form["sort_by"]

                collection.update_one(
                    {"id": int(request_form["id"])}, 
                    {"$set": update_app.dict()}
                )

                return {
                    "status": status.HTTP_200_OK,
                    "message": "Record Successfully updated",
                    "data": update_app
                }
                
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": request_form,
            "line_no": e.__traceback__.tb_lineno,
        }

# Get Apps
@apps.post("/apps/get")
async def get_apps(request: Request):
    search_query = {}
    try:
        search_query["deleted"] = {"$ne": 1}  # Exclude deleted by default
    
        results = list(collection.find(search_query, {"_id": 0}).sort("sort_by", 1))

        if results:
            data = convert_to_jsonable(results)

            return {
                "status": status.HTTP_200_OK,
                "data": data,
                "total_records": getCountforApps("apps", search_query),
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

# Get App By Id
@apps.post("/apps/get/{id}")
def get_app_by_id(id: int):
    try:
        resultItem = collection.find_one({"id": id}) # , "deleted": 0
        
        if resultItem:
            results = app_entity(resultItem)
            return {"status": status.HTTP_200_OK, "data": results}
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found.",
                "data": {},
            }
    
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ",Something went wrong with the requested data."
        }

# Delete Apps
@apps.get("/apps/{id}/deleted/{value}")
def delete_restore_app_by_id(id: int, value: int):
    try:
        #Delete Apps
        delete_app = DeleteApp()
        delete_app.deleted = int(value)

        collection.update_one(
            {"id": int(id)}, 
            {"$set": delete_app.dict()}
        )

        message = "Record Successfully deleted"
        if value == 0:
            message = "Record Successfully Restored"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "update_recorded": delete_app
        }
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": id + " " + value,
            "line_no": e.__traceback__.tb_lineno,
        }

# Get Apps with Modules
@apps.get("/apps/get-with-modules")
async def get_apps_with_modules():
    try:
        search_query = {"deleted": {"$ne": 1}}  # Exclude deleted by default
        apps_data = []
        
        # Get all active apps
        apps = collection.find(search_query, {"_id": 0}).sort("sort_by", 1)
        
        if apps:
            for app in apps:
                app_id = int(app['id'])
                
                # Get modules for this app
                modules = db.modules.find(
                    {
                        'app_id': app_id,
                        'deleted': {"$ne": 1}
                    }, 
                    {"_id": 0}
                ).sort("sort_by", 1)
                
                # Add modules as children to the app
                app['modules'] = list(modules)
                apps_data.append(app)

            return {
                "status": status.HTTP_200_OK,
                "data": apps_data,
                "total_records": len(apps_data)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "No apps found",
                "data": []
            }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno
        }

def app_entity(item) -> dict:
    return {
        "id": item["id"],
        "title":item["title"],
        "slug":item["slug"],
        "icon":item["icon"],
        "banner":item["banner"],
        "thumbnail":item["thumbnail"],
        "sort_by":item["sort_by"],
        "active":item["active"],
        "created_at":item["created_at"],
        "created_by":item["created_by"],
        "updated_at":item["updated_at"],
        "updated_by":item["updated_by"],
        "deleted_at":item["deleted_at"],
        "deleted":item["deleted"],
        "deleteable":item["deleteable"],
    }

def apps_entity(entity) -> list:
    return [app_entity(item) for item in entity]
# ============================
# CRUD for Apps - ending
# ============================
