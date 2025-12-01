from fastapi import Request, APIRouter, status, Depends
from app.helpers.globalfunctions import getLastUserId, getCountforApps
from app.networks.database import db
from app.utils import config, oauth2

statistics = APIRouter(tags=["Super Admin - Statistics"])
collection = db.settigs
 
# Get statistics
@statistics.get("/statistics")
async def get_statistics():    
    try:
        data = {}
        
        counters = {
            "apps": 0,
            "modules": 0,
            "customers": 0,
        }
        counters["apps"] = getCountforApps("apps", {})
        counters["modules"] = getCountforApps("modules", {})
        counters["customers"] = getCountforApps("customers", {})
        data["counters"] = counters
        
        return {
            "status": status.HTTP_200_OK,
            "data": data,
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ",Something went wrong with the requested data."
        }

