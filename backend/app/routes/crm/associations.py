import json

from fastapi import APIRouter, Request, status, Depends
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from app.helpers.uploadimage import UploadImage
from app.models.crm.attachments import AttachmentCreate, AttachmentUpdate
from app.networks.database import db, db_rentify
from app.utils import config, oauth2
from app.helpers.general_helper import (
    get_next_id,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
)
from app.models.crm.associations import AssociationCreate, AssociationUpdate, AssociationInDB

# Router
associations = APIRouter(tags=["CRM Admin - Associations"])

# MongoDB Collection
associations_collection = db.associations
attachments_collection = db.attachments

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


def _parse_target_module_ids(raw_value: Any) -> List[int]:
    """Normalize incoming target_module_ids into a unique list of ints."""
    if raw_value is None:
        return []

    if isinstance(raw_value, list):
        candidates = raw_value
    elif isinstance(raw_value, str):
        raw = raw_value.strip()
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            candidates = [item.strip() for item in raw.split(",") if item.strip()]
        else:
            if isinstance(parsed, list):
                candidates = parsed
            elif parsed is None:
                return []
            else:
                candidates = [parsed]
    else:
        candidates = [raw_value]

    normalized: List[int] = []
    seen: set[int] = set()
    for candidate in candidates:
        try:
            if isinstance(candidate, str):
                candidate = candidate.strip()
                if candidate == "":
                    continue
            number = int(candidate)
        except (TypeError, ValueError):
            continue
        if number not in seen:
            normalized.append(number)
            seen.add(number)

    return normalized


STATUS_COLLECTION_MAP: Dict[str, str] = {
    "leads": "leads_status_options",
    "contacts": "contacts_status_options",
    "accounts": "accounts_status_options",
    "deals": "deal_status_options",
}


SOURCE_COLLECTION_MAP: Dict[str, str] = {
    "leads": "lead_sources",
    "contacts": "lead_sources",
    "deals": "lead_sources",
}


def _to_int(value: Any) -> Optional[int]:
    try:
        if value in (None, ""):
            return None
        if isinstance(value, str):
            value = value.strip()
            if value == "":
                return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _lookup_user(user_id: Any) -> Dict[str, Any]:
    user_int = _to_int(user_id)
    if user_int is None:
        return {}
    try:
        return db.users.find_one({"id": user_int}, NO_ID_PROJECTION) or {}
    except Exception:
        return {}


def _lookup_from_collection(collection_name: Optional[str], record_id: Any, tenant_id: int) -> Dict[str, Any]:
    record_int = _to_int(record_id)
    if not collection_name or record_int is None:
        return {}
    try:
        return db[collection_name].find_one(
            {
                "id": record_int,
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
        ) or {}
    except Exception:
        return {}


def _enrich_target_record(record: Dict[str, Any], tenant_id: int, module: str) -> Dict[str, Any]:
    record = dict(record) if isinstance(record, dict) else record

    record["assigned_to_details"] = _lookup_user(record.get("assigned_to_id"))
    record["owner_details"] = _lookup_user(record.get("owner_id"))

    module_key = (module or "").lower()

    status_collection = STATUS_COLLECTION_MAP.get(module_key)
    record["status_details"] = _lookup_from_collection(status_collection, record.get("status_id"), tenant_id)

    source_collection = SOURCE_COLLECTION_MAP.get(module_key)
    record["source_details"] = _lookup_from_collection(source_collection, record.get("source_id"), tenant_id)

    return record

# ===============================
# CRUD for ASSOCIATIONS - starting
# ===============================

@associations.post("/crm/associations/save")
async def save_association(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update an association.
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id", 0))

        raw_target_ids: Any = None
        if hasattr(form, "getlist"):
            list_values = form.getlist("target_module_ids[]")
            if list_values:
                raw_target_ids = list_values
        if raw_target_ids is None:
            raw_target_ids = form.get("target_module_ids")

        target_module_ids = _parse_target_module_ids(raw_target_ids)

        if doc_id == 0:
            # Create new association
            association_data = AssociationCreate()
            association_data.id = get_next_id(associations_collection)
            association_data.source_module = form.get("source_module", "")
            association_data.source_module_id = int(form.get("source_module_id", 0))
            association_data.target_module = form.get("target_module", "")
            association_data.target_module_ids = target_module_ids
            association_data.tenant_id = user_detail["tenant_id"]
            association_data.user_id = user_detail["id"]
            association_data.active = int(form.get("active", 1))
            association_data.sort_by = int(form.get("sort_by", 0))
            association_data.createdon = datetime.now(timezone.utc).isoformat()
            association_data.updatedon = datetime.now(timezone.utc).isoformat()
            
            associations_collection.insert_one(association_data.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Association created successfully",
                "data": convert_to_jsonable(association_data.dict())
            }
        else:
            # Update existing association
            association_data = AssociationUpdate()
            association_data.id = doc_id
            association_data.source_module = form.get("source_module", "")
            association_data.source_module_id = int(form.get("source_module_id", 0))
            association_data.target_module = form.get("target_module", "")
            association_data.target_module_ids = target_module_ids
            association_data.tenant_id = user_detail["tenant_id"]
            association_data.user_id = user_detail["id"]
            association_data.active = int(form.get("active", 1))
            association_data.sort_by = int(form.get("sort_by", 0))
            association_data.updatedon = datetime.now(timezone.utc).isoformat()
            
            associations_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]},
                {"$set": association_data.dict()}
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Association updated successfully",
                "data": convert_to_jsonable(association_data.dict())
            }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/get")
