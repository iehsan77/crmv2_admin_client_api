import json
import datetime
import os
from fastapi import APIRouter, Request, status, Depends, UploadFile
from app.networks.database import db
from app.utils import oauth2, config
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
)
from app.helpers.uploadimage import UploadImage
from app.models.crm.attachments import AttachmentCreate, AttachmentUpdate, AttachmentInDB
from typing import Optional

# Router
attachments = APIRouter(tags=["CRM Admin - Attachments"])

# MongoDB Collection
attachments_collection = db.attachments

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

def get_file_details(file: UploadFile) -> dict:
    """
    Extract comprehensive file details from an uploaded file.
    """
    # Read file content to get size
    file_content = file.file.read()
    file_size = len(file_content)
    file.file.seek(0)  # Reset file pointer
    
    # Get file extension
    file_extension = ""
    if "." in file.filename:
        file_extension = file.filename.split(".")[-1].lower()
    
    # Determine file type category
    file_type = "document"
    if file_extension in ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"]:
        file_type = "image"
    elif file_extension in ["mp4", "avi", "mov", "wmv", "flv", "webm"]:
        file_type = "video"
    elif file_extension in ["mp3", "wav", "flac", "aac", "ogg"]:
        file_type = "audio"
    elif file_extension in ["pdf"]:
        file_type = "pdf"
    elif file_extension in ["doc", "docx"]:
        file_type = "word"
    elif file_extension in ["xls", "xlsx"]:
        file_type = "excel"
    elif file_extension in ["ppt", "pptx"]:
        file_type = "powerpoint"
    elif file_extension in ["txt", "rtf"]:
        file_type = "text"
    elif file_extension in ["zip", "rar", "7z", "tar", "gz"]:
        file_type = "archive"
    
    return {
        "filename": file.filename,
        "original_filename": file.filename,
        "file_size": file_size,
        "content_type": file.content_type or "application/octet-stream",
        "file_extension": file_extension,
        "file_type": file_type,
        "uploaded_at": datetime.datetime.now().isoformat()
    }

