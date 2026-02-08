#!/bin/bash
# Quick fix for EADDRINUSE / backend restart issues
# Run: sudo bash scripts/fix-backend.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)/backend"
PORT=3001

echo -e "${YELLOW}🔧 Fixing backend EADDRINUSE issue...${NC}"

# Step 1: Stop PM2
echo -e "${YELLOW}  Stopping PM2 processes...${NC}"
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
sleep 1

# Step 2: Kill any process on port
echo -e "${YELLOW}  Killing processes on port ${PORT}...${NC}"
fuser -k ${PORT}/tcp 2>/dev/null || true
sleep 3

# Step 3: Verify port is free
if fuser ${PORT}/tcp 2>/dev/null; then
    echo -e "${RED}  ⚠️ Port ${PORT} still in use. Force killing...${NC}"
    fuser -k -9 ${PORT}/tcp 2>/dev/null || true
    sleep 2
fi

# Step 4: Start backend
echo -e "${YELLOW}  Starting backend...${NC}"
cd "${BACKEND_DIR}"

if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start src/index.js --name company-portal-api
fi
pm2 save 2>/dev/null

# Step 5: Wait and verify
echo -e "${YELLOW}  Waiting for backend to start...${NC}"
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/api/health 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}  ✅ Backend is running and healthy!${NC}"
    echo -e "${GREEN}  API: http://localhost:${PORT}/api/health${NC}"
    pm2 list
else
    echo -e "${RED}  ❌ Backend health check failed (HTTP ${HEALTH})${NC}"
    echo -e "${YELLOW}  Checking logs...${NC}"
    pm2 logs company-portal-api --lines 20 --nostream 2>/dev/null || pm2 logs --lines 20 --nostream 2>/dev/null
fi
