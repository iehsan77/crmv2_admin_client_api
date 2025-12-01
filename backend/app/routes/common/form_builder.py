from fastapi import APIRouter, Request, status
from app.models.super_admin.fields import CreateField, UpdateField, DeleteField
from app.models.super_admin.forms import AttributeModel
from app.models.super_admin.default_forms import DefaultFormModel
from app.networks.database import db
import traceback
import sys
from bson import ObjectId
from datetime import datetime

from app.helpers.general_helper import convert_to_jsonable, get_error_details

form_builder = APIRouter(tags=["Common - Form Builder"])
fields_collection = db.formbuilder_fields
attributes_collection = db.formbuilder_field_attributes
forms_collection = db.forms




# ==============================================
# CRUD for Fields for Form Builder - starting
# ==============================================
@form_builder.post("/form-builder/fields/save")
async def save_field(request: Request):
    request_form = await request.form()
    
    try:
        field_id = int(request_form.get("id", 0))
        title = request_form.get("title", "").strip()
        normalized_title = " ".join(title.lower().split())

        # Check for duplicate title
        duplicate_check_query = {
            "title": normalized_title
        }
        if field_id != 0:
            duplicate_check_query["id"] = {"$ne": field_id}
        
        if fields_collection.find_one(duplicate_check_query):
            return {"status": status.HTTP_302_FOUND, "message": "Field already exists"}

        # Common field data
        field_data = {
            "id": field_id if field_id != 0 else fields_collection.count_documents({}) + 1,
            "title": title,
            "form_element_type": request_form.get("form_element_type", ""),
            "type": request_form.get("type", ""),
            "icon": request_form.get("icon", ""),
            "active": int(request_form.get("active", 1)),
            "sort_by": int(request_form.get("sort_by", 0))
        }

        if field_id == 0:
            # Create new field
            fields_collection.insert_one(field_data)
            return {
                "status": status.HTTP_200_OK,
                "message": "Field created successfully",
                "data": field_data
            }
        else:
            # Update existing field
            fields_collection.update_one({"id": field_id}, {"$set": field_data})
            return {
                "status": status.HTTP_200_OK,
                "message": "Field updated successfully",
                "data": field_data
            }

    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/fields/get")