# ===============================
# CRUD for ATTACHMENTS - starting
# ===============================
@attachments.post("/attachments/save")
async def save_attachment(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form = await request.form()
        doc_id = int(form.get("id") or 0)

        files = form.getlist("files")
        created_attachments = []
        
        if files:
            for file in files:
                # Get comprehensive file details
                file_details = get_file_details(file)
                
                # Upload file and get path
                file_path = UploadImage.uploadImage_DO(file, "attachments")
                file_url = config.IMAGE_DO_URL + file_path
                
                # Create individual attachment record for this file
                attachment_create = AttachmentCreate()
                attachment_create.id = int(attachments_collection.count_documents({})) + 1
                attachment_create.related_to = form.get("related_to", "")
                attachment_create.related_to_id = int(form.get("related_to_id", 0))
                attachment_create.folder = int(form.get("folder", ""))
                attachment_create.attachment = form.get("attachment", "")  # description/note
                
                # Store file details at root level
                attachment_create.filename = file_path.split("/")[-1]  # Get filename from path
                attachment_create.original_filename = file_details["original_filename"]
                attachment_create.file_path = file_path
                attachment_create.file_url = file_url
                attachment_create.file_size = file_details["file_size"]
                attachment_create.content_type = file_details["content_type"]
                attachment_create.file_extension = file_details["file_extension"]
                attachment_create.file_type = file_details["file_type"]
                attachment_create.uploaded_at = file_details["uploaded_at"]
                
                attachment_create.tenant_id = user_detail["tenant_id"]
                attachment_create.user_id = user_detail["id"]
                attachment_create.active = int(form.get("active", 1))
                attachment_create.sort_by = int(form.get("sort_by", 0))

                attachments_collection.insert_one(attachment_create.dict())
                created_attachments.append(convert_to_jsonable(attachment_create.dict()))

            return {
                "status": status.HTTP_200_OK,
                "message": f"{len(created_attachments)} attachment(s) created successfully",
                "data": created_attachments
            }
        else:
            # Handle case where no files are uploaded but description is provided
            if doc_id == 0:
                attachment_create = AttachmentCreate()
                
                file = form.get("file")
                if isinstance(file, UploadFile):
                    file_details = get_file_details(file)
                    if file_details:
                        file_path = UploadImage.uploadImage_DO(file, "attachments")
                        file_url = config.IMAGE_DO_URL + file_path

                        # Store file details at root level
                        attachment_create.filename = file_path.split("/")[-1]  # Get filename from path
                        attachment_create.original_filename = file_details["original_filename"]
                        attachment_create.file_path = file_path
                        attachment_create.file_url = file_url
                        attachment_create.file_size = file_details["file_size"]
                        attachment_create.content_type = file_details["content_type"]
                        attachment_create.file_extension = file_details["file_extension"]
                        attachment_create.file_type = file_details["file_type"]
                        attachment_create.uploaded_at = file_details["uploaded_at"]
                

                
                
                attachment_create.id = int(attachments_collection.count_documents({})) + 1
                attachment_create.related_to = form.get("related_to", "")
                attachment_create.related_to_id = int(form.get("related_to_id", 0))
                attachment_create.folder = int(form.get("folder", ""))
                attachment_create.attachment = form.get("attachment", "")
                # No file details for text-only attachments
                attachment_create.tenant_id = user_detail["tenant_id"]
                attachment_create.user_id = user_detail["id"]
                attachment_create.active = int(form.get("active", 1))
                attachment_create.sort_by = int(form.get("sort_by", 0))

                attachments_collection.insert_one(attachment_create.dict())
                return {
                    "status": status.HTTP_200_OK,
                    "message": "Attachment created successfully (no files)",
                    "data": convert_to_jsonable(attachment_create.dict())
                }
            else:
                # Update existing attachment (for cases without files)
                attachment_update = AttachmentUpdate()


                file = form.get("file")
                if isinstance(file, UploadFile):
                    file_details = get_file_details(file)
                    if file_details:
                        file_path = UploadImage.uploadImage_DO(file, "attachments")
                        file_url = config.IMAGE_DO_URL + file_path

                        # Store file details at root level
                        attachment_create.filename = file_path.split("/")[-1]  # Get filename from path
                        attachment_create.original_filename = file_details["original_filename"]
                        attachment_create.file_path = file_path
                        attachment_create.file_url = file_url
                        attachment_create.file_size = file_details["file_size"]
                        attachment_create.content_type = file_details["content_type"]
                        attachment_create.file_extension = file_details["file_extension"]
                        attachment_create.file_type = file_details["file_type"]
                        attachment_create.uploaded_at = file_details["uploaded_at"]
               


                attachment_update.id = doc_id
                attachment_update.related_to = form.get("related_to", "")
                attachment_update.related_to_id = int(form.get("related_to_id", 0))
                attachment_update.folder = int(form.get("folder", ""))
                attachment_update.attachment = form.get("attachment", "")
                # No file details for text-only attachments
                attachment_update.tenant_id = user_detail["tenant_id"]
                attachment_update.user_id = user_detail["id"]
                attachment_update.active = int(form.get("active", 1))
                attachment_update.sort_by = int(form.get("sort_by", 0))

                attachments_collection.update_one(
                    {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                    {"$set": attachment_update.dict()}
                )
                return {
                    "status": status.HTTP_200_OK,
                    "message": "Attachment updated successfully",
                    "data": convert_to_jsonable(attachment_update.dict())
                }
    except Exception as e:
        return get_error_details(e)



@attachments.post("/attachments/get")
async def get_attachments(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        attachments = list(attachments_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        records = []
        if attachments:
            for attachment in attachments:
                # File details are now at root level, no JSON parsing needed
                user = db.users.find_one(
                    {"id": attachment.get("user_id")},
                    NO_ID_PROJECTION
                )
                attachment["user"] = user or {}
                records.append(attachment)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@attachments.post("/attachments/get/{id}")
async def get_attachment_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single attachment by ID with file details at root level.
    """
    try:
        attachment = attachments_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, 
            NO_ID_PROJECTION
        )
        if attachment:
            # File details are now at root level, no JSON parsing needed
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(attachment)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@attachments.post("/attachments/get-by-entity")
async def get_attachments_by_entity(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Get all attachments for a specific entity (related_to and related_to_id).
    """
    try:
        body = await request.json()
        related_to = body.get("related_to", "")
        related_to_id = int(body.get("related_to_id", 0))
        
        attachments = list(attachments_collection.find(
            {
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1},
                "related_to": related_to,
                "related_to_id": related_to_id
            },
            NO_ID_PROJECTION
        ).sort("id", -1))

        records = []
        if attachments:
            for attachment in attachments:
                # File details are now at root level, no JSON parsing needed
                # Get user information
                user = db.users.find_one(
                    {"id": attachment.get("user_id")},
                    NO_ID_PROJECTION
                )
                attachment["user"] = user or {}
                records.append(attachment)

        return {
            "status": status.HTTP_200_OK,
            "message": f"Found {len(records)} attachment(s) for {related_to} ID {related_to_id}",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@attachments.get("/attachments/{id}/deleted/{value}")
async def toggle_attachment_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore an attachment by toggling the 'deleted' flag.
    """
    try:
        attachments_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"deleted": value}}
        )
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@attachments.post("/attachments/statistics")
async def get_attachment_statistics(user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get attachment statistics including file counts, sizes, and type breakdown.
    """
    try:
        attachments = list(attachments_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ))

        total_attachments = len(attachments)
        total_files = 0
        total_size = 0
        file_type_counts = {}
        file_extension_counts = {}

        for attachment in attachments:
            # Check if this attachment has file details (not just text)
            if attachment.get("filename") and attachment.get("file_size"):
                total_files += 1
                
                # Add file size
                file_size = attachment.get("file_size", 0)
                total_size += file_size
                
                # Count file types
                file_type = attachment.get("file_type", "unknown")
                file_type_counts[file_type] = file_type_counts.get(file_type, 0) + 1
                
                # Count file extensions
                file_extension = attachment.get("file_extension", "unknown")
                file_extension_counts[file_extension] = file_extension_counts.get(file_extension, 0) + 1

        # Convert bytes to human readable format
        def format_file_size(size_bytes):
            if size_bytes == 0:
                return "0 B"
            size_names = ["B", "KB", "MB", "GB", "TB"]
            import math
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return f"{s} {size_names[i]}"

        return {
            "status": status.HTTP_200_OK,
            "message": "Statistics retrieved successfully",
            "data": {
                "total_attachments": total_attachments,
                "total_files": total_files,
                "total_size_bytes": total_size,
                "total_size_formatted": format_file_size(total_size),
                "file_type_breakdown": file_type_counts,
                "file_extension_breakdown": file_extension_counts,
                "average_file_size": format_file_size(total_size // total_files) if total_files > 0 else "0 B"
            }
        }
    except Exception as e:
        return get_error_details(e)
# ===============================
# CRUD for ATTACHMENTS - ending
# ===============================
