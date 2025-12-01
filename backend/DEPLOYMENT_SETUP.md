# CRM Admin API - Automatic Deployment Setup

This guide will help you set up automatic deployment for your CRM Admin API using GitHub Actions, webhooks, and Docker.

## Prerequisites

- Server with Docker and Docker Compose installed
- Nginx configured as reverse proxy
- Portainer (optional, for container management)
- GitHub repository with your code
- SSH access to your server

## 1. Server Setup

### 1.1 Update Configuration Files

Update the following files with your actual paths and settings:

#### `docker-compose.yml`
- Update the `MONGODB_URL` environment variable
- Adjust the port mapping if needed (currently `8006:15400`)
- Update the domain in Traefik labels

#### `scripts/deploy.sh`
- Update `PROJECT_DIR` to your actual project path
- Update `LOG_FILE` and `BACKUP_DIR` paths
- Ensure the script has execute permissions: `chmod +x scripts/deploy.sh`

#### `scripts/webhook_handler.py`
- Update `PROJECT_DIR` environment variable
- Set a secure `GITHUB_WEBHOOK_SECRET`

#### `scripts/crmadmin-webhook.service`
- Update all paths to match your server setup
- Update the `GITHUB_WEBHOOK_SECRET`

#### `scripts/nginx-webhook.conf`
- Update `server_name` with your actual domain
- Adjust proxy paths if needed

### 1.2 Install Dependencies

```bash
# Install Python dependencies for webhook handler
pip3 install requests

# Make scripts executable
chmod +x scripts/deploy.sh
chmod +x scripts/webhook_handler.py

# Create log directories
sudo mkdir -p /var/log
sudo touch /var/log/webhook.log
sudo touch /var/log/crmadmin-deploy.log
sudo chown www-data:www-data /var/log/webhook.log /var/log/crmadmin-deploy.log
```

### 1.3 Setup Systemd Service

```bash
# Copy service file
sudo cp scripts/crmadmin-webhook.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable crmadmin-webhook
sudo systemctl start crmadmin-webhook

# Check status
sudo systemctl status crmadmin-webhook
```

### 1.4 Configure Nginx

```bash
# Copy nginx configuration
sudo cp scripts/nginx-webhook.conf /etc/nginx/sites-available/crmadmin-webhook

# Create symlink
sudo ln -s /etc/nginx/sites-available/crmadmin-webhook /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 2. GitHub Repository Setup

### 2.1 Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

- `SERVER_HOST`: Your server's IP address or hostname
- `SERVER_USERNAME`: SSH username
- `SERVER_SSH_KEY`: Private SSH key for server access
- `SERVER_PORT`: SSH port (usually 22)
- `TELEGRAM_BOT_TOKEN`: (Optional) Telegram bot token for notifications
- `TELEGRAM_CHAT_ID`: (Optional) Telegram chat ID for notifications

### 2.2 Create GitHub Webhook

1. Go to your GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `https://your-domain.com/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Use the same secret as in `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select "Just the push event"
   - **Active**: Checked

## 3. Health Check Endpoint

Add a health check endpoint to your FastAPI application:

```python
# In your main.py or health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "createdon": datetime.utcnow()}
```

## 4. Testing the Setup

### 4.1 Test Webhook Handler

```bash
# Test webhook handler manually
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"ref": "refs/heads/master", "repository": {"name": "test"}, "head_commit": {"id": "test", "author": {"name": "test"}}}'
```

### 4.2 Test Deployment Script

```bash
# Test deployment script
./scripts/deploy.sh --help
./scripts/deploy.sh --verify
```

### 4.3 Test GitHub Actions

1. Make a small change to your code
2. Commit and push to master branch
3. Check GitHub Actions tab for deployment status
4. Monitor server logs: `tail -f /var/log/crmadmin-deploy.log`

## 5. Monitoring and Logs

### 5.1 View Logs

```bash
# Webhook handler logs
sudo journalctl -u crmadmin-webhook -f

# Deployment logs
tail -f /var/log/crmadmin-deploy.log

# Docker container logs
docker-compose logs -f core_api
```

### 5.2 Health Monitoring

```bash
# Check container health
docker-compose ps

# Check API health
curl http://localhost:8006/health

# Check webhook endpoint
curl http://your-domain.com/health
```

## 6. Troubleshooting

### 6.1 Common Issues

1. **Webhook not receiving events**
   - Check nginx configuration
   - Verify webhook URL is accessible
   - Check webhook handler logs

2. **Deployment fails**
   - Check deployment logs
   - Verify Docker and Docker Compose are installed
   - Check disk space and permissions

3. **Container not starting**
   - Check Docker logs: `docker-compose logs core_api`
   - Verify environment variables
   - Check port conflicts

### 6.2 Security Considerations

1. **Webhook Secret**: Use a strong, unique secret
2. **SSH Keys**: Use key-based authentication only
3. **Firewall**: Only expose necessary ports
4. **Updates**: Keep system and dependencies updated

## 7. Advanced Configuration

### 7.1 Multiple Environments

Create separate docker-compose files for different environments:

- `docker-compose.dev.yml`
- `docker-compose.staging.yml`
- `docker-compose.prod.yml`

### 7.2 Load Balancing

For high availability, consider:
- Multiple application instances
- Load balancer (HAProxy, Traefik)
- Database clustering

### 7.3 Backup Strategy

- Regular database backups
- Application code backups
- Configuration backups

## 8. Maintenance

### 8.1 Regular Tasks

- Monitor disk space
- Clean up old Docker images
- Review and rotate logs
- Update dependencies

### 8.2 Updates

- Keep Docker images updated
- Update system packages
- Review security patches

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check GitHub Actions status
4. Verify server connectivity

## Files Overview

- `Dockerfile`: Container configuration
- `docker-compose.yml`: Multi-container setup
- `.github/workflows/deploy.yml`: GitHub Actions workflow
- `scripts/webhook_handler.py`: Webhook receiver
- `scripts/deploy.sh`: Deployment script
- `scripts/crmadmin-webhook.service`: Systemd service
- `scripts/nginx-webhook.conf`: Nginx configuration 