#!/bin/bash

# Company Portal - Database Restore Script
# Run this script to restore a database backup

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f "/var/www/company-portal/backend/.env" ]; then
    source /var/www/company-portal/backend/.env
fi

# Default values
DB_NAME=${DB_NAME:-company_portal}
DB_USER=${DB_USER:-portal_user}
BACKUP_DIR="/var/backups/company-portal"

# List available backups
echo "Available backups:"
echo "=================="
ls -lht $BACKUP_DIR/*.sql.gz 2>/dev/null | head -10

if [ $? -ne 0 ]; then
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

echo ""

# Ask for backup file
read -p "Enter backup filename (e.g., company_portal_20230615_120000.sql.gz): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}Backup file not found: $BACKUP_DIR/$BACKUP_FILE${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
read -p "Are you sure you want to restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Get password
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter database password: " DB_PASSWORD
    echo ""
fi

# Stop application
echo "Stopping application..."
pm2 stop company-portal-api 2>/dev/null || true

# Decompress backup
echo "Decompressing backup..."
gunzip -k "$BACKUP_DIR/$BACKUP_FILE"
SQL_FILE="${BACKUP_DIR}/${BACKUP_FILE%.gz}"

# Restore database
echo "Restoring database..."
mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    
    # Clean up decompressed file
    rm -f "$SQL_FILE"
    
    # Restart application
    echo "Restarting application..."
    pm2 start company-portal-api
    
    echo -e "${GREEN}✓ Restore complete${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    rm -f "$SQL_FILE"
    exit 1
fi
