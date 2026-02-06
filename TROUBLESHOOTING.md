# Backend Troubleshooting Guide

## Issue: "Server Error" Message in Admin Panel

When you see "Server error" in the admin panel, it means the frontend cannot connect to the backend API at `https://test.zoqila.com/api`.

---

## Quick Diagnostics

### 1. Run the Automated Troubleshooting Script

```bash
cd /var/www/company-portal
sudo bash troubleshoot.sh
```

This will check:
- Backend process status
- Port 3001 listening
- Health endpoint response
- Database service
- Environment configuration
- Nginx proxy settings
- SSL certificate
- Recent error logs

---

## Manual Troubleshooting Steps

### Step 1: Verify Backend is Running

```bash
# Check if backend process is running
ps aux | grep node | grep backend

# Or if using PM2
pm2 list

# Or if using systemd
sudo systemctl status company-portal
```

**If not running:**
```bash
# Using PM2 (recommended)
cd /var/www/company-portal/backend
pm2 start src/index.js --name company-portal

# Or using systemd
sudo systemctl start company-portal
```

---

### Step 2: Test Backend Locally

```bash
# Test health endpoint locally
curl http://localhost:3001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

**If this fails:**
- Backend is not running or crashed
- Port 3001 is blocked or used by another process
- Database connection failed (check logs)

---

### Step 3: Check Backend Logs

```bash
# If using PM2
pm2 logs company-portal

# If using systemd
sudo journalctl -u company-portal -n 50 -f

# Or check log files directly
tail -f /var/www/company-portal/backend/logs/*.log
```

**Common errors to look for:**
- Database connection errors
- Missing environment variables
- Port already in use
- Module not found errors
- Authentication/JWT errors

---

### Step 4: Verify Database Connection

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Test database connection
mysql -u portal_user -p -e "USE company_portal; SELECT COUNT(*) FROM users;"
```

**If database fails:**
```bash
# Restart MariaDB
sudo systemctl restart mariadb

# Check backend .env has correct credentials
cat /var/www/company-portal/backend/.env | grep DB_
```

---

### Step 5: Test API Through Nginx

```bash
# Test from external URL
curl https://test.zoqila.com/api/health

# Test with verbose output
curl -v https://test.zoqila.com/api/health
```

**If localhost works but external fails:**
- Nginx is not proxying correctly
- Check Nginx configuration below

---

### Step 6: Verify Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check site configuration
cat /etc/nginx/sites-enabled/test.zoqila.com | grep -A 10 "location /api"
```

**Should contain something like:**
```nginx
location /api {
    proxy_pass http://localhost:3001/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**If misconfigured:**
```bash
# Edit the config
sudo nano /etc/nginx/sites-enabled/test.zoqila.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 7: Check CORS Configuration

The backend `.env` should have:
```bash
FRONTEND_URL=https://test.zoqila.com
```

**Not** `http://` and **not** with `/api` at the end.

**To fix:**
```bash
cd /var/www/company-portal/backend
nano .env
# Change FRONTEND_URL to: https://test.zoqila.com

# Restart backend
pm2 restart company-portal
```

---

### Step 8: Check Frontend Environment

From browser console (F12 → Console):
```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show: https://test.zoqila.com/api
```

Or check the file:
```bash
cat /var/www/company-portal/.env
# Should have: VITE_API_URL=https://test.zoqila.com/api
```

**If wrong, update and rebuild:**
```bash
cd /var/www/company-portal
nano .env
# Set: VITE_API_URL=https://test.zoqila.com/api

# Rebuild frontend
npm run build
```

---

## Common Issues & Solutions

### Issue 1: "Network Error" in Browser Console

**Cause:** Backend not reachable from frontend  
**Check:**
```bash
curl https://test.zoqila.com/api/health
```

**Fix:** Restart backend and Nginx
```bash
pm2 restart company-portal
sudo systemctl restart nginx
```

---

### Issue 2: CORS Error in Browser Console

**Error:** `Access to fetch at 'https://test.zoqila.com/api/...' from origin 'https://test.zoqila.com' has been blocked by CORS policy`

**Fix:** Update backend `.env`:
```bash
# In /var/www/company-portal/backend/.env
FRONTEND_URL=https://test.zoqila.com

# Then restart
pm2 restart company-portal
```

---

### Issue 3: 502 Bad Gateway

**Cause:** Nginx can't connect to backend  
**Check:**
```bash
# Is backend running?
pm2 list

# Is port 3001 open?
netstat -tuln | grep 3001
```

**Fix:**
```bash
cd /var/www/company-portal/backend
pm2 restart company-portal
# Wait 5 seconds
curl http://localhost:3001/api/health
```

---

### Issue 4: Database Connection Error

**Backend logs show:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Fix:**
```bash
# Check database is running
sudo systemctl start mariadb

# Verify credentials in backend/.env
cd /var/www/company-portal/backend
cat .env | grep DB_

# Test connection manually
mysql -h localhost -u portal_user -p company_portal
```

---

### Issue 5: 404 on API Routes

**Symptoms:** `/api/health` works but `/api/articles` returns 404

**Cause:** Routes not loaded or backend crashed during initialization

**Fix:**
```bash
# Check backend logs for startup errors
pm2 logs company-portal --lines 100

# Look for errors like:
# - Cannot find module
# - Database connection failed
# - Port already in use

# Restart with verbose logs
pm2 delete company-portal
cd /var/www/company-portal/backend
NODE_ENV=development pm2 start src/index.js --name company-portal
pm2 logs company-portal
```

---

## Testing Checklist

Run these commands in order to verify everything works:

```bash
# 1. Backend health (local)
curl http://localhost:3001/api/health
# ✓ Should return: {"status":"ok","timestamp":"..."}

# 2. Backend health (external)
curl https://test.zoqila.com/api/health
# ✓ Should return: {"status":"ok","timestamp":"..."}

# 3. Articles endpoint (requires auth, should fail gracefully)
curl https://test.zoqila.com/api/articles
# ✓ Should return: {"success":false,...} (not 502 or connection error)

# 4. Categories endpoint
curl https://test.zoqila.com/api/categories
# ✓ Should return: {"success":false,...} or data if no auth required

# 5. Check frontend can load
curl -I https://test.zoqila.com
# ✓ Should return: HTTP/2 200
```

---

## Advanced Debugging

### Enable Backend Debug Mode

```bash
cd /var/www/company-portal/backend
nano .env
# Set: NODE_ENV=development

pm2 restart company-portal --update-env
pm2 logs company-portal
```

This will show:
- Full error stack traces
- SQL queries being executed
- Request/response details

---

### Monitor Backend in Real-Time

```bash
# Terminal 1: Watch logs
pm2 logs company-portal --lines 0

# Terminal 2: Test requests
curl -v https://test.zoqila.com/api/articles

# Terminal 3: Monitor processes
watch -n 1 'pm2 list'
```

---

### Check Backend Package Dependencies

```bash
cd /var/www/company-portal/backend

# Verify all dependencies are installed
npm list --depth=0

# Reinstall if needed
rm -rf node_modules package-lock.json
npm install
pm2 restart company-portal
```

---

## Get More Help

If the issue persists, collect this information:

```bash
# Save diagnostics to file
bash troubleshoot.sh > troubleshoot-output.txt 2>&1

# Include recent logs
pm2 logs company-portal --lines 100 >> troubleshoot-output.txt

# Include Nginx error logs
sudo tail -100 /var/log/nginx/error.log >> troubleshoot-output.txt

# Include database status
sudo systemctl status mariadb >> troubleshoot-output.txt
```

Then share `troubleshoot-output.txt` for further assistance.

---

## Quick Reference: File Locations

```
/var/www/company-portal/           # Default installation directory
├── .env                           # Frontend environment
├── backend/
│   ├── .env                       # Backend environment (CRITICAL)
│   ├── src/index.js              # Backend entry point
│   └── src/routes/               # API routes
├── dist/                          # Built frontend files
├── /etc/nginx/sites-enabled/
│   └── company-portal            # Nginx config (may vary by domain)
└── troubleshoot.sh                # This diagnostic script

NOTE: Your actual paths may differ based on installation.
Run: sudo bash troubleshoot.sh to auto-detect all paths.
```

---

## Environment Variable Reference

### Frontend `.env`
```bash
VITE_API_URL=https://test.zoqila.com/api
VITE_SITE_NAME=intranet
```

### Backend `.env`
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=portal_user
DB_PASSWORD=your_password
DB_NAME=company_portal

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://test.zoqila.com

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```
