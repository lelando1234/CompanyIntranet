#!/bin/bash

# Troubleshooting Script for Company Portal
# Usage: sudo bash troubleshoot.sh

echo "=================================="
echo "Backend Troubleshooting Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Auto-detect variables
DETECTED_INSTALL_DIR=""
BACKEND_PID=""
BACKEND_ENV=""
NGINX_SITE=""
DOMAIN=""

# --- Step 1: Find backend process ---
echo "1. Checking if backend process is running..."
echo "   Searching for Node.js processes on port 3001..."
BACKEND_PID=$(lsof -ti:3001 2>/dev/null || fuser 3001/tcp 2>/dev/null | awk '{print $1}')
if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ Backend process found (PID: $BACKEND_PID)${NC}"
    ps aux | grep "$BACKEND_PID" | grep -v grep
    echo ""
    echo "   Process details:"
    PROC_CWD=$(readlink /proc/$BACKEND_PID/cwd 2>/dev/null)
    echo "   Working directory: $PROC_CWD"
    cat /proc/$BACKEND_PID/cmdline 2>/dev/null | tr '\0' ' ' | sed 's/^/   Command: /'
    echo ""

    # Check if working directory is valid
    if [ "$PROC_CWD" = "(deleted)" ] || [ ! -d "$PROC_CWD" ]; then
        echo -e "${YELLOW}⚠ Working directory is '(deleted)' or doesn't exist!${NC}"
        echo "   The backend process is running from a directory that was moved or deleted."
        echo "   The process still works but should be restarted from the correct location."
    fi
else
    echo -e "${RED}✗ Backend process is NOT running${NC}"
    echo "   No process found on port 3001"
fi
echo ""

# --- Step 2: Check port ---
echo "2. Checking if backend port 3001 is listening..."
if ss -tuln 2>/dev/null | grep ":3001" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 3001 is listening${NC}"
    ss -tuln | grep ":3001"
else
    echo -e "${RED}✗ Port 3001 is NOT listening${NC}"
fi
echo ""

# --- Step 3: Test health endpoint ---
echo "3. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint responding: $HEALTH_RESPONSE${NC}"
    curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/api/health
else
    echo -e "${RED}✗ Health endpoint NOT responding: $HEALTH_RESPONSE${NC}"
fi
echo ""

# --- Step 4: Check database ---
echo "4. Checking MariaDB/MySQL service..."
if systemctl is-active --quiet mariadb || systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✓ Database service is running${NC}"
else
    echo -e "${RED}✗ Database service is NOT running${NC}"
    echo "   Start it with: sudo systemctl start mariadb"
fi
echo ""

# --- Step 5: Find and check backend .env ---
echo "5. Checking backend .env configuration..."
echo "   Searching for backend installation..."

SEARCH_PATHS=(
    "/var/www/company-portal"
    "/var/www/test.zoqila.com"
    "/opt/company-portal"
    "$(pwd)"
)

# Also search /var/www/*/backend/.env dynamically
for dir in /var/www/*/backend/.env 2>/dev/null; do
    if [ -f "$dir" ]; then
        PARENT=$(dirname "$(dirname "$dir")")
        SEARCH_PATHS+=("$PARENT")
    fi
done

for path in "${SEARCH_PATHS[@]}"; do
    if [ -f "$path/backend/.env" ]; then
        DETECTED_INSTALL_DIR="$path"
        BACKEND_ENV="$path/backend/.env"
        break
    fi
done

if [ -n "$BACKEND_ENV" ]; then
    echo -e "${GREEN}✓ Backend .env found at: $BACKEND_ENV${NC}"
    echo -e "${GREEN}✓ Installation directory: $DETECTED_INSTALL_DIR${NC}"
    echo ""
    echo "   DB Configuration:"
    grep -E "^DB_" "$BACKEND_ENV" | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***/' || echo "   No DB config found"
    echo ""
    echo "   Server Configuration:"
    grep -E "^PORT=|^NODE_ENV=|^FRONTEND_URL=" "$BACKEND_ENV" || echo "   No server config found"
    echo ""
    echo "   Security Configuration:"
    grep -E "^JWT_SECRET=" "$BACKEND_ENV" | sed 's/JWT_SECRET=.*/JWT_SECRET=***/' || echo "   No JWT config found"
else
    echo -e "${RED}✗ Backend .env file NOT found in any common location${NC}"
    echo "   Searched: ${SEARCH_PATHS[*]}"
