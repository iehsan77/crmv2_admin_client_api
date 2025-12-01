from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify
from app.helpers.uploadimage import UploadImage
from app.utils import oauth2
from app.utils import config

library_rentify_variants = APIRouter(tags=["Super Admin > Library > Rentify > Variants"])
collection = db_rentify.rentify_library_variants

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id

from app.models.super_admin.library.rentify.variants import VariantCreate, VariantUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}



# ================================
# CRUD for Variants - starting
# ================================
@library_rentify_variants.post("/library/rentify/variants/save")
async def save_variant(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        # Duplicate check by title
        title_value = form.get("title", "")
        if doc_id == 0:
            existing = collection.find_one({
                "title": title_value,
                "deleted": {"$ne": 1}
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Record already exists"}

            data = VariantCreate()
            data.id = next_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            
            data.brand_id = int(form.get("brand_id", 0))
            data.brand = form.get("brand")
            
            data.model_id = int(form.get("model_id", 0))
            data.model = form.get("model")
            
            data.tenant_id = 0
            data.is_global = 1
            data.editable = 0
            
            data.active = int(form.get("active", 1))
            data.sort_by = int(form.get("sort_by", 0))

            record = data.dict()
            collection.insert_one(record)
            return {
                "status": status.HTTP_200_OK,
                "message": "Record created successfully",
                "data": convert_to_jsonable(record)
            }
        else:
            # Duplicate check (exclude current record)
            existing = collection.find_one({
                "title": title_value,
                "id": {"$ne": doc_id},
                "deleted": {"$ne": 1}
            })
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Record with this title already exists"}

            data = VariantUpdate()
            data.id = doc_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            
            data.brand_id = int(form.get("brand_id", 0))
            data.brand = form.get("brand")
            
            data.model_id = int(form.get("model_id", 0))
            data.model = form.get("model")
            
            data.tenant_id = 0
            data.is_global = 1
            data.editable = 0            
            
            data.active = int(form.get("active", 1))
            data.sort_by = int(form.get("sort_by", 0))

            record = data.dict()
            collection.update_one({"id": doc_id}, {"$set": record})
            return {
                "status": status.HTTP_200_OK,
                "message": "Record updated successfully",
                "data": convert_to_jsonable(record)
            }
    except Exception as e:
        return get_error_details(e)

@library_rentify_variants.post("/library/rentify/variants/get")
async def get_variants(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        results = list(
            collection
            .find({}, NO_ID_PROJECTION)
            .sort("id", -1)
        )
        if results:
            for result in results:
                result["brand_details"] = db_rentify.rentify_library_brands.find_one({"id": result["brand_id"]}, NO_ID_PROJECTION)
                result["model_details"] = db_rentify.rentify_library_models.find_one({"id": result["model_id"]}, NO_ID_PROJECTION)
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@library_rentify_variants.post("/library/rentify/variants/get/{id}")
async def get_variant_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = collection.find_one(
            {"id": id, "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )
        if result:
            result["brand_details"] = db_rentify.rentify_library_brands.find_one({"id": result["brand_id"]}, NO_ID_PROJECTION)
            result["model_details"] = db_rentify.rentify_library_models.find_one({"id": result["model_id"]}, NO_ID_PROJECTION)
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

@library_rentify_variants.get("/library/rentify/variants/{id}/deleted/{value}")
async def delete_restore_variant(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ================================
# CRUD for Variants - ending
# ================================

