#!/usr/bin/env python3

import os
import sys
from slugify import slugify

import os
from pymongo import MongoClient
from bson import json_util, ObjectId
import json
# development

mongofbURL = 'mongodb+srv://jo-dev:Ro0aL98k3v2X176Y@jo-mongodb-dev-server-01-18641040.mongo.ondigitalocean.com/jo-dev?tls=true&authSource=admin&replicaSet=jo-mongodb-dev-server-01&tlsCAFile=./../networks/ca-certificate.crt'

# Production 

#mongofbURL = 'mongodb+srv://jo-dev:Ro0aL98k3v2X176Y@db-mongodb-production-22fd5370.mongo.ondigitalocean.com/jo-dev?tls=true&authSource=admin&replicaSet=db-mongodb-production'



port = 8000
dbClient = MongoClient(mongofbURL, port)

db = dbClient['jo-dev']

def get_db():
    db.connect
    try:
        yield db
    finally:
        db.close()