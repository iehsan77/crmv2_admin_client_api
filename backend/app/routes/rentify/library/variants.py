from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify
from app.helpers.uploadimage import UploadImage
from app.utils import oauth2
from app.utils import config
from datetime import datetime, timezone, timedelta

rentify_library_variants = APIRouter(tags=["Super Admin > Library > Rentify > Variants"])
collection = db_rentify.rentify_library_variants
tenant_variants_collection = db_rentify.rentify_library_tenant_variants
activity_logs_collection = db_rentify.activity_logs

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id
from app.helpers.globalfunctions import getBrandById, getBrandsByOriginCountryId

from app.models.super_admin.library.rentify.variants import VariantCreate, VariantUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}



# ================================
# CRUD for Variants - starting
# ================================
@rentify_library_variants.post("/rentify/library/variants/save")
async def save_variant(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        # Duplicate check for title
        title_value = form.get("title", "")
        query = {
            "title": title_value,
            "deleted": {"$ne": 1}
        }
        if doc_id != 0:
            query["id"] = {"$ne": doc_id}

        existing = collection.find_one(query)
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "Record with this title already exists"}

        # Duplicate check for title_ar
        title_ar_value = form.get("title_ar", "")
        if title_ar_value and title_ar_value.strip():  # Only check if title_ar is provided and not empty
            query_ar = {
                "title_ar": title_ar_value,
                "deleted": {"$ne": 1}
            }
            if doc_id != 0:
                query_ar["id"] = {"$ne": doc_id}

            existing_ar = collection.find_one(query_ar)
            if existing_ar:
                return {"status": status.HTTP_302_FOUND, "message": "Record with this Arabic title already exists"}

        if doc_id == 0:
            data = VariantCreate()
            data.id = next_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            data.slug = form.get("slug", "")
            
            data.brand_id = int(form.get("brand_id", 0))
            data.brand = form.get("brand")
            
            data.model_id = int(form.get("model_id", 0))
            data.model = form.get("model")
            
            data.tenant_id = int(user_detail["tenant_id"])
            data.is_global = 0
            data.editable = 1
            data.add_by = int(user_detail["id"])
            data.createdon = datetime.now(timezone.utc).isoformat()
            
            data.active = int(form.get("active", 1))
            data.sort_by = int(form.get("sort_by", 0))

            record = data.dict()
            collection.insert_one(record)

            try:
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "variant_created",
                    "entity_type": "variant",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"New variant created: {record.get('title', 'Untitled')}",
                    "description": f"Variant '{record.get('title', 'N/A')}' was created for brand ID {record.get('brand_id', 0)}",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "variant_id": record.get("id"),
                        "title": record.get("title"),
                        "brand_id": record.get("brand_id"),
                        "model_id": record.get("model_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass

            # --- Tenant-variant mapping ---
            tenant_id = int(user_detail["tenant_id"])
            existing_tenant_variant = tenant_variants_collection.find_one({
                "tenant_id": tenant_id,
                "variant_id": record["id"]
            })

            if not existing_tenant_variant:
                tenant_variant_data = {
                    "id": get_next_id(tenant_variants_collection),
                    "tenant_id": tenant_id,
                    "variant_id": record["id"],
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "active": 1,
                    "deleted": 0
                }
                tenant_variants_collection.insert_one(tenant_variant_data)

            # Add is_used field and other info
            record["is_used"] = 1
            record["is_global"] = 0
            record["editable"] = 1
            record["brand_details"] = getBrandById(int(record.get("brand_id")))
            record["model_details"] = db_rentify.rentify_library_models.find_one({"id": record.get("model_id")}, NO_ID_PROJECTION)

            return {
                "status": status.HTTP_200_OK,
                "message": "Record created successfully",
                "data": convert_to_jsonable(record)
            }
        else:
            data = VariantUpdate()
            data.id = doc_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            data.slug = form.get("slug", "")
            
            data.brand_id = int(form.get("brand_id", 0))
            data.brand = form.get("brand")
            
            data.model_id = int(form.get("model_id", 0))
            data.model = form.get("model")
            
            data.tenant_id = int(user_detail["tenant_id"])
            data.is_global = 0
            data.editable = 1            
            data.edit_by = int(user_detail["id"])
            data.updatedon = datetime.now(timezone.utc).isoformat()
            
            data.active = int(form.get("active", 1))
            data.sort_by = int(form.get("sort_by", 0))

            record = data.dict()
            collection.update_one({"id": doc_id}, {"$set": record})

            try:
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "variant_updated",
                    "entity_type": "variant",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"Variant updated: {record.get('title', 'Untitled')}",
                    "description": f"Variant '{record.get('title', 'N/A')}' was modified",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "variant_id": record.get("id"),
                        "title": record.get("title"),
                        "brand_id": record.get("brand_id"),
                        "model_id": record.get("model_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass

            # --- Tenant-variant mapping (ensure exists) ---
            tenant_id = int(user_detail["tenant_id"])
            existing_tenant_variant = tenant_variants_collection.find_one({
                "tenant_id": tenant_id,
                "variant_id": record["id"]
            })
                
            """
            if not existing_tenant_variant:
                tenant_variant_data = {
                    "id": get_next_id(tenant_variants_collection),
                    "tenant_id": tenant_id,
                    "variant_id": record["id"],
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "active": 1,
                    "deleted": 0
                }
                tenant_variants_collection.insert_one(tenant_variant_data)

            # Add is_used field and other info
            record["is_used"] = 1
            record["is_global"] = 0
            record["editable"] = 1
            """
            record["brand_details"] = getBrandById(int(record.get("brand_id")))
            record["model_details"] = db_rentify.rentify_library_models.find_one({"id": record.get("model_id")}, NO_ID_PROJECTION)

            record_for_tenant = tenant_variants_collection.find_one({"tenant_id": tenant_id, "variant_id":int(record["id"])}, {"_id": 0, "variant_id": 1})
            if record_for_tenant:
                record["is_used"] = 1
            else:
                record["is_used"] = 0


            return {
                "status": status.HTTP_200_OK,
                "message": "Record updated successfully",
                "data": convert_to_jsonable(record)
            }
    except Exception as e:
        return get_error_details(e)

@rentify_library_variants.post("/rentify/library/variants/get")
async def get_variants(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()

        tenant_id = int(user_detail.get("tenant_id", 0))

        # Base filter: not deleted, visible to tenant (global or tenant-owned, for future-proofing)
        filter_query = {"deleted": {"$ne": 1}, "$or": [{"is_global": 1}, {"tenant_id": tenant_id}]}
        warnings = []

        # brand_id and origin_country_id handling
        brand_id_value = form.get("brand_id")
        origin_country_id_value = form.get("origin_country_id")

        if origin_country_id_value and origin_country_id_value != "" and str(origin_country_id_value).lower() != "null":
            try:
                origin_country_id = int(origin_country_id_value)
                matching_brand_ids = getBrandsByOriginCountryId(origin_country_id)
                if matching_brand_ids:
                    if brand_id_value and brand_id_value != "" and str(brand_id_value).lower() != "null":
                        try:
                            requested_brand_id = int(brand_id_value)
                            if requested_brand_id in matching_brand_ids:
                                filter_query["brand_id"] = requested_brand_id
                            else:
                                filter_query["brand_id"] = {"$in": []}
                        except (ValueError, TypeError):
                            filter_query["brand_id"] = {"$in": matching_brand_ids}
                    else:
                        filter_query["brand_id"] = {"$in": matching_brand_ids}
                else:
                    filter_query["brand_id"] = {"$in": []}
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'origin_country_id' value '{origin_country_id_value}', filter skipped")
        elif brand_id_value and brand_id_value != "" and str(brand_id_value).lower() != "null":
            try:
                filter_query["brand_id"] = int(brand_id_value)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'brand_id' value '{brand_id_value}', filter skipped")

        # model_id filter
        model_id_value = form.get("model_id")
        if model_id_value and model_id_value != "" and str(model_id_value).lower() != "null":
            try:
                filter_query["model_id"] = int(model_id_value)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'model_id' value '{model_id_value}', filter skipped")

        # variant_id filter (maps to id)
        variant_id_value = form.get("variant_id")
        if variant_id_value and variant_id_value != "" and str(variant_id_value).lower() != "null":
            try:
                filter_query["id"] = int(variant_id_value)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'variant_id' value '{variant_id_value}', filter skipped")

      
        # last_activity filter (createdon/updatedon)
        last_activity_duration = None
        if form.get("last_activity") in ["last_24_hours", "last_7_days", "last_30_days"]:
            last_activity_duration = form.get("last_activity")

        if last_activity_duration:
        
            try:
                tenant_id = user_detail.get("tenant_id")
                
                # Calculate the start time based on the duration
                if last_activity_duration == "last_24_hours":
                    start_time = datetime.utcnow() - timedelta(hours=24)
                elif last_activity_duration == "last_7_days":
                    start_time = datetime.utcnow() - timedelta(days=7)
                elif last_activity_duration == "last_30_days":
                    start_time = datetime.utcnow() - timedelta(days=30)
                
                start_time_iso = start_time.isoformat()
                
                # Query activity_logs to get brand IDs with activity in the specified time range
                activity_logs = list(activity_logs_collection.find({
                    "entity_type": "variant",
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "createdon": {"$gte": start_time_iso}
                }, {"entity_id": 1}))
                
                # Collect unique brand IDs from activity_logs
                brand_ids: Set[int] = set()
                for activity in activity_logs:
                    entity_id = activity.get("entity_id")
                    if entity_id is None:
                        continue
                    try:
                        brand_ids.add(int(entity_id))
                    except (TypeError, ValueError):
                        continue
                
                # Merge with existing filter_query["id"] if it exists (AND logic)
                existing_id_filter = filter_query.get("id")
                if existing_id_filter is not None:
                    existing_ids: Set[int] = set()
                    if isinstance(existing_id_filter, dict) and "$in" in existing_id_filter:
                        try:
                            existing_ids = {int(val) for val in existing_id_filter["$in"]}
                        except (TypeError, ValueError):
                            existing_ids = set()
                    else:
                        try:
                            existing_ids = {int(existing_id_filter)}
                        except (TypeError, ValueError):
                            existing_ids = set()
                    brand_ids &= existing_ids
                
                # Filter brands by IDs with activity in the specified time range
                if brand_ids:
                    filter_query["id"] = {"$in": list(brand_ids)}
                else:
                    # No activity found in the time range, return empty result
                    filter_query["id"] = {"$in": [-1]}
                    
            except Exception as e:
                # If parsing fails, ignore the last_activity filter
                print(f"Error parsing last_activity: {e}")    

        # Fetch variants
        variants = list(
            collection
            .find(filter_query, NO_ID_PROJECTION)
            .sort("id", -1)
        )

        # Compute is_used per tenant
        used_variant_ids = set()
        if tenant_variants_collection:
            used = tenant_variants_collection.find({"tenant_id": tenant_id}, {"_id": 0, "variant_id": 1})
            used_variant_ids = {int(u.get("variant_id")) for u in used if u.get("variant_id") is not None}
            print(f"Debug: Found {len(used_variant_ids)} used variants for tenant {tenant_id}: {used_variant_ids}")
        else:
            print(f"Debug: tenant_variants_collection is None")

        for v in variants:
            v_id = int(v.get("id", 0))
            v["is_used"] = 1 if v_id in used_variant_ids else 0
            print(f"Debug: Variant {v_id} - is_used: {v['is_used']}")
            v["brand_details"] = getBrandById(int(v.get("brand_id")))  
            v["model_details"] = db_rentify.rentify_library_models.find_one({"id": v.get("model_id")}, NO_ID_PROJECTION)

        # Debug: Print final data structure
        print(f"Debug: Final variants data structure (first item): {variants[0] if variants else 'No variants'}")

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(variants),
            "filters_applied": filter_query,
            "total_count": len(variants),
            "filters_summary": {
                "active": form.get("active"),
                "variant_id": form.get("variant_id"),
                "last_activity": form.get("last_activity"),
                "brand_id": form.get("brand_id"),
                "origin_country_id": form.get("origin_country_id"),
                "model_id": form.get("model_id")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_variants.post("/rentify/library/variants/select-for-tenant")
async def select_tenant_variant(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        variant_id = int(form.get("variant_id", 0))

        if not tenant_id or not variant_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and variant_id are required"}

        # Check variant exists in library
        variant_exists = collection.find_one({"id": variant_id, "deleted": {"$ne": 1}})
        if not variant_exists:
            return {"status": status.HTTP_404_NOT_FOUND, "message": "variant not found in library"}

        # Check if already assigned
        existing = tenant_variants_collection.find_one({
            "tenant_id": tenant_id,
            "variant_id": variant_id
        })

        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "variant already assigned to this tenant"}

        tenant_variant_data = {
            "id": get_next_id(tenant_variants_collection),
            "tenant_id": tenant_id,
            "variant_id": variant_id,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "active": 1,
            "deleted": 0
        }

        tenant_variants_collection.insert_one(tenant_variant_data)

        return {
            "status": status.HTTP_200_OK,
            "message": "variant assigned to tenant successfully",
            "data": convert_to_jsonable(tenant_variant_data)
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_variants.post("/rentify/library/variants/unselect-for-tenant")
async def unselect_tenant_variant(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        variant_id = int(form.get("variant_id", 0))

        if not tenant_id or not variant_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and variant_id are required"}

        result = tenant_variants_collection.delete_one({
            "tenant_id": tenant_id,
            "variant_id": variant_id
        })

        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "variant removed from tenant successfully",
                "data": None
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant variant relationship not found",
                "data": None
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_variants.post("/rentify/library/variants/get/{id}")
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

@rentify_library_variants.get("/rentify/library/variants/{id}/deleted/{value}")
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


# fetch all variants for dropdown - selected by tenant_id
@rentify_library_variants.get("/rentify/library/variants/dropdown")
async def get_variants_dropdown(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail["tenant_id"])
        variants = list(tenant_variants_collection.find({"tenant_id": tenant_id}, {"_id": 0, "variant_id": 1}))
        for variant in variants:
            variant["title"] = collection.find_one({"id": variant["variant_id"]}, {"_id": 0, "title": 1})["title"]  

        return {"status": status.HTTP_200_OK, "message": "Records retrieved successfully", "data": convert_to_jsonable(variants)}
    except Exception as e:
        return get_error_details(e)



# ================================
# CRUD for Variants - ending
# ================================

