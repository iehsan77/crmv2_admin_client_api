FROM python:3.9

ENV MONGODB_URL="mongodb+srv://seo-dev:fxo2R9A531Wz80U6@tech-team-dev-mongodb-server-3b7cdaa2.mongo.ondigitalocean.com/seo-dev?tls=true&authSource=admin&replicaSet=tech-team-dev-mongodb-server"

# Install system dependencies (curl for health check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir --upgrade pip
# Install importlib-metadata for Python 3.9 compatibility (provides packages_distributions)
RUN pip3 install --no-cache-dir "importlib-metadata>=6.0.0"
RUN pip3 install --no-cache-dir -r requirements.txt

# Install additional dependencies
RUN pip3 install --no-cache-dir \
    fastapi[all] \
    uvicorn \
    gunicorn \
    passlib \
    python-jose \
    pillow \
    pymongo[srv] \
    google-cloud-storage \
    python-multipart \
    pandas \
    python-slugify \
    boto3 \
    orjson \
    python-dotenv \
    sendgrid \
    h3 \
    geopy \
    pydantic==1.10.0 \
    beautifulsoup4 \
    zenrows \
    lxml \
    bcrypt \
    user-agents \
    dnspython

# Copy application code
COPY ./app /app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8006/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8006"]