async def get_associations(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get all associations with optional filtering.
    """
    try:
        form = await request.form()
        tenant_id = user_detail["tenant_id"]
        
        # Build query
        query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}
        
        # Optional filters
        source_module = form.get("source_module", "")
        source_module_id = form.get("source_module_id", "")
        target_module = form.get("target_module", "")
        
        if source_module:
            query["source_module"] = source_module
        if source_module_id:
            query["source_module_id"] = int(source_module_id)
        if target_module:
            query["target_module"] = target_module
        
        associations_list = list(associations_collection.find(
            query,
            NO_ID_PROJECTION
        ).sort("id", -1))

        for association in associations_list:
            # Normalize target_module_ids to ints
            target_ids = _parse_target_module_ids(association.get("target_module_ids"))
            association["target_module_ids"] = target_ids

            target_module_name = str(association.get("target_module", "")).strip()
            target_module_key = target_module_name.lower()

            # Get target module details (array of IDs)

            if target_ids and target_module_name:
                if "rentify_" in target_module_name:
                    target_details = list(db_rentify[target_module_name].find(
                        {
                            "id": {"$in": target_ids},
                            "tenant_id": user_detail["tenant_id"],
                            "deleted": {"$ne": 1}
                        },
                        NO_ID_PROJECTION
                    ))
                else:
                    target_details = list(db[target_module_name].find(
                        {
                            "id": {"$in": target_ids},
                            "tenant_id": user_detail["tenant_id"],
                            "deleted": {"$ne": 1}
                        },
                        NO_ID_PROJECTION
                    ))
                association["target_module_ids_details"] = [
                    _enrich_target_record(detail, user_detail["tenant_id"], target_module_key)
                    for detail in target_details
                ]
            else:
                association["target_module_ids_details"] = []

            # # Get source module details (single ID)
            # source_id_raw = association.get("source_module_id")
            # source_module = association.get("source_module")
            # try:
            #     source_id = int(source_id_raw) if source_id_raw is not None else None
            # except (TypeError, ValueError):
            #     source_id = None

            # if source_module and source_id is not None:
            #     source_details = db[source_module].find_one(
            #         {
            #             "id": source_id,
            #             "tenant_id": user_detail["tenant_id"],
            #             "deleted": {"$ne": 1}
            #         },
            #         NO_ID_PROJECTION
            #     )
            #     association["source_module_id_details"] = source_details or {}
            #     association["source_module_id"] = source_id
            # else:
            #     association["source_module_id_details"] = {}

        return {
            "status": status.HTTP_200_OK,
            "message": "Associations retrieved successfully",
            "data": convert_to_jsonable(associations_list[0])
        }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/get/{id}")
async def get_association_by_id(
    id: int,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get a single association by ID.
    """
    try:
        association = associations_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )
        if association:
            return {
                "status": status.HTTP_200_OK,
                "message": "Association retrieved successfully",
                "data": convert_to_jsonable(association)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Association not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/get-by-source")
async def get_associations_by_source(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get associations by source module and source module ID.
    """
    try:
        form = await request.form()
        tenant_id = user_detail["tenant_id"]
        
        source_module = form.get("source_module", "")
        source_module_id = int(form.get("source_module_id", 0))
        
        if not source_module or source_module_id == 0:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "source_module and source_module_id are required",
                "data": []
            }
        
        associations_list = list(associations_collection.find(
            {
                "tenant_id": tenant_id,
                "source_module": source_module,
                "source_module_id": source_module_id,
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION
        ).sort("id", -1))

        return {
            "status": status.HTTP_200_OK,
            "message": "Associations retrieved successfully",
            "data": convert_to_jsonable(associations_list)
        }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/get-by-target")
async def get_associations_by_target(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get associations by target module and target module ID.
    """
    try:
        form = await request.form()
        tenant_id = user_detail["tenant_id"]
        
        target_module = form.get("target_module", "")
        target_module_id = int(form.get("target_module_id", 0))
        
        if not target_module or target_module_id == 0:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "target_module and target_module_id are required",
                "data": []
            }
        
        # Find associations where target_module_id is in the target_module_ids array
        # In MongoDB, to check if a value exists in an array field, use the value directly
        associations_list = list(associations_collection.find(
            {
                "tenant_id": tenant_id,
                "target_module": target_module,
                "target_module_ids": target_module_id,  # MongoDB automatically checks if value is in array
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION
        ).sort("id", -1))

        return {
            "status": status.HTTP_200_OK,
            "message": "Associations retrieved successfully",
            "data": convert_to_jsonable(associations_list)
        }
    except Exception as e:
        return get_error_details(e)


@associations.get("/crm/associations/{id}/delete/{value}")
async def toggle_association_deletion(
    id: int,
    value: int,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Soft delete or restore an association by toggling the 'deleted' flag.
    """
    try:
        associations_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]},
            {"$set": {"deleted": value, "updatedon": datetime.now(timezone.utc).isoformat()}}
        )
        message = "Association deleted successfully" if value else "Association restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/delete")
async def delete_association(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Delete an association permanently or soft delete.
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id", 0))
        permanent = form.get("permanent", "false").lower() == "true"
        
        if doc_id == 0:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Association ID is required",
                "data": None
            }
        
        if permanent:
            # Permanent delete
            associations_collection.delete_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}
            )
            message = "Association permanently deleted"
        else:
            # Soft delete
            associations_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]},
                {"$set": {"deleted": 1, "updatedon": datetime.now(timezone.utc).isoformat()}}
            )
            message = "Association deleted successfully"
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)


@associations.post("/crm/associations/attachments/save")
async def save_association_attachment(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Add an attachment to affiliate profile
    """
    try:
        # Get form data
        form = await request.form()

        tenant_id = int(user_detail.get("tenant_id", 0))
        record_id = int(form.get("id", 0) or 0)
        next_id =  (record_id if record_id else get_next_id(attachments_collection))
        file_name = form.get("file_name", "")
        attached_by = form.get("attached_by", user_detail.get("id", 0))
        attached_date = form.get("attached_date", datetime.now(timezone.utc).isoformat())
        
        related_to = form.get("related_to", "")
        related_to_id = form.get("related_to_id", 0)
        
        old_file = form.get("old_file", "")
        active_raw = form.get("active", 1)
        try:
            active_val = int(active_raw)
        except (ValueError, TypeError):
            active_val = 1
        
        # File can come under "file" or "attachment"
        upload_file = form.get("file") 
        
        if not upload_file:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "file is required",
                "data": None
            }
        
        # Upload file to DO and persist record
        
        if record_id == 0:

            if upload_file:
                upload_path = UploadImage.uploadImage_DO(upload_file, f"rentify/associations/attachments")
                file_url = (getattr(config, 'IMAGE_DO_URL', '') or '') + upload_path
            else:
                file_url = old_file
                upload_path = old_file

            attachment_create = AttachmentCreate(
                id=next_id,
                file_name=file_name or getattr(upload_file, 'filename', ''),
                file_path=upload_path,
                file_url=file_url,
                file_type=getattr(upload_file, 'content_type', ''),
                file_size=getattr(upload_file, 'size', 0) or 0,
                attached_by=attached_by,
                related_to=related_to,
                related_to_id=related_to_id,
                attached_date=attached_date,
                old_file=old_file,
                active=active_val,
                deleted=0,
                createdon=datetime.now(timezone.utc).isoformat(),
                tenant_id=tenant_id
            )

            attachments_collection.insert_one(attachment_create.dict())
        
        else:

            if upload_file:
                upload_path = UploadImage.uploadImage_DO(upload_file, f"rentify/associations/attachments")
                file_url = (getattr(config, 'IMAGE_DO_URL', '') or '') + upload_path
            else:                
                file_url = old_file
                upload_path = old_file

            
            attachment_update = AttachmentUpdate(
                id=next_id,
                file_name=file_name or getattr(upload_file, 'filename', ''),
                file_path=upload_path,
                file_url=file_url,
                file_type=getattr(upload_file, 'content_type', ''),
                file_size=getattr(upload_file, 'size', 0) or 0,
                attached_by=attached_by,
                related_to=related_to,
                related_to_id=related_to_id,
                attached_date=attached_date,
                old_file=old_file,
                active=active_val,
                deleted=0,
                updatedon=datetime.now(timezone.utc).isoformat(),
                tenant_id=tenant_id
            )

            attachments_collection.update_one(
                {"id": next_id, "tenant_id": tenant_id},
                {"$set": attachment_update.dict()}
            )
        

        # Get all attachments using the helper function
        buckets = get_association_attachments_data(related_to,related_to_id, tenant_id)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachment added successfully",
            "data": convert_to_jsonable(buckets),
            "tenant_id": tenant_id,
            "record_id": int(record_id)
        }
        
    except Exception as e:
        return get_error_details(e)



@associations.post("/crm/associations/attachments/get")
async def get_association_attachments(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get association attachments by related_to and related_to_id.
    """
    try:
        form = await request.form()
        related_to = form.get("related_to", "")
        related_to_id = int(form.get("related_to_id", 0))
        tenant_id = user_detail["tenant_id"]
        
        attachments = get_association_attachments_data(related_to, related_to_id, tenant_id)
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachments retrieved successfully",
            "data": convert_to_jsonable(attachments)
        }
    except Exception as e:
        return get_error_details(e)


def get_association_attachments_data(related_to: str, related_to_id: int, tenant_id: int) -> dict:
    """
    Get affiliate attachments organized by folder buckets
    """
    try:
        # Get all attachments for this affiliate
        attachments = list(attachments_collection.find({
            "related_to": related_to,
            "related_to_id": int(related_to_id),
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION))

        for attachment in attachments:
            raw_size = attachment.get("file_size")
            try:
                size_in_mb = (float(raw_size) if raw_size is not None else 0.0) / 1024 / 1024
            except (TypeError, ValueError):
                size_in_mb = 0.0
            attachment["file_size"] = f"{size_in_mb:.2f} MB"

            file_url = attachment.get("file_url") or ""
            parsed_url = urlparse(file_url)
            suffix = Path(parsed_url.path).suffix if parsed_url.path else ""
            attachment["file_extension"] = suffix[1:].lower() if suffix.startswith(".") else suffix.lower()
        return attachments
    except Exception as e:
        print(f"Error getting affiliate attachments: {e}")
        return {
           "attachments": []
        }




# ===============================
# CRUD for ASSOCIATIONS - ending
# ===============================