fi
echo ""

# --- Step 6: Check Nginx ---
echo "6. Checking Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    nginx -t 2>&1
fi
echo ""

# --- Step 7: Find Nginx site config dynamically ---
echo "7. Checking Nginx proxy configuration for /api..."
for f in /etc/nginx/sites-enabled/*; do
    if [ -f "$f" ] && grep -q "proxy_pass.*3001\|location /api" "$f" 2>/dev/null; then
        NGINX_SITE="$f"
        break
    fi
done

if [ -n "$NGINX_SITE" ]; then
    echo -e "${GREEN}✓ Nginx site config found: $NGINX_SITE${NC}"
    echo "   Server name:"
    grep "server_name" "$NGINX_SITE" | head -1 | sed 's/^[[:space:]]*/   /'
    echo "   Proxy settings:"
    grep -A 5 "location /api" "$NGINX_SITE" | head -8 | sed 's/^/   /'
    echo "   Document root:"
    grep "root " "$NGINX_SITE" | head -1 | sed 's/^[[:space:]]*/   /'
else
    echo -e "${YELLOW}⚠ No Nginx site config found with API proxy${NC}"
    echo "   Available configs in sites-enabled:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "   Directory not found"
fi
echo ""

# --- Step 8: Backend logs ---
echo "8. Recent backend logs (last 20 lines)..."
if command -v pm2 &> /dev/null; then
    PM2_PROCESSES=$(pm2 jlist 2>/dev/null)
    if echo "$PM2_PROCESSES" | grep -q "company-portal"; then
        echo "   From PM2 (company-portal):"
        pm2 logs company-portal --lines 20 --nostream 2>/dev/null || echo "   PM2 logs not available"
    elif echo "$PM2_PROCESSES" | grep -q "company-portal-api"; then
        echo "   From PM2 (company-portal-api):"
        pm2 logs company-portal-api --lines 20 --nostream 2>/dev/null || echo "   PM2 logs not available"
    else
        echo "   PM2 is installed but no matching process found."
        echo "   Available PM2 processes:"
        pm2 list 2>/dev/null
    fi
elif systemctl is-active --quiet company-portal 2>/dev/null; then
    echo "   From systemd:"
    journalctl -u company-portal -n 20 --no-pager 2>/dev/null || echo "   No systemd logs found"
else
    echo -e "${YELLOW}⚠ No process manager detected (PM2 or systemd)${NC}"
    echo "   Checking Nginx error log instead:"
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "   No Nginx error log found"
fi
echo ""