async def get_fields():
    try:
        results = list(fields_collection.find({}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Fields retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/fields/get/{id}")
async def get_field_by_id(id: int):
    try:
        result = fields_collection.find_one({"id": id}, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Field retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Field not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@form_builder.get("/form-builder/fields/{id}/deleted/{value}")
async def delete_restore_field(id: int, value: int):
    try:
        fields_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Field deleted successfully" if value else "Field restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==============================================
# CRUD for Fields for Form Builder - ending
# ==============================================





# ========================================================
# CRUD for Field Attributes for Form Builder - starting
# ========================================================
@form_builder.post("/form-builder/field-attributes/save")
async def save_field_attribute(request: Request):
    request_form = await request.form()
    
    try:
        field_id = int(request_form.get("id", 0))
        title = request_form.get("title", "").strip()
        normalized_title = " ".join(title.lower().split())

        common_query = {
            "title": normalized_title,
            "field": request_form.get("field"),
            "attribute": request_form.get("attribute")
        }

        if field_id != 0:
            common_query["id"] = {"$ne": field_id}

        # Check for duplicate
        if attributes_collection.find_one(common_query):
            return {"status": status.HTTP_302_FOUND, "message": "Attribute already exists"}

        # Build attribute data
        attr = dict(request_form)
        attr["id"] = field_id if field_id != 0 else attributes_collection.count_documents({}) + 1
        attr["title"] = normalized_title  # Save normalized title
        attr["active"] = int(request_form.get("active", 1))
        attr["sort_by"] = int(request_form.get("sort_by", 0))
        attr["required"] = int(request_form.get("required", 0))

        if field_id == 0:
            attributes_collection.insert_one(attr)
            message = "Attribute created successfully"
        else:
            attributes_collection.update_one({"id": field_id}, {"$set": attr})
            message = "Attribute updated successfully"

        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(attr)
        }

    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/field-attributes/get")
async def get_field_attributes():
    try:
        results = list(attributes_collection.find({}, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Attributes retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/field-attributes/get/{id}")
async def get_field_attribute_by_id(id: int):
    try:
        result = attributes_collection.find_one({"id": id}, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Attribute retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Attribute not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@form_builder.get("/form-builder/field-attributes/{id}/deleted/{value}")
async def delete_restore_field_attribute(id: int, value: int):
    try:
        attributes_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Attribute deleted successfully" if value else "Attribute restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@form_builder.get("/form-builder/field-attributes/get-by-field/{id}")
async def get_field_attributes_by_field(id: int):
    try:
        # Find attributes where field_id is either 0 (default) or equal to the provided id
        results = list(attributes_collection.find({
            "$or": [
                {"field_id": 0},  # Default attributes
                {"field_id": id}  # Field specific attributes
            ]
        }, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Field attributes retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/fields-with-attributes")
async def get_fields_with_attributes(request: Request):
    request_form = await request.form()
   
    
    try:
        # Build query based on form data
        query = {"active": 1}
        
        # Add optional filters from form data
        if request_form.get("form_element_type"):
            query["form_element_type"] = request_form["form_element_type"]
        if request_form.get("type"):
            query["type"] = request_form["type"]
        if request_form.get("module_id"):
            query["module_id"] = int(request_form["module_id"])
        if request_form.get("app_id"):
            query["app_id"] = int(request_form["app_id"])

        # Get fields based on query
        fields = list(fields_collection.find(query, {"_id": 0}))

        # Convert the entire result to JSON-serializable format
        result = convert_to_jsonable(fields)
        return {
            "status": status.HTTP_200_OK,
            "message": "Fields with attributes retrieved successfully",
            "data": result
        }
    except Exception as e:
        return get_error_details(e)
        # For each field, get its attributes (both default and field-specific)
        for field in fields:
            try:
                field_id = field["id"]
                # Get attributes where field_id is either 0 (default) or equal to the field id
                attributes = list(attributes_collection.find({
                    "$or": [
                        {"field_id": 0},  # Default attributes
                        {"field_id": int(field_id)}  # Field specific attributes
                    ],
                    "active": 1  # Only get active attributes
                }, {"_id": 0}))
                
                field["attributes"] = convert_to_jsonable(attributes)
            except Exception as attr_error:
                print(f"Error processing attributes for field {field_id}: {str(attr_error)}")
                field["attributes"] = []

        # Convert the entire result to JSON-serializable format
        result = convert_to_jsonable(fields)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Fields with attributes retrieved successfully",
            "data": result
        }
    except Exception as e:
        print(f"Error in get_fields_with_attributes: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {traceback.format_exc()}")
        return {
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "Error retrieving fields with attributes",
            "error": str(e)
        }

@form_builder.get("/form-builder/fields-with-attributes/{id}")
async def get_field_with_attributes(id: int):
    try:
        # Get the specific field
        field = fields_collection.find_one({"id": id, "active": 1}, {"_id": 0})
        if not field:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Field not found",
                "data": None
            }

        # Get attributes where field_id is either 0 (default) or equal to the field id
        attributes = list(attributes_collection.find({
            "$or": [
                {"field_id": 0},  # Default attributes
                {"field_id": id}  # Field specific attributes
            ],
            "active": 1  # Only get active attributes
        }, {"_id": 0}))
        
        field["attributes"] = convert_to_jsonable(attributes)

        return {
            "status": status.HTTP_200_OK,
            "message": "Field with attributes retrieved successfully",
            "data": convert_to_jsonable(field)
        }
    except Exception as e:
        return get_error_details(e)
# ========================================================
# CRUD for Field Attributes for Form Builder - ending
# ========================================================    
    



# =====================================
# CRUD for Default Save - starting
# =====================================
@form_builder.post("/form-builder/default-form/save")
async def save_default_form(request: Request):
    request_form = await request.form()
    try:
        form_data = DefaultFormModel()
        form_data.app_id = int(request_form.get("app_id", 0))
        form_data.module_id = int(request_form.get("module_id", 0))
        form_data.layout_id = int(request_form.get("layout_id", 0))
        form_data.form = request_form.get("form", "")
        
        # Check if a default form already exists for this combination
        existing_form = default_forms_collection.find_one({
            "app_id": form_data.app_id,
            "module_id": form_data.module_id,
            "layout_id": form_data.layout_id,
            "deleted": 0
        })
        
        if existing_form:
            # Update existing form
            form_data.id = existing_form["id"]
            form_data.updated_at = datetime.now()
            default_forms_collection.update_one(
                {"id": existing_form["id"]},
                {"$set": form_data.dict()}
            )
            message = "Default form updated successfully"
        else:
            # Create new form
            form_data.id = int(default_forms_collection.count_documents({})) + 1
            form_data.created_at = datetime.now()
            default_forms_collection.insert_one(form_data.dict())
            message = "Default form created successfully"
            
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(form_data.dict())
        }
    except Exception as e:
        return get_error_details(e)

@form_builder.post("/form-builder/default-form/get")
async def get_default_forms(request: Request):
    request_form = await request.form()
    try:
        # Start with base query for non-deleted forms
        query = {"deleted": 0}
        
        # Add optional filters if they exist in the request
        if request_form.get("id"):
            query["id"] = int(request_form["id"])
        if request_form.get("app_id"):
            query["app_id"] = int(request_form["app_id"])
        if request_form.get("module_id"):
            query["module_id"] = int(request_form["module_id"])
        if request_form.get("layout_id"):
            query["layout_id"] = int(request_form["layout_id"])
            
        results = list(default_forms_collection.find(query, {"_id": 0}))
        return {
            "status": status.HTTP_200_OK,
            "message": "Default forms retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)
# =====================================
# CRUD for Default Save - ending
# =====================================
    