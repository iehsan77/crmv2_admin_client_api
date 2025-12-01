import multiprocessing
import os
from dotenv import load_dotenv
load_dotenv()

name = "gunicorn config for FastAPI - TutLinks.com"
accesslog = "/home/alpha/ecom-service-api-container1/logs/gunicorn-access.log"
errorlog = "/home/alpha/ecom-service-api-container1/logs/gunicorn-error.log"

bind = "0.0.0.0:8002"

worker_class = "uvicorn.workers.UvicornWorker"
workers = multiprocessing.cpu_count () * 8 + 1
worker_connections = 20024
backlog = 4048
max_requests = 5000
timeout = 120
keepalive = 10

debug = os.environ.get("debug", "false") == "true"
reload = debug
preload_app = False
daemon = False
