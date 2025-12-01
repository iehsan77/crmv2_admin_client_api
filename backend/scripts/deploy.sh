#!/bin/bash

# CRM Admin API Auto Deployment Script
# This script handles automatic deployment when triggered by webhook

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/path/to/your/project"
LOG_FILE="/var/log/crmadmin-deploy.log"
BACKUP_DIR="/backups/crmadmin"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Success message
success() {
    log "SUCCESS: $1"
}

# Warning message
warning() {
    log "WARNING: $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root - this is not recommended for security reasons"
    fi
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    if [ -d "$PROJECT_DIR" ]; then
        BACKUP_NAME="crmadmin-backup-$(date +%Y%m%d-%H%M%S)"
        BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
        
        mkdir -p "$BACKUP_DIR"
        cp -r "$PROJECT_DIR" "$BACKUP_PATH"
        success "Backup created at $BACKUP_PATH"
    else
        warning "Project directory not found, skipping backup"
    fi
}

# Pull latest changes
pull_changes() {
    log "Pulling latest changes from git..."
    
    cd "$PROJECT_DIR" || error_exit "Cannot change to project directory"
    
    # Stash any local changes
    git stash -u || warning "No changes to stash"
    
    # Pull latest changes
    git pull origin master || error_exit "Failed to pull latest changes"
    
    success "Latest changes pulled successfully"
}

# Stop existing containers
stop_containers() {
    log "Stopping existing containers..."
    
    cd "$PROJECT_DIR" || error_exit "Cannot change to project directory"
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose down --remove-orphans || warning "Failed to stop some containers"
        success "Containers stopped"
    else
        warning "Docker compose file not found"
    fi
}

# Clean up Docker resources
cleanup_docker() {
    log "Cleaning up Docker resources..."
    
    # Remove unused images
    docker image prune -f || warning "Failed to prune images"
    
    # Remove unused volumes
    docker volume prune -f || warning "Failed to prune volumes"
    
    # Remove unused networks
    docker network prune -f || warning "Failed to prune networks"
    
    success "Docker cleanup completed"
}

# Build and start containers
build_and_start() {
    log "Building and starting containers..."
    
    cd "$PROJECT_DIR" || error_exit "Cannot change to project directory"
    
    # Build and start containers
    docker-compose up -d --build || error_exit "Failed to build and start containers"
    
    success "Containers built and started"
}

# Wait for health check
wait_for_health() {
    log "Waiting for health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts - waiting..."
        sleep 10
        ((attempt++))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        error_exit "Containers are not running"
    fi
    
    # Check if API is responding
    local api_url="http://localhost:8014/health"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$api_url" > /dev/null; then
            success "API is responding"
            return 0
        fi
        
        log "API check attempt $attempt/$max_attempts - waiting..."
        sleep 5
        ((attempt++))
    done
    
    error_exit "API is not responding after $max_attempts attempts"
}

# Main deployment function
main() {
    log "Starting CRM Admin API deployment..."
    
    # Check permissions
    check_permissions
    
    # Create backup
    backup_current
    
    # Pull changes
    pull_changes
    
    # Stop containers
    stop_containers
    
    # Cleanup
    cleanup_docker
    
    # Build and start
    build_and_start
    
    # Wait for health check
    wait_for_health
    
    # Verify deployment
    verify_deployment
    
    success "Deployment completed successfully!"
    
    # Send notification (if configured)
    send_notification "success"
}

# Send notification
send_notification() {
    local status="$1"
    
    # You can add notification logic here (Slack, Telegram, Email, etc.)
    if [ "$status" = "success" ]; then
        log "Deployment successful - notification sent"
    else
        log "Deployment failed - notification sent"
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --backup       Only create backup"
        echo "  --pull         Only pull changes"
        echo "  --build        Only build and start containers"
        echo "  --verify       Only verify deployment"
        ;;
    --backup)
        backup_current
        ;;
    --pull)
        pull_changes
        ;;
    --build)
        build_and_start
        ;;
    --verify)
        verify_deployment
        ;;
    *)
        main
        ;;
esac 