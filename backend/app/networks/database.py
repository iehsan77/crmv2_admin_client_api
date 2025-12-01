import os
from pymongo import MongoClient

from app.utils import config

# development

if config.WORKING_ENVIRONMENT == "development":
    mongofbURL = "mongodb+srv://seo-dev:fxo2R9A531Wz80U6@tech-team-dev-mongodb-server-3b7cdaa2.mongo.ondigitalocean.com/seo-dev?tls=true&authSource=admin&replicaSet=tech-team-dev-mongodb-server"
    # mongofbURL = "mongodb+srv://user:GcJkwIUagDFQBJ0b@cluster0.yuufpxx.mongodb.net/"

else:
    # Production

    mongofbURL = 'mongodb+srv://jo-dev:E5rjn2IY948t607U@db-mongodb-production-2024-80aa2234.mongo.ondigitalocean.com/jo-dev?tls=true&authSource=admin&replicaSet=db-mongodb-production-2024'
    # mongofbURL = "mongodb+srv://businessesify-user:96e32mkFs5C0y1Z8@tech-team-dev-mongodb-server-3b7cdaa2.mongo.ondigitalocean.com/businessesify-dev?tls=true&authSource=admin&replicaSet=tech-team-dev-mongodb-server"


port = 8000
dbClient = MongoClient(mongofbURL, port)

db = dbClient["crmadmin_core"]
db_meta = dbClient["businessesify-meta"]
db_blog = dbClient["blogs"]

db_global = dbClient["global"]

db_crm = dbClient["crm"]

db_rentify = dbClient["rentify"]

db_classified = dbClient["classified"]
db_web_editor = dbClient["web-editor"]
db_commerce = dbClient["ecomadmin_momlove"]

def get_db():
    db.connect
    db_blog.connect
    db_crm.connect
    db_classified.connect
    db_web_editor.connect
    try:
        yield db
        yield db_blog
        yield db_crm
        yield db_global
        yield db_classified
        yield db_web_editor
    finally:
        db.close()
        db_blog.close()
        db_crm.close()
        db_global.close()
        db_classified.close()
        db_web_editor.close()
