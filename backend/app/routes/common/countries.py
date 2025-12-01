import json

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import List, Optional
from app.networks.database import db_global
from app.utils import oauth2, config
from app.helpers.general_helper import (
    convert_to_jsonable,
    get_error_details,
)
# Router
countries = APIRouter(tags=["Global Data - Countries"])

# MongoDB Collections
countries_collection = db_global.countries

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

# ===============================
# CRUD for MEETINGS - starting
# ===============================

@countries.get("/countries/get")
async def get_countries(user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        #records = list(countries_collection.find({"deleted": {"$ne": 1}},NO_ID_PROJECTION).sort("id", -1))
        records = list(
            countries_collection.aggregate([
                {"$match": {"deleted": {"$ne": 1}}},
                {"$sort": {"id": -1}},
                {"$project": {
                    "_id": 0,
                    "id": 1,
                    "title": "$name.common",
                    "flag": "$flags.svg"
                }}
            ])
        )

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)


