#!/bin/bash

# CRM Admin API Setup Script
# This script helps with initial setup and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CRM Admin API Setup Script${NC}"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p backups
mkdir -p scripts

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/deploy.sh
chmod +x scripts/webhook_handler.py

# Generate webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}Generated webhook secret: ${WEBHOOK_SECRET}${NC}"

# Create .env file from template
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp config.template .env
    echo -e "${GREEN}✅ .env file created. Please update it with your actual values.${NC}"
else
    echo -e "${YELLOW}.env file already exists.${NC}"
fi

# Update webhook secret in .env
if [ -f .env ]; then
    sed -i.bak "s/your-webhook-secret-here/$WEBHOOK_SECRET/" .env
    echo -e "${GREEN}✅ Webhook secret updated in .env file${NC}"
fi

# Test Docker build
echo -e "${YELLOW}Testing Docker build...${NC}"
if docker build -t crmadmin-core-api:test .; then
    echo -e "${GREEN}✅ Docker build successful${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Clean up test image
docker rmi crmadmin-core-api:test >/dev/null 2>&1 || true

# Display next steps
echo -e "${BLUE}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update the .env file with your actual configuration values"
echo "2. Update paths in scripts/deploy.sh and scripts/webhook_handler.py"
echo "3. Configure GitHub repository secrets (see DEPLOYMENT_SETUP.md)"
echo "4. Set up GitHub webhook (see DEPLOYMENT_SETUP.md)"
echo "5. Configure nginx (see scripts/nginx-webhook.conf)"
echo "6. Set up systemd service (see scripts/crmadmin-webhook.service)"
echo ""
echo -e "${GREEN}📖 For detailed instructions, see DEPLOYMENT_SETUP.md${NC}"
echo ""
echo -e "${BLUE}🔧 To test the deployment:${NC}"
echo "   ./scripts/deploy.sh --help"
echo "   docker-compose up -d"
echo "   curl http://localhost:8014/health" 