#!/bin/bash

# Company Portal - Update Script
# Run this script to update the application

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/var/www/company-portal"

echo -e "${BLUE}Company Portal Update Script${NC}"
echo "=============================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Check installation directory
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}Installation not found at $INSTALL_DIR${NC}"
    exit 1
fi

cd $INSTALL_DIR

# Backup database before update
echo -e "${YELLOW}Creating database backup...${NC}"
./scripts/backup-db.sh

# Stop application
echo "Stopping application..."
pm2 stop company-portal-api

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "Pulling latest changes..."
    # Ensure remote is set
    if ! git remote | grep -q "origin"; then
        git remote add origin https://github.com/lelando1234/CompanyIntranet.git
    fi
    git pull origin Com-5
fi

# Update frontend dependencies
echo "Updating frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Update backend dependencies
echo "Updating backend dependencies..."
cd backend
npm install

# Run migrations
echo "Running database migrations..."
npm run migrate

# Restart application
echo "Restarting application..."
pm2 restart company-portal-api

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo -e "${GREEN}✓ Update complete!${NC}"
echo ""
echo "Run 'pm2 logs company-portal-api' to check for any errors."
