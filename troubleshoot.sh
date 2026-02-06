#!/bin/bash

# Troubleshooting Script for Server Error in Admin Panel
# Usage: sudo bash troubleshoot.sh

echo "=================================="
echo "Backend Troubleshooting Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if backend is running
echo "1. Checking if backend process is running..."
echo "   Searching for Node.js processes on port 3001..."
BACKEND_PID=$(lsof -ti:3001 2>/dev/null || fuser 3001/tcp 2>/dev/null | awk '{print $1}')
if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ Backend process found (PID: $BACKEND_PID)${NC}"
    ps aux | grep "$BACKEND_PID" | grep -v grep
    echo ""
    echo "   Process details:"
    ls -l /proc/$BACKEND_PID/cwd 2>/dev/null | awk '{print "   Working directory: " $NF}'
    cat /proc/$BACKEND_PID/cmdline 2>/dev/null | tr '\0' ' ' | sed 's/^/   Command: /'
    echo ""
else
    echo -e "${RED}✗ Backend process is NOT running${NC}"
    echo "   But port 3001 is listening - checking what's using it..."
    lsof -i:3001 2>/dev/null || ss -tlnp | grep 3001
fi
echo ""

# 2. Check backend port
echo "2. Checking if backend port 3001 is listening..."
if netstat -tuln | grep ":3001" > /dev/null 2>&1 || ss -tuln | grep ":3001" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 3001 is listening${NC}"
    netstat -tuln | grep ":3001" || ss -tuln | grep ":3001"
else
    echo -e "${RED}✗ Port 3001 is NOT listening${NC}"
fi
echo ""

# 3. Test health endpoint
echo "3. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint responding: $HEALTH_RESPONSE${NC}"
    curl -s http://localhost:3001/api/health | python3 -m json.tool || echo ""
else
    echo -e "${RED}✗ Health endpoint NOT responding: $HEALTH_RESPONSE${NC}"
fi
echo ""

# 4. Check database connection
echo "4. Checking MariaDB/MySQL service..."
if systemctl is-active --quiet mariadb || systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✓ Database service is running${NC}"
else
    echo -e "${RED}✗ Database service is NOT running${NC}"
    echo "   Start it with: sudo systemctl start mariadb"
fi
echo ""

# 5. Check backend .env file
echo "5. Checking backend .env configuration..."
echo "   Searching for backend .env files..."
POSSIBLE_PATHS=(
    "/var/www/test.zoqila.com/backend/.env"
    "/root/test.zoqila.com/backend/.env"
    "/home/*/test.zoqila.com/backend/.env"
    "$(pwd)/backend/.env"
)

BACKEND_ENV=""
for path in "${POSSIBLE_PATHS[@]}"; do
    EXPANDED=$(eval echo "$path")
    if [ -f "$EXPANDED" ]; then
        BACKEND_ENV="$EXPANDED"
        echo -e "${GREEN}✓ Backend .env file found at: $BACKEND_ENV${NC}"
        break
    fi
done

if [ -n "$BACKEND_ENV" ]; then
    echo "   DB Configuration:"
    grep -E "^DB_" "$BACKEND_ENV" | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***/' || echo "   No DB config found"
    echo ""
    echo "   Server Configuration:"
    grep -E "^PORT=|^NODE_ENV=|^FRONTEND_URL=" "$BACKEND_ENV" || echo "   No server config found"
else
    echo -e "${RED}✗ Backend .env file NOT found in any common location${NC}"
    echo "   Checking if backend process has working directory..."
    if [ -n "$BACKEND_PID" ]; then
        BACKEND_DIR=$(ls -l /proc/$BACKEND_PID/cwd 2>/dev/null | awk '{print $NF}')
        echo "   Backend running from: $BACKEND_DIR"
        if [ -f "$BACKEND_DIR/.env" ]; then
            echo -e "${GREEN}✓ Found .env at: $BACKEND_DIR/.env${NC}"
            BACKEND_ENV="$BACKEND_DIR/.env"
            grep -E "^DB_|^PORT=|^NODE_ENV=|^FRONTEND_URL=" "$BACKEND_ENV" | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***/'
        fi
    fi
fi
echo ""

# 6. Check Nginx configuration
echo "6. Checking Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    nginx -t
fi
echo ""

# 7. Check Nginx proxy to backend
echo "7. Checking Nginx proxy configuration for /api..."
NGINX_SITE="/etc/nginx/sites-enabled/test.zoqila.com"
if [ -f "$NGINX_SITE" ]; then
    echo -e "${GREEN}✓ Nginx site config exists${NC}"
    echo "   Checking proxy settings:"
    grep -A 3 "location /api" "$NGINX_SITE" | head -5 || echo "   No /api location block found"
else
    echo -e "${YELLOW}⚠ Could not find Nginx config at $NGINX_SITE${NC}"
fi
echo ""

# 8. Check backend logs
echo "8. Recent backend logs (last 20 lines)..."
if [ -d "/var/www/test.zoqila.com/backend" ]; then
    if command -v pm2 &> /dev/null; then
        echo "   From PM2:"
        pm2 logs company-portal --lines 20 --nostream 2>/dev/null || echo "   PM2 logs not available"
    else
        echo "   Checking systemd logs:"
        journalctl -u company-portal -n 20 --no-pager || echo "   No systemd logs found"
    fi
else
    echo -e "${YELLOW}⚠ Backend directory not found${NC}"
fi
echo ""

# 9. Test database connection
echo "9. Testing database connection..."
DB_HOST=$(grep "^DB_HOST=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)
DB_USER=$(grep "^DB_USER=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)
DB_NAME=$(grep "^DB_NAME=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)

if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
    echo "   Testing connection to: $DB_NAME @ $DB_HOST as $DB_USER"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$(grep "^DB_PASSWORD=" "$BACKEND_ENV" | cut -d'=' -f2)" -e "SELECT 1;" 2>&1 | head -3
else
    echo -e "${YELLOW}⚠ Could not read database credentials from .env${NC}"
fi
echo ""

# 10. Check CORS and API endpoint
echo "10. Testing API endpoint from external..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://test.zoqila.com/api/health 2>/dev/null)
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ External API endpoint responding: $API_RESPONSE${NC}"
else
    echo -e "${RED}✗ External API endpoint NOT responding: $API_RESPONSE${NC}"
    echo "   This could be a Nginx proxy issue"
fi
echo ""

# 11. Check SSL certificate
echo "11. Checking SSL certificate..."
if openssl s_client -connect test.zoqila.com:443 -servername test.zoqila.com < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✓ SSL certificate is valid${NC}"
else
    echo -e "${YELLOW}⚠ SSL certificate may have issues${NC}"
fi
echo ""

echo "=================================="
echo "Troubleshooting Complete"
echo "=================================="
echo ""
echo "Common fixes:"
echo "1. Restart backend: cd /var/www/test.zoqila.com/backend && pm2 restart company-portal"
echo "2. Check backend logs: pm2 logs company-portal"
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Check database: sudo systemctl status mariadb"
echo "5. Verify .env files match your configuration"
echo ""
