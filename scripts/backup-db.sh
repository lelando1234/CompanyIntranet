#!/bin/bash

# Company Portal - Database Backup Script
# Run this script to backup your database

set -e

# Load environment variables
if [ -f "/var/www/company-portal/backend/.env" ]; then
    source /var/www/company-portal/backend/.env
fi

# Default values if not set
DB_NAME=${DB_NAME:-company_portal}
DB_USER=${DB_USER:-portal_user}
BACKUP_DIR="/var/backups/company-portal"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter database password: " DB_PASSWORD
    echo ""
fi

echo "Starting database backup..."

# Create backup
mysqldump -u $DB_USER -p"$DB_PASSWORD" $DB_NAME > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

if [ $? -eq 0 ]; then
    # Compress backup
    gzip "$BACKUP_DIR/${DB_NAME}_${DATE}.sql"
    
    echo -e "${GREEN}✓ Backup created successfully: ${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz${NC}"
    
    # Remove backups older than 30 days
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    echo "Old backups cleaned up (keeping last 30 days)"
    
    # Show backup size
    ls -lh "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi
