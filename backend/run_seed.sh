#!/bin/bash

# Quick script to run the CRM seed script in Docker
# Usage: ./run_seed.sh

CONTAINER_NAME="crm-admin-api"

echo "=========================================="
echo "CRM Data Seeding Script Runner"
echo "=========================================="
echo ""

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running"
    echo ""
    echo "Please start the container first:"
    echo "  docker-compose up -d"
    echo "  OR"
    echo "  docker start $CONTAINER_NAME"
    exit 1
fi

echo "✓ Container '$CONTAINER_NAME' is running"
echo ""

# Check if seed script exists
if [ ! -f "seed_crm_data.py" ]; then
    echo "❌ Error: seed_crm_data.py not found in current directory"
    exit 1
fi

echo "✓ Seed script found"
echo ""

# Copy script to container (in case it's not there)
echo "📋 Copying seed script to container..."
docker cp seed_crm_data.py "$CONTAINER_NAME:/app/"

# Run the script
echo "🚀 Running seed script..."
echo ""
docker exec -it "$CONTAINER_NAME" python /app/seed_crm_data.py

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