# --- Step 9: Test database connection ---
echo "9. Testing database connection..."
if [ -n "$BACKEND_ENV" ]; then
    DB_HOST=$(grep "^DB_HOST=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)
    DB_USER=$(grep "^DB_USER=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)
    DB_NAME=$(grep "^DB_NAME=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)
    DB_PASS=$(grep "^DB_PASSWORD=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2)

    if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
        echo "   Testing connection to: $DB_NAME @ $DB_HOST as $DB_USER"
        TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SHOW TABLES;" 2>&1)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
            TABLE_COUNT=$(echo "$TABLES" | grep -c "^" || echo "0")
            echo "   Tables found: $((TABLE_COUNT - 1))"
            echo "$TABLES" | head -20 | sed 's/^/   /'
        else
            echo -e "${RED}✗ Database connection failed${NC}"
            echo "   Error: $TABLES"
        fi
    else
        echo -e "${YELLOW}⚠ Could not read database credentials from .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No .env file found - skipping database test${NC}"
fi
echo ""

# --- Step 10: Detect domain and test external API ---
echo "10. Testing API endpoint from external..."
if [ -n "$BACKEND_ENV" ]; then
    DOMAIN=$(grep "^FRONTEND_URL=" "$BACKEND_ENV" 2>/dev/null | cut -d'=' -f2 | sed 's|https://||;s|http://||;s|/.*||')
fi
if [ -z "$DOMAIN" ] && [ -n "$NGINX_SITE" ]; then
    DOMAIN=$(grep "server_name" "$NGINX_SITE" 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';')
fi

if [ -n "$DOMAIN" ]; then
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" 2>/dev/null)
    if [ "$API_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ External API endpoint responding: $API_RESPONSE (https://$DOMAIN/api/health)${NC}"
    else
        echo -e "${RED}✗ External API endpoint NOT responding: $API_RESPONSE (https://$DOMAIN/api/health)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Could not detect domain name${NC}"
fi
echo ""

# --- Step 11: Check SSL ---
echo "11. Checking SSL certificate..."
if [ -n "$DOMAIN" ]; then
    SSL_RESULT=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null)
    if echo "$SSL_RESULT" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓ SSL certificate is valid${NC}"
        EXPIRY=$(echo "$SSL_RESULT" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        [ -n "$EXPIRY" ] && echo "   Expires: $EXPIRY"
    else
        echo -e "${YELLOW}⚠ SSL certificate may have issues${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Could not check SSL - domain not detected${NC}"
fi
echo ""

# --- Step 12: Quick API endpoint tests ---
echo "12. Testing key API endpoints..."
if [ -n "$DOMAIN" ]; then
    for endpoint in "/api/health" "/api/categories" "/api/settings"; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN$endpoint" 2>/dev/null)
        if [ "$CODE" = "200" ]; then
            echo -e "   ${GREEN}✓ GET $endpoint → $CODE${NC}"
        else
            echo -e "   ${RED}✗ GET $endpoint → $CODE${NC}"
        fi
    done
    # Test auth endpoint
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://$DOMAIN/api/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    if [ "$CODE" = "400" ] || [ "$CODE" = "401" ] || [ "$CODE" = "422" ]; then
        echo -e "   ${GREEN}✓ POST /api/auth/login → $CODE (expected - validation working)${NC}"
    elif [ "$CODE" = "502" ] || [ "$CODE" = "504" ] || [ "$CODE" = "000" ]; then
        echo -e "   ${RED}✗ POST /api/auth/login → $CODE (backend unreachable!)${NC}"
    else
        echo -e "   ${YELLOW}⚠ POST /api/auth/login → $CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping - domain not detected${NC}"
fi
echo ""

# --- Summary ---
echo "=================================="
echo "Troubleshooting Complete"
echo "=================================="
echo ""
echo "Summary:"
[ -n "$BACKEND_PID" ] && echo -e "  Backend PID:      ${GREEN}$BACKEND_PID${NC}" || echo -e "  Backend PID:      ${RED}Not running${NC}"
[ -n "$DETECTED_INSTALL_DIR" ] && echo "  Install Dir:      $DETECTED_INSTALL_DIR" || echo -e "  Install Dir:      ${YELLOW}Not detected${NC}"
[ -n "$NGINX_SITE" ] && echo "  Nginx Config:     $NGINX_SITE" || echo -e "  Nginx Config:     ${YELLOW}Not found${NC}"
[ -n "$DOMAIN" ] && echo "  Domain:           $DOMAIN" || echo -e "  Domain:           ${YELLOW}Not detected${NC}"
echo ""
echo "Common fixes:"
if [ -n "$DETECTED_INSTALL_DIR" ]; then
    echo "1. Restart backend: cd $DETECTED_INSTALL_DIR/backend && pm2 restart company-portal"
    echo "2. Check logs: pm2 logs company-portal"
else
    echo "1. Find and restart backend: pm2 list && pm2 restart all"
    echo "2. Check logs: pm2 logs"
fi
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Check database: sudo systemctl status mariadb"
echo "5. Verify .env files match your configuration"
echo ""

# Alert about (deleted) working directory
if [ -n "$BACKEND_PID" ]; then
    PROC_CWD=$(readlink /proc/$BACKEND_PID/cwd 2>/dev/null)
    if [ "$PROC_CWD" = "(deleted)" ] || [ ! -d "$PROC_CWD" ]; then
        echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
        echo -e "${YELLOW}⚠ IMPORTANT: Working directory is '(deleted)'${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
        echo ""
        echo "The backend is running from a directory that was moved/deleted."
        echo "While it still works, you should restart from the correct location:"
        echo ""
        if [ -n "$DETECTED_INSTALL_DIR" ]; then
            echo "  cd $DETECTED_INSTALL_DIR/backend"
            echo "  pm2 delete all"
            echo "  pm2 start src/index.js --name company-portal"
            echo "  pm2 save"
        else
            echo "  1. Find your installation directory"
            echo "  2. cd <install-dir>/backend && pm2 delete all"
            echo "  3. pm2 start src/index.js --name company-portal && pm2 save"
        fi
        echo ""
    fi
fi
