from fastapi import Request, APIRouter, status, Depends
from app.helpers.globalfunctions import getLastUserId, getCountforApps
from app.models.super_admin.customers import CreateCustomer, UpdateCustomer
from app.networks.database import db

customers = APIRouter(tags=["Super Admin - Customers"])
collection = db.customers



# =================================
# CRUD for Customers - starting
# =================================
@customers.post("/customers/save")
async def save_customers(request: Request):
    request_form = await request.form()
    try:
        raw_email = request_form["email"]
        request_form_email = raw_email.strip()    # Removes spaces from start and end only
        lower_email = request_form_email.lower()  # Trim and convert to lowercase
        if not lower_email:
            return {
                "status": status.HTTP_302_FOUND,
                "message": "Customer email is required",
            }
        
        # Create Customers
        if int(request_form["id"]) == 0:
            validation = collection.find_one(
                {
                    "email": lower_email
                }
            )

            if validation:
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Customer already exist",
                }
            
            create_customer = CreateCustomer()
            new_id = int(getLastUserId(collection, "id")) + 1
            create_customer.id = new_id
            create_customer.first_name = request_form["first_name"]
            create_customer.last_name = request_form["last_name"]
            create_customer.email = request_form["email"]
            create_customer.phone = request_form["phone"]

            collection.insert_one(create_customer.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Customer has been created",
                "data": create_customer,
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
                    "email": lower_email,
                    "id": {"$ne": int(request_form["id"])}
                }
            )

            if validation and validation["id"] == int(request_form["id"]):
                return {
                    "status": status.HTTP_302_FOUND,
                    "message": "Customer already exist",
                }
            
            has_record = collection.find_one(
                {
                    "id": int(request_form["id"])
                }
            )

            if has_record:
                update_customer = UpdateCustomer()
                new_id = int(getLastUserId(collection, "id")) + 1
                update_customer.id = new_id
                update_customer.first_name = request_form["first_name"]
                update_customer.last_name = request_form["last_name"]
                update_customer.email = request_form["email"]
                update_customer.phone = request_form["phone"]

                collection.update_one(
                    {"id": int(request_form["id"])}, 
                    {"$set": update_customer.dict()}
                )

                return {
                    "status": status.HTTP_200_OK,
                    "message": "Record Successfully updated",
                    "data": update_customer
                }
                
                
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(e) + ",Something went wrong with the requested data.",
            "data": request_form,
            "line_no": e.__traceback__.tb_lineno,
        }

@customers.post("/customers/get")
async def get_customers(request: Request):
    # result_array = []
    search_query = {}
    try:
        # query_params = request.query_params
        # isActive = query_params.get('is_active')
        # isDeleted = query_params.get('is_deleted')

        
        # if isActive:
        #     search_query["active"] = int(isActive)
        
        # search_query["deleted"] = {"$ne": 1}  # Exclude deleted by default
        # if isDeleted:
        #     search_query["deleted"] = int(isDeleted)

        results = collection.find(search_query, {"_id": 0}).sort("sort_by", 1)

        if results:
            data = records_entity(results)

            return {
                "status": status.HTTP_200_OK,
                "data": data,
                "total_records": getCountforApps("settings", search_query),
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

def single_entity(item) -> dict:
    return {
        "id": item["id"],
        "first_name":item["first_name"],
        "last_name":item["last_name"],
        "email":item["email"],
        "phone":item["phone"]
    }

def records_entity(entity) -> list:
    return [single_entity(item) for item in entity]
# =================================
# CRUD for Customers - ending
# =================================