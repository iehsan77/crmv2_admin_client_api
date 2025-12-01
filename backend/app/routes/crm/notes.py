import json

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import List, Optional
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
from app.models.crm.note import NoteCreate, NoteUpdate, NoteInDB


# Router
notes = APIRouter(tags=["CRM Admin - Notes"])

# MongoDB Collection
notes_collection = db.notes

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

# ===============================
# CRUD for NOTES - starting
# ===============================
@notes.post("/notes/save")
async def save_note(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update a note using Pydantic models.
    """
    try:
            form = await request.form()
            doc_id = int(form.get("id"))

            # Get files from form data
            files = form.getlist("files")
            

            uploaded_files = []
            if files:
                for file in files:
                    file_path = UploadImage.uploadImage_DO(file, "notes")
                    uploaded_files.append(config.IMAGE_DO_URL + file_path)
            
            # Handle existing files from the form
            try:
                old_files_raw = form.get("old_files", "[]")
                old_files = json.loads(old_files_raw) if old_files_raw else []
                
                # Validate and add existing files to uploaded_files list
                if isinstance(old_files, list):
                    # Filter out any invalid entries and ensure they're strings
                    valid_old_files = [
                        str(file_url) for file_url in old_files 
                        if file_url and isinstance(file_url, (str, int, float))
                    ]
                    uploaded_files.extend(valid_old_files)
                else:
                    # If old_files is not a list, log warning and continue
                    print(f"Warning: old_files is not a list: {type(old_files)}")
                    
            except (json.JSONDecodeError, TypeError) as e:
                # Log the error but continue with empty old_files
                print(f"Error parsing old_files JSON: {e}")
                # Continue with empty old_files list

            if doc_id == 0:
                # Create new note                
                note_data = NoteCreate()
                note_data.id = get_next_id(notes_collection)
                note_data.related_to = form.get("related_to", "")
                note_data.related_to_id = int(form.get("related_to_id", 0))
                note_data.note = form.get("note", "")
                note_data.files = json.dumps(uploaded_files)
                note_data.tenant_id = user_detail["tenant_id"]
                note_data.user_id = user_detail["id"]
                note_data.active = int(form.get("active", 1))
                note_data.sort_by = int(form.get("sort_by", 0))
                
                notes_collection.insert_one(note_data.dict())
                return {
                    "status": status.HTTP_200_OK,
                    "message": "Note created successfully",
                    "data": convert_to_jsonable(note_data.dict())
                }
            else:
                # Update existing note
                note_data = NoteUpdate()
                note_data.id = doc_id
                note_data.related_to = form.get("related_to", "")
                note_data.related_to_id = int(form.get("related_to_id", 0))
                note_data.note = form.get("note", "")
                note_data.files = json.dumps(uploaded_files)
                note_data.tenant_id = user_detail["tenant_id"]
                note_data.user_id = user_detail["id"]
                note_data.active = int(form.get("active", 1))
                note_data.sort_by = int(form.get("sort_by", 0))
                
                notes_collection.update_one(
                    {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                    {"$set": note_data.dict()}
                )


                return {
                    "status": status.HTTP_200_OK,
                    "message": "Note updated successfully",
                    "data": convert_to_jsonable(note_data.dict())
                }

             
                
    except Exception as e:
            return get_error_details(e)

@notes.post("/notes/get")
async def get_notes(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        notes = list(notes_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        records = []
        if notes:
            for note in notes:
                # Get user information
                user = db.users.find_one(
                    {"id": note.get("user_id")},
                    NO_ID_PROJECTION
                )
                note["user"] = user or {}
                records.append(note)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

    
    
"""

@notes.post("/notes/get")
async def get_notes(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        form = await request.form()
        records = list(notes_collection.find({"related_to": form["related_to"], "related_to_id": form["related_to_id"], "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", -1))
        return json_response("Records retrieved successfully", records)
    except Exception as e:
        return get_error_response(e)    
"""    
    

@notes.post("/notes/get/{id}")
async def get_note_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single note by ID.
    """
    try:
        note = notes_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if note:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(note)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@notes.get("/notes/{id}/deleted/{value}")
async def toggle_note_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a note by toggling the 'deleted' flag.
    """
    try:
        notes_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ===============================
# CRUD for NOTES - ending
# ===============================
