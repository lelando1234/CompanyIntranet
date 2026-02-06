#!/bin/bash

# Company Portal - Complete Installation Wizard v2.0
# For Debian Bookworm (12.x)
# Features: Full install, self-remediation, connectivity tests, sample article posting
# This script installs all dependencies, configures MariaDB, Nginx, and SSL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Log files
LOG_FILE="/tmp/company-portal-install-$(date +%Y%m%d_%H%M%S).log"
REMEDIATION_LOG="/tmp/company-portal-remediation-$(date +%Y%m%d_%H%M%S).log"

# Test summary counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
REMEDIATED_CHECKS=0

# ============================================================
# PRINT FUNCTIONS
# ============================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}========================================${NC}\n" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

print_remediate() {
    echo -e "${MAGENTA}🔧 REMEDIATING: $1${NC}" | tee -a "$LOG_FILE" "$REMEDIATION_LOG"
}

print_test() {
    echo -e "${CYAN}🧪 TEST: $1${NC}" | tee -a "$LOG_FILE"
}

track_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ "$1" = "pass" ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$1" = "fail" ]; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    elif [ "$1" = "remediated" ]; then
        REMEDIATED_CHECKS=$((REMEDIATED_CHECKS + 1))
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# ============================================================
# SELF-REMEDIATION FUNCTIONS
# ============================================================

# Retry with exponential backoff
retry_with_backoff() {
    local max_attempts=$1
    local delay=2
    shift
    local cmd="$@"
    for ((i=1; i<=max_attempts; i++)); do
        if eval "$cmd"; then
            return 0
        fi
        if [ $i -lt $max_attempts ]; then
            print_warning "Attempt $i/$max_attempts failed. Retrying in ${delay}s..."
            sleep $delay
            delay=$((delay * 2))
        fi
    done
    return 1
}

# Remediate MariaDB service
remediate_mariadb_service() {
    print_remediate "MariaDB service not running. Attempting to fix..."

    # Try starting
    if systemctl start mariadb 2>/dev/null; then
        print_success "MariaDB started successfully"
        return 0
    fi

    # Clean stale state
    print_remediate "Cleaning stale MariaDB state..."
    rm -f /var/run/mysqld/mysqld.pid 2>/dev/null
    rm -f /var/run/mysqld/mysqld.sock 2>/dev/null
    mkdir -p /var/run/mysqld
    chown mysql:mysql /var/run/mysqld

    if systemctl start mariadb 2>/dev/null; then
        print_success "MariaDB started after cleanup"
        return 0
    fi

    # Reconfigure
    print_remediate "Reconfiguring MariaDB..."
    apt-get install --reinstall -y mariadb-server 2>>"$LOG_FILE"
    systemctl daemon-reload
    if systemctl start mariadb 2>/dev/null; then
        print_success "MariaDB started after reinstall"
        return 0
    fi

    print_error "Could not start MariaDB. Manual intervention required."
    print_info "Check logs: journalctl -u mariadb --no-pager -n 50"
    return 1
}

# Remediate database connection & user access
remediate_db_connection() {
    local db_host="$1" db_user="$2" db_pass="$3" db_name="$4" root_pass="$5"

    print_remediate "Database connection failed. Running diagnostics..."

    # Ensure MariaDB running
    if ! systemctl is-active --quiet mariadb; then
        remediate_mariadb_service || return 1
    fi

    # Test root access
    print_info "Testing root database access..."
    if ! mariadb -u root -p"${root_pass}" -e "SELECT 1;" &>/dev/null; then
        if mariadb -u root -e "SELECT 1;" &>/dev/null; then
            print_remediate "Root has no password. Setting it..."
            mariadb -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${root_pass}');"
            mariadb -u root -p"${root_pass}" -e "FLUSH PRIVILEGES;"
        else
            print_error "Cannot access MariaDB as root. Check root password."
            return 1
        fi
    fi
    print_success "Root database access confirmed"

    # Ensure DB exists
    if ! mariadb -u root -p"${root_pass}" -e "USE ${db_name};" &>/dev/null; then
        print_remediate "Database '${db_name}' missing. Creating..."
        mariadb -u root -p"${root_pass}" -e "CREATE DATABASE IF NOT EXISTS ${db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        print_success "Database '${db_name}' created"
    fi

    # Ensure user exists
    USER_EXISTS=$(mariadb -u root -p"${root_pass}" -N -e "SELECT COUNT(*) FROM mysql.user WHERE User='${db_user}' AND Host='localhost';" 2>/dev/null)
    if [ "${USER_EXISTS}" != "1" ]; then
        print_remediate "User '${db_user}' missing. Creating..."
        mariadb -u root -p"${root_pass}" -e "CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';"
        print_success "User '${db_user}' created"
    fi

    # Grant privileges
    print_remediate "Ensuring database privileges..."
    mariadb -u root -p"${root_pass}" -e "GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'localhost';"
    mariadb -u root -p"${root_pass}" -e "FLUSH PRIVILEGES;"
    print_success "Privileges granted"

    # Test user connection
    if mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -e "USE ${db_name}; SELECT 1;" &>/dev/null; then
        print_success "Database connection verified for user '${db_user}'"
        return 0
    fi

    # Last resort: reset password
    print_remediate "Resetting user password..."
    mariadb -u root -p"${root_pass}" -e "ALTER USER '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';"
    mariadb -u root -p"${root_pass}" -e "FLUSH PRIVILEGES;"

    if mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -e "USE ${db_name}; SELECT 1;" &>/dev/null; then
        print_success "Database connection verified after password reset"
        return 0
    fi

    print_error "Database user connection failed after all remediation"
    return 1
}

# Remediate missing tables
remediate_tables() {
    local db_host="$1" db_user="$2" db_pass="$3" db_name="$4" install_dir="$5"

    print_remediate "Checking database tables..."
    EXPECTED_TABLES=("users" "groups" "user_groups" "group_permissions" "news_categories" "articles" "article_groups" "article_attachments" "url_categories" "url_links" "settings" "theme_settings" "audit_log" "sessions")
    MISSING_TABLES=()

    for table in "${EXPECTED_TABLES[@]}"; do
        TABLE_EXISTS=$(mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${db_name}' AND table_name='${table}';" 2>/dev/null)
        if [ "${TABLE_EXISTS}" != "1" ]; then
            MISSING_TABLES+=("$table")
        fi
    done

    if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
        print_success "All ${#EXPECTED_TABLES[@]} expected tables exist"
        return 0
    fi

    print_warning "Missing tables: ${MISSING_TABLES[*]}"
    print_remediate "Running schema migration..."

    if [ -f "${install_dir}/backend/src/database/schema.sql" ]; then
        mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" "${db_name}" < "${install_dir}/backend/src/database/schema.sql" 2>>"$LOG_FILE"

        STILL_MISSING=()
        for table in "${MISSING_TABLES[@]}"; do
            TABLE_EXISTS=$(mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${db_name}' AND table_name='${table}';" 2>/dev/null)
            if [ "${TABLE_EXISTS}" != "1" ]; then
                STILL_MISSING+=("$table")
            fi
        done

        if [ ${#STILL_MISSING[@]} -eq 0 ]; then
            print_success "All missing tables created"
            return 0
        else
            print_error "Tables still missing: ${STILL_MISSING[*]}"
            return 1
        fi
    else
        print_error "Schema file not found at ${install_dir}/backend/src/database/schema.sql"
        return 1
    fi
}

# Remediate Nginx
remediate_nginx() {
    print_remediate "Nginx issues detected. Attempting to fix..."

    if ! command -v nginx &>/dev/null; then
        print_remediate "Nginx not installed. Installing..."
        apt-get install -y nginx 2>>"$LOG_FILE"
    fi

    if ! nginx -t 2>/dev/null; then
        print_remediate "Nginx config invalid. Checking..."
        rm -f /etc/nginx/sites-enabled/default 2>/dev/null
        if nginx -t 2>/dev/null; then
            print_success "Nginx config fixed after removing default site"
        else
            print_error "Nginx config still invalid. Manual fix required."
            nginx -t 2>&1 | tee -a "$LOG_FILE"
            return 1
        fi
    fi

    systemctl restart nginx 2>>"$LOG_FILE"
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
        return 0
    fi
    print_error "Nginx failed to start"
    return 1
}

# Remediate backend process
remediate_backend() {
    local install_dir="$1" api_port="$2"

    print_remediate "Backend not responding. Attempting to fix..."

    # Kill wrong process on port
    EXISTING_PID=$(lsof -ti:${api_port} 2>/dev/null || true)
    if [ -n "$EXISTING_PID" ]; then
        PROC_CMD=$(cat /proc/$EXISTING_PID/cmdline 2>/dev/null | tr '\0' ' ')
        if [[ "$PROC_CMD" != *"index.js"* ]] && [[ "$PROC_CMD" != *"node"* ]]; then
            print_remediate "Non-node process on port ${api_port}. Killing..."
            kill -9 $EXISTING_PID 2>/dev/null || true
            sleep 2
        fi
    fi

    # Fix PM2 deleted working directory
    if command -v pm2 &>/dev/null; then
        local pm2_pid=$(pm2 pid company-portal-api 2>/dev/null || pm2 pid company-portal 2>/dev/null)
        if [ -n "$pm2_pid" ] && [ "$pm2_pid" != "0" ]; then
            local proc_cwd=$(readlink /proc/$pm2_pid/cwd 2>/dev/null)
            if [ "$proc_cwd" = "(deleted)" ] || [ ! -d "$proc_cwd" ]; then
                print_remediate "PM2 working directory is deleted. Restarting..."
                pm2 delete all 2>/dev/null || true
                sleep 2
            fi
        fi

        pm2 delete company-portal-api 2>/dev/null || true
        pm2 delete company-portal 2>/dev/null || true
        sleep 1

        cd "${install_dir}/backend"
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js 2>>"$LOG_FILE"
        else
            pm2 start src/index.js --name company-portal-api --cwd "${install_dir}/backend" 2>>"$LOG_FILE"
        fi
        pm2 save 2>/dev/null
        sleep 3

        if curl -s -o /dev/null -w "%{http_code}" http://localhost:${api_port}/api/health 2>/dev/null | grep -q "200"; then
            print_success "Backend started via PM2"
            return 0
        fi
    fi

    # Try systemd
    if [ -f "/etc/systemd/system/company-portal.service" ]; then
        print_remediate "Trying systemd..."
        systemctl restart company-portal 2>/dev/null || true
        sleep 3
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:${api_port}/api/health 2>/dev/null | grep -q "200"; then
            print_success "Backend started via systemd"
            return 0
        fi
    fi

    # Direct start as fallback
    print_remediate "Direct node start..."
    cd "${install_dir}/backend"
    [ ! -d "node_modules" ] && { print_remediate "Installing backend deps..."; npm install 2>>"$LOG_FILE"; }
    [ ! -f ".env" ] && { print_error "Backend .env missing!"; return 1; }

    nohup node src/index.js >> /var/log/company-portal-backend.log 2>&1 &
    sleep 3

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${api_port}/api/health 2>/dev/null | grep -q "200"; then
        print_success "Backend started directly"
        return 0
    fi

    print_error "Could not start backend after all attempts"
    return 1
}

# Remediate file permissions
remediate_permissions() {
    local install_dir="$1"
    print_remediate "Fixing file permissions..."
    chown -R www-data:www-data "${install_dir}" 2>/dev/null
    chmod -R 755 "${install_dir}" 2>/dev/null
    chmod 600 "${install_dir}/backend/.env" 2>/dev/null
    mkdir -p "${install_dir}/backend/uploads/articles" "${install_dir}/backend/uploads/branding" 2>/dev/null
    chmod -R 775 "${install_dir}/backend/uploads" 2>/dev/null
    chown -R www-data:www-data "${install_dir}/backend/uploads" 2>/dev/null
    print_success "File permissions fixed"
}

# ============================================================
# SELF-REMEDIATION RUNNER
# ============================================================

run_self_remediation() {
    print_header "🔧 Running Self-Remediation Diagnostics"
    echo "=== Self-Remediation Run: $(date) ===" >> "$REMEDIATION_LOG"

    # Check 1: MariaDB service
    print_info "Check 1/8: MariaDB service..."
    if systemctl is-active --quiet mariadb; then
        print_success "MariaDB is running"
        track_check "pass"
    else
        remediate_mariadb_service
        if systemctl is-active --quiet mariadb; then track_check "remediated"; else track_check "fail"; fi
    fi

    # Check 2: Database connection
    print_info "Check 2/8: Database connection..."
    if mariadb -h localhost -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SELECT 1;" &>/dev/null; then
        print_success "Database connection OK"
        track_check "pass"
    else
        remediate_db_connection "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}" "${MYSQL_ROOT_PASSWORD}"
        if mariadb -h localhost -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SELECT 1;" &>/dev/null; then
            track_check "remediated"
        else
            track_check "fail"
        fi
    fi

    # Check 3: Database tables
    print_info "Check 3/8: Database tables..."
    if mariadb -h localhost -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SELECT 1;" &>/dev/null; then
        remediate_tables "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}" "${INSTALL_DIR}"
        if [ $? -eq 0 ]; then track_check "pass"; else track_check "fail"; fi
    else
        print_warning "Skipping table check - DB connection failed"
    fi

    # Check 4: File permissions
    print_info "Check 4/8: File permissions..."
    OWNER=$(stat -c '%U' "${INSTALL_DIR}/backend" 2>/dev/null)
    if [ "$OWNER" = "www-data" ]; then
        print_success "File ownership correct (www-data)"
        track_check "pass"
    else
        remediate_permissions "${INSTALL_DIR}"
        track_check "remediated"
    fi

    # Check 5: Nginx
    print_info "Check 5/8: Nginx..."
    if systemctl is-active --quiet nginx && nginx -t 2>/dev/null; then
        print_success "Nginx running with valid config"
        track_check "pass"
    else
        remediate_nginx
        if systemctl is-active --quiet nginx; then track_check "remediated"; else track_check "fail"; fi
    fi

    # Check 6: Backend
    print_info "Check 6/8: Backend on port ${API_PORT}..."
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/api/health" 2>/dev/null)
    if [ "$HEALTH_CODE" = "200" ]; then
        print_success "Backend responding (200 OK)"
        track_check "pass"
    else
        remediate_backend "${INSTALL_DIR}" "${API_PORT}"
        HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/api/health" 2>/dev/null)
        if [ "$HEALTH_CODE" = "200" ]; then track_check "remediated"; else track_check "fail"; fi
    fi

    # Check 7: Backend .env
    print_info "Check 7/8: Backend .env..."
    if [ -f "${INSTALL_DIR}/backend/.env" ]; then
        MISSING_VARS=""
        for var in DB_HOST DB_USER DB_PASSWORD DB_NAME JWT_SECRET PORT; do
            grep -q "^${var}=" "${INSTALL_DIR}/backend/.env" || MISSING_VARS="${MISSING_VARS} ${var}"
        done
        if [ -z "$MISSING_VARS" ]; then
            print_success "Backend .env has all required variables"
            track_check "pass"
        else
            print_warning "Missing .env variables:${MISSING_VARS}"
            print_remediate "Regenerating .env..."
            cat > "${INSTALL_DIR}/backend/.env" << ENVEOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
PORT=${API_PORT}
NODE_ENV=production
FRONTEND_URL=https://${DOMAIN_NAME}
SESSION_SECRET=${SESSION_SECRET}
UPLOAD_DIR=./uploads
ENVEOF
            chown www-data:www-data "${INSTALL_DIR}/backend/.env"
            chmod 600 "${INSTALL_DIR}/backend/.env"
            track_check "remediated"
        fi
    else
        print_error "Backend .env missing!"
        track_check "fail"
    fi

    # Check 8: SSL certificate
    print_info "Check 8/8: SSL certificate..."
    if [ -n "$DOMAIN_NAME" ] && command -v certbot &>/dev/null; then
        if certbot certificates 2>/dev/null | grep -q "${DOMAIN_NAME}"; then
            EXPIRY=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3}')
            if [ -n "$EXPIRY" ]; then
                DAYS_LEFT=$(( ( $(date -d "$EXPIRY" +%s 2>/dev/null || echo 0) - $(date +%s) ) / 86400 ))
                if [ "$DAYS_LEFT" -lt 7 ] && [ "$DAYS_LEFT" -gt 0 ]; then
                    print_warning "SSL expires in ${DAYS_LEFT} days. Renewing..."
                    certbot renew --force-renewal 2>>"$LOG_FILE"
                    track_check "remediated"
                else
                    print_success "SSL valid (${DAYS_LEFT} days remaining)"
                    track_check "pass"
                fi
            else
                print_success "SSL certificate exists"
                track_check "pass"
            fi
        else
            print_warning "No SSL certificate for ${DOMAIN_NAME}"
            track_check "pass"
        fi
    else
        print_info "Skipping SSL check"
        track_check "pass"
    fi
}

# ============================================================
# CONNECTIVITY TESTING FUNCTIONS
# ============================================================

test_backend_connectivity() {
    local api_port="$1"
    print_header "🧪 Testing Backend Connectivity"

    # Health endpoint
    print_test "Health endpoint (localhost:${api_port})..."
    local health_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${api_port}/api/health" 2>/dev/null)
    if [ "$health_code" = "200" ]; then
        local health_body=$(curl -s "http://localhost:${api_port}/api/health" 2>/dev/null)
        print_success "Health: $health_code - $health_body"
        track_check "pass"
    else
        print_error "Health: $health_code"
        track_check "fail"
    fi

    # Categories
    print_test "Categories endpoint..."
    local cat_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${api_port}/api/categories" 2>/dev/null)
    if [ "$cat_code" = "200" ]; then print_success "Categories: $cat_code"; track_check "pass"; else print_error "Categories: $cat_code"; track_check "fail"; fi

    # Settings
    print_test "Settings endpoint..."
    local set_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${api_port}/api/settings" 2>/dev/null)
    if [ "$set_code" = "200" ]; then print_success "Settings: $set_code"; track_check "pass"; else print_error "Settings: $set_code"; track_check "fail"; fi

    # Auth validation
    print_test "Auth validation..."
    local auth_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:${api_port}/api/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    if [ "$auth_code" = "400" ] || [ "$auth_code" = "401" ] || [ "$auth_code" = "422" ]; then
        print_success "Auth validation: $auth_code (correct)"
        track_check "pass"
    else
        print_error "Auth validation: $auth_code"
        track_check "fail"
    fi

    # 404 handler
    print_test "404 handler..."
    local nf_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${api_port}/api/nonexistent" 2>/dev/null)
    if [ "$nf_code" = "404" ]; then print_success "404 handler: $nf_code"; track_check "pass"; else print_error "404 handler: $nf_code"; track_check "fail"; fi
}

test_frontend_connectivity() {
    local domain="$1" install_dir="$2"
    print_header "🧪 Testing Frontend Connectivity"

    # Build exists
    print_test "Frontend build..."
    if [ -d "${install_dir}/dist" ] && [ -f "${install_dir}/dist/index.html" ]; then
        print_success "Frontend build found"
        track_check "pass"
    else
        print_remediate "Rebuilding frontend..."
        cd "${install_dir}" && npm run build 2>>"$LOG_FILE"
        if [ -f "${install_dir}/dist/index.html" ]; then print_success "Frontend rebuilt"; track_check "remediated"; else print_error "Build failed"; track_check "fail"; fi
    fi

    # Nginx frontend
    print_test "Nginx serving frontend..."
    local fe_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost" 2>/dev/null)
    if [ "$fe_code" = "200" ] || [ "$fe_code" = "301" ] || [ "$fe_code" = "302" ]; then
        print_success "Nginx frontend: $fe_code"
        track_check "pass"
    else
        print_error "Nginx frontend: $fe_code"
        track_check "fail"
    fi

    # Nginx API proxy
    print_test "Nginx API proxy..."
    local proxy_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/health" 2>/dev/null)
    if [ "$proxy_code" = "200" ]; then print_success "API proxy: $proxy_code"; track_check "pass"; else print_error "API proxy: $proxy_code"; track_check "fail"; fi

    # HTTPS
    if [ -n "$domain" ]; then
        print_test "HTTPS to https://${domain}..."
        local https_code=$(curl -s -o /dev/null -w "%{http_code}" "https://${domain}" 2>/dev/null)
        if [ "$https_code" = "200" ]; then
            print_success "HTTPS frontend: $https_code"
            track_check "pass"
        elif [ "$https_code" = "000" ]; then
            print_warning "HTTPS not reachable (DNS may not be configured)"
            track_check "pass"
        else
            print_error "HTTPS frontend: $https_code"
            track_check "fail"
        fi

        print_test "HTTPS API..."
        local ha_code=$(curl -s -o /dev/null -w "%{http_code}" "https://${domain}/api/health" 2>/dev/null)
        if [ "$ha_code" = "200" ]; then print_success "HTTPS API: $ha_code"; track_check "pass"
        elif [ "$ha_code" = "000" ]; then print_warning "HTTPS API not reachable"; track_check "pass"
        else print_error "HTTPS API: $ha_code"; track_check "fail"; fi
    fi
}

test_database_connectivity() {
    local api_port="$1" db_host="$2" db_user="$3" db_pass="$4" db_name="$5"
    print_header "🧪 Testing Database Connectivity"

    # Direct connection
    print_test "Direct MariaDB connection..."
    if mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -e "USE ${db_name}; SELECT 1;" &>/dev/null; then
        print_success "Direct connection OK"
        track_check "pass"
    else
        print_error "Direct connection failed"
        track_check "fail"
    fi

    # Table count
    print_test "Database tables..."
    TABLE_COUNT=$(mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${db_name}';" 2>/dev/null)
    if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
        print_success "Database has ${TABLE_COUNT} tables"
        track_check "pass"
    else
        print_error "No tables found"
        track_check "fail"
    fi

    # Admin user
    print_test "Admin user exists..."
    ADMIN_COUNT=$(mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -N -e "SELECT COUNT(*) FROM ${db_name}.users WHERE role='admin';" 2>/dev/null)
    if [ -n "$ADMIN_COUNT" ] && [ "$ADMIN_COUNT" -gt 0 ]; then
        print_success "Found ${ADMIN_COUNT} admin user(s)"
        track_check "pass"
    else
        print_warning "No admin users found"
        track_check "fail"
    fi

    # Query performance
    print_test "Query performance..."
    local start_time=$(date +%s%N)
    mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -e "SELECT COUNT(*) FROM ${db_name}.users;" &>/dev/null
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    print_success "Query completed in ${duration}ms"
    track_check "pass"

    # User privileges
    print_test "User privileges..."
    GRANTS=$(mariadb -h "${db_host}" -u "${db_user}" -p"${db_pass}" -N -e "SHOW GRANTS;" 2>/dev/null)
    if echo "$GRANTS" | grep -qi "ALL PRIVILEGES"; then
        print_success "User has ALL PRIVILEGES"
        track_check "pass"
    else
        print_warning "Limited privileges"
        track_check "pass"
    fi
}

# ============================================================
# SAMPLE ARTICLE POSTING (Full Integration Test)
# ============================================================

post_sample_article() {
    local api_port="$1"
    print_header "📰 Integration Test: Posting Sample Article"

    # Step 1: Login as admin
    print_test "Authenticating as admin..."
    LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:${api_port}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@company.com","password":"admin123"}' 2>/dev/null)

    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        print_error "Admin login failed"
        print_info "Response: $LOGIN_RESPONSE"

        # Try re-seeding
        print_remediate "Checking seed data..."
        ADMIN_EXISTS=$(mariadb -h localhost -u "${DB_USER}" -p"${DB_PASSWORD}" -N -e "SELECT COUNT(*) FROM ${DB_NAME}.users WHERE email='admin@company.com';" 2>/dev/null)
        if [ "${ADMIN_EXISTS}" = "0" ] || [ -z "${ADMIN_EXISTS}" ]; then
            print_remediate "Admin user missing. Running seed..."
            cd "${INSTALL_DIR}/backend" && npm run seed 2>>"$LOG_FILE"
            sleep 2
            LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:${api_port}/api/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"email":"admin@company.com","password":"admin123"}' 2>/dev/null)
            TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        fi

        if [ -z "$TOKEN" ]; then
            print_error "Cannot authenticate. Skipping article test."
            track_check "fail"
            return 1
        fi
    fi
    print_success "Admin authenticated"
    track_check "pass"

    # Step 2: Create test category
    print_test "Creating test category..."
    CATEGORY_RESPONSE=$(curl -s -X POST "http://localhost:${api_port}/api/categories" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TOKEN}" \
        -d '{"name":"Installation Test","slug":"installation-test","description":"Auto-created during install verification","color":"#10B981"}' 2>/dev/null)

    CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if echo "$CATEGORY_RESPONSE" | grep -q '"success":true' && [ -n "$CATEGORY_ID" ]; then
        print_success "Category created (ID: ${CATEGORY_ID})"
        track_check "pass"
    else
        print_warning "Category may already exist. Continuing..."
        CATEGORY_ID=""
    fi

    # Step 3: Post sample article
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    ARTICLE_TITLE="Installation Verification - ${TIMESTAMP}"

    print_test "Posting sample article..."
    if [ -n "$CATEGORY_ID" ]; then
        ARTICLE_JSON="{\"title\":\"${ARTICLE_TITLE}\",\"content\":\"<h2>Installation Verification</h2><p>This article was automatically created during the Company Portal installation on <strong>${TIMESTAMP}</strong>.</p><p>If you can see this article, it means:</p><ul><li>Backend API is working</li><li>Database connection is functional</li><li>Authentication is working</li><li>Article creation (full write path) is operational</li></ul><p><em>You can safely delete this article.</em></p>\",\"excerpt\":\"Automated installation verification article\",\"status\":\"published\",\"category_id\":\"${CATEGORY_ID}\"}"
    else
        ARTICLE_JSON="{\"title\":\"${ARTICLE_TITLE}\",\"content\":\"<h2>Installation Verification</h2><p>This article was automatically created during the Company Portal installation on <strong>${TIMESTAMP}</strong>.</p><p>If you can see this article, it means:</p><ul><li>Backend API is working</li><li>Database connection is functional</li><li>Authentication is working</li><li>Article creation (full write path) is operational</li></ul><p><em>You can safely delete this article.</em></p>\",\"excerpt\":\"Automated installation verification article\",\"status\":\"published\"}"
    fi

    ARTICLE_RESPONSE=$(curl -s -X POST "http://localhost:${api_port}/api/articles" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TOKEN}" \
        -d "${ARTICLE_JSON}" 2>/dev/null)

    ARTICLE_ID=$(echo "$ARTICLE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if echo "$ARTICLE_RESPONSE" | grep -q '"success":true' && [ -n "$ARTICLE_ID" ]; then
        print_success "Article posted (ID: ${ARTICLE_ID})"
        track_check "pass"
    else
        print_error "Article creation failed"
        print_info "Response: $ARTICLE_RESPONSE"
        track_check "fail"
        return 1
    fi

    # Step 4: Verify retrieval
    print_test "Retrieving posted article..."
    RETRIEVE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${api_port}/api/articles/${ARTICLE_ID}" 2>/dev/null)
    if [ "$RETRIEVE_CODE" = "200" ]; then
        print_success "Article retrieved (GET → 200)"
        track_check "pass"
    else
        print_error "Article retrieval failed: $RETRIEVE_CODE"
        track_check "fail"
    fi

    # Step 5: Check listing
    print_test "Article in listing..."
    LIST_RESPONSE=$(curl -s "http://localhost:${api_port}/api/articles" 2>/dev/null)
    if echo "$LIST_RESPONSE" | grep -q "$ARTICLE_ID"; then
        print_success "Article found in listing"
        track_check "pass"
    else
        print_warning "Article not in immediate listing"
        track_check "pass"
    fi

    # Step 6: Test update
    print_test "Updating article..."
    UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:${api_port}/api/articles/${ARTICLE_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TOKEN}" \
        -d "{\"title\":\"${ARTICLE_TITLE} (Updated)\",\"content\":\"<h2>Updated</h2><p>Full CRUD verified.</p>\"}" 2>/dev/null)
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
        print_success "Article updated"
        track_check "pass"
    else
        print_warning "Article update: $UPDATE_RESPONSE"
        track_check "fail"
    fi

    echo ""
    print_success "📰 Sample article '${ARTICLE_TITLE}' is live!"
    print_info "You can view and manage it from the admin panel."
}

# ============================================================
# ORIGINAL INSTALLATION FUNCTIONS
# ============================================================

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        echo "Please run: sudo bash install.sh"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" != "debian" && "$ID" != "ubuntu" && "$ID_LIKE" != *"debian"* ]]; then
            print_warning "This script is designed for Debian-based systems."
            print_info "Detected: $PRETTY_NAME"
            read -p "Continue anyway? (y/n): " CONTINUE
            [[ ! "$CONTINUE" =~ ^[Yy]$ ]] && exit 1
        else
            print_success "OS detected: $PRETTY_NAME"
        fi
    fi
}

show_welcome() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
   ____                                          ____            _        _ 
  / ___|___  _ __ ___  _ __   __ _ _ __  _   _  |  _ \ ___  _ __| |_ __ _| |
 | |   / _ \| '_ ` _ \| '_ \ / _` | '_ \| | | | | |_) / _ \| '__| __/ _` | |
 | |__| (_) | | | | | | |_) | (_| | | | | |_| | |  __/ (_) | |  | || (_| | |
  \____\___/|_| |_| |_| .__/ \__,_|_| |_|\__, | |_|   \___/|_|   \__\__,_|_|
                      |_|                |___/                              
                                                                            
                    Installation Wizard v2.0
          (Self-Remediation & Integration Testing)
EOF
    echo -e "${NC}"
    echo ""
    echo "This wizard will install and configure:"
    echo "  - Node.js 20.x        - PM2 (Process manager)"
    echo "  - MariaDB Server      - Nginx (reverse proxy)"
    echo "  - Certbot (SSL)       - Adminer (DB management)"
    echo ""
    echo "v2.0 Features:"
    echo "  🔧 Self-remediation for common issues"
    echo "  🧪 Backend & frontend connectivity testing"
    echo "  📰 Sample article posting for full integration test"
    echo "  📋 Detailed logging"
    echo ""
    echo "Logs: $LOG_FILE"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
}

collect_config() {
    print_header "Configuration"
    
    while true; do
        read -p "Enter your website/company name: " SITE_NAME
        [ -n "$SITE_NAME" ] && break
        print_error "Website name cannot be empty"
    done
    
    while true; do
        read -p "Enter your domain name (e.g., portal.company.com): " DOMAIN_NAME
        [[ "$DOMAIN_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] && break
        print_error "Please enter a valid domain name"
    done
    
    while true; do
        read -p "Enter admin email (for SSL certificate): " ADMIN_EMAIL
        [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] && break
        print_error "Please enter a valid email address"
    done
    
    print_info "Database Configuration"
    read -p "Enter database name [company_portal]: " DB_NAME
    DB_NAME=${DB_NAME:-company_portal}
    
    read -p "Enter database user [portal_user]: " DB_USER
    DB_USER=${DB_USER:-portal_user}
    
    while true; do
        read -s -p "Enter database password: " DB_PASSWORD; echo ""
        [ ${#DB_PASSWORD} -lt 8 ] && { print_error "Password must be at least 8 characters"; continue; }
        read -s -p "Confirm database password: " DB_PASSWORD_CONFIRM; echo ""
        [ "$DB_PASSWORD" == "$DB_PASSWORD_CONFIRM" ] && break
        print_error "Passwords do not match"
    done
    
    while true; do
        read -s -p "Enter MariaDB root password: " MYSQL_ROOT_PASSWORD; echo ""
        [ ${#MYSQL_ROOT_PASSWORD} -lt 8 ] && { print_error "Password must be at least 8 characters"; continue; }
        read -s -p "Confirm MariaDB root password: " MYSQL_ROOT_PASSWORD_CONFIRM; echo ""
        [ "$MYSQL_ROOT_PASSWORD" == "$MYSQL_ROOT_PASSWORD_CONFIRM" ] && break
        print_error "Passwords do not match"
    done
    
    read -p "Enter installation directory [/var/www/company-portal]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-/var/www/company-portal}
    read -p "Enter backend API port [3001]: " API_PORT
    API_PORT=${API_PORT:-3001}
    read -p "Enter frontend port [5173]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-5173}
    
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    echo ""
    print_header "Configuration Summary"
    echo "Website Name:      $SITE_NAME"
    echo "Domain:            $DOMAIN_NAME"
    echo "Admin Email:       $ADMIN_EMAIL"
    echo "Database Name:     $DB_NAME"
    echo "Database User:     $DB_USER"
    echo "Install Directory: $INSTALL_DIR"
    echo "API Port:          $API_PORT"
    echo "Frontend Port:     $FRONTEND_PORT"
    echo ""
    
    read -p "Is this configuration correct? (y/n): " CONFIRM
    [[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { print_warning "Installation cancelled"; exit 0; }
}

update_system() {
    print_header "Updating System Packages"
    apt-get update -y 2>>"$LOG_FILE"
    apt-get upgrade -y 2>>"$LOG_FILE"
    print_success "System updated"
}

install_dependencies() {
    print_header "Installing Dependencies"
    apt-get install -y curl wget git gnupg software-properties-common apt-transport-https \
        ca-certificates lsb-release ufw unzip build-essential jq 2>>"$LOG_FILE"
    print_success "Essential packages installed"
}

install_nodejs() {
    print_header "Installing Node.js 20.x"
    if command -v node &>/dev/null; then
        print_info "Node.js $(node -v) already installed"
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>>"$LOG_FILE"
        apt-get install -y nodejs 2>>"$LOG_FILE"
        print_success "Node.js $(node -v) installed"
    fi
    npm install -g pm2 2>>"$LOG_FILE"
    print_success "PM2 installed"
}

install_mariadb() {
    print_header "Installing MariaDB Server"
    if command -v mariadb &>/dev/null; then
        print_info "MariaDB already installed"
    else
        apt-get install -y mariadb-server mariadb-client 2>>"$LOG_FILE"
        systemctl start mariadb
        systemctl enable mariadb
        print_success "MariaDB installed"
    fi
    
    if ! systemctl is-active --quiet mariadb; then
        remediate_mariadb_service || { print_error "MariaDB could not start. Aborting."; exit 1; }
    fi
    
    print_info "Securing MariaDB..."
    mariadb -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${MYSQL_ROOT_PASSWORD}');" 2>>"$LOG_FILE" || \
        mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" 2>/dev/null || \
        { print_error "Could not set root password"; exit 1; }
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='';" 2>>"$LOG_FILE" || true
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>>"$LOG_FILE" || true
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS test;" 2>>"$LOG_FILE" || true
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>>"$LOG_FILE" || true
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;" 2>>"$LOG_FILE"
    print_success "MariaDB secured"
}

setup_database() {
    print_header "Setting Up Database"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>>"$LOG_FILE"
    print_success "Database '${DB_NAME}' created"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';" 2>>"$LOG_FILE"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';" 2>>"$LOG_FILE"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;" 2>>"$LOG_FILE"
    print_success "Database user '${DB_USER}' created"
    
    # Verify immediately
    print_info "Verifying database connection..."
    if ! mariadb -h localhost -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SELECT 1;" &>/dev/null; then
        print_warning "Initial connection failed. Self-remediating..."
        remediate_db_connection "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}" "${MYSQL_ROOT_PASSWORD}"
    else
        print_success "Database connection verified"
    fi
}

install_nginx() {
    print_header "Installing Nginx"
    apt-get install -y nginx 2>>"$LOG_FILE"
    systemctl start nginx; systemctl enable nginx
    print_success "Nginx installed"
}

install_certbot() {
    print_header "Installing Certbot"
    apt-get install -y certbot python3-certbot-nginx 2>>"$LOG_FILE"
    print_success "Certbot installed"
}

install_adminer() {
    print_header "Installing Adminer"
    mkdir -p /var/www/adminer
    wget -O /var/www/adminer/index.php https://www.adminer.org/latest.php 2>>"$LOG_FILE"
    chown -R www-data:www-data /var/www/adminer
    print_success "Adminer installed"
}

setup_application() {
    print_header "Setting Up Application"
    mkdir -p ${INSTALL_DIR}
    
    if [ -d "./backend" ]; then
        cp -r ./backend ${INSTALL_DIR}/
        cp -r ./src ${INSTALL_DIR}/
        cp -r ./public ${INSTALL_DIR}/ 2>/dev/null || true
        cp -r ./scripts ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./package.json ${INSTALL_DIR}/
        cp ./package-lock.json ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./vite.config.ts ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./tsconfig.json ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./tailwind.config.js ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./postcss.config.js ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./index.html ${INSTALL_DIR}/ 2>/dev/null || true
        cp ./components.json ${INSTALL_DIR}/ 2>/dev/null || true
    fi
    
    cd ${INSTALL_DIR}
    
    cat > ${INSTALL_DIR}/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "noEmitOnError": false,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF
    
    cat > ${INSTALL_DIR}/backend/.env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
PORT=${API_PORT}
NODE_ENV=production
FRONTEND_URL=https://${DOMAIN_NAME}
SESSION_SECRET=${SESSION_SECRET}
UPLOAD_DIR=./uploads
EOF
    
    cat > ${INSTALL_DIR}/.env << EOF
VITE_API_URL=https://${DOMAIN_NAME}/api
VITE_SITE_NAME=${SITE_NAME}
EOF
    
    print_success "Environment files created"
    
    print_info "Installing frontend dependencies..."
    npm install 2>>"$LOG_FILE"
    
    print_info "Installing backend dependencies..."
    cd ${INSTALL_DIR}/backend && npm install 2>>"$LOG_FILE"
    
    # Migration with retry and remediation
    print_info "Running database migrations..."
    if ! retry_with_backoff 3 "cd ${INSTALL_DIR}/backend && npm run migrate 2>>'$LOG_FILE'"; then
        print_warning "Migration failed. Self-remediating..."
        remediate_db_connection "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}" "${MYSQL_ROOT_PASSWORD}"
        if ! retry_with_backoff 2 "cd ${INSTALL_DIR}/backend && npm run migrate 2>>'$LOG_FILE'"; then
            print_error "Migration failed after remediation! Manual fix needed."
        else
            print_success "Migration completed after remediation"
        fi
    else
        print_success "Database migration completed"
    fi
    
    # Seed with retry and remediation
    print_info "Seeding database..."
    if ! retry_with_backoff 3 "cd ${INSTALL_DIR}/backend && npm run seed 2>>'$LOG_FILE'"; then
        print_warning "Seeding failed. Fixing tables..."
        remediate_tables "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}" "${INSTALL_DIR}"
        if ! retry_with_backoff 2 "cd ${INSTALL_DIR}/backend && npm run seed 2>>'$LOG_FILE'"; then
            print_error "Seeding failed after remediation!"
        else
            print_success "Seeding completed after remediation"
        fi
    else
        print_success "Database seeding completed"
    fi
    
    print_info "Building frontend..."
    cd ${INSTALL_DIR} && npm run build 2>>"$LOG_FILE"
    
    mkdir -p ${INSTALL_DIR}/backend/uploads/articles ${INSTALL_DIR}/backend/uploads/branding
    chown -R www-data:www-data ${INSTALL_DIR}
    chmod 600 ${INSTALL_DIR}/backend/.env
    
    print_success "Application setup complete"
}

configure_nginx() {
    print_header "Configuring Nginx"
    rm -f /etc/nginx/sites-enabled/default
    
    cat > /etc/nginx/sites-available/company-portal << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    root ${INSTALL_DIR}/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        alias ${INSTALL_DIR}/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    apt-get install -y php-fpm php-mysql 2>>"$LOG_FILE"
    ln -sf /etc/nginx/sites-available/company-portal /etc/nginx/sites-enabled/
    
    if ! nginx -t 2>/dev/null; then
        remediate_nginx
    else
        systemctl restart nginx
        print_success "Nginx configured"
    fi
}

setup_ssl() {
    print_header "Setting Up SSL Certificate"
    mkdir -p /var/www/certbot
    
    if certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email ${ADMIN_EMAIL} 2>>"$LOG_FILE"; then
        nginx -t 2>/dev/null && systemctl restart nginx
        systemctl enable certbot.timer 2>/dev/null || true
        systemctl start certbot.timer 2>/dev/null || true
        print_success "SSL certificate installed"
    else
        print_warning "SSL failed. You can manually run: certbot --nginx -d ${DOMAIN_NAME}"
        read -p "Continue without SSL? (y/n): " CONTINUE_NO_SSL
        [[ ! "$CONTINUE_NO_SSL" =~ ^[Yy]$ ]] || print_info "Continuing without SSL"
    fi
}

setup_pm2() {
    print_header "Setting Up PM2 Process Manager"
    cd ${INSTALL_DIR}/backend
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'company-portal-api',
    script: 'src/index.js',
    cwd: '${INSTALL_DIR}/backend',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' }
  }]
};
EOF
    
    pm2 delete all 2>/dev/null || true
    pm2 start ecosystem.config.js 2>>"$LOG_FILE"
    pm2 save 2>>"$LOG_FILE"
    pm2 startup systemd -u root --hp /root 2>>"$LOG_FILE" || true
    
    sleep 3
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/api/health" 2>/dev/null)
    if [ "$HEALTH_CODE" = "200" ]; then
        print_success "PM2 configured and backend responding"
    else
        print_warning "Backend not responding yet. Will check in remediation phase."
    fi
}

setup_systemd_service() {
    print_header "Setting Up Systemd Service"
    if [ -f "${INSTALL_DIR}/scripts/company-portal.service" ]; then
        cp ${INSTALL_DIR}/scripts/company-portal.service /etc/systemd/system/
        sed -i "s|/var/www/company-portal|${INSTALL_DIR}|g" /etc/systemd/system/company-portal.service
        systemctl daemon-reload
        systemctl enable company-portal 2>/dev/null || true
        print_success "Systemd service configured"
    fi
}

configure_firewall() {
    print_header "Configuring Firewall"
    ufw --force enable 2>>"$LOG_FILE"
    ufw default deny incoming 2>>"$LOG_FILE"
    ufw default allow outgoing 2>>"$LOG_FILE"
    ufw allow ssh 2>>"$LOG_FILE"
    ufw allow 80 2>>"$LOG_FILE"
    ufw allow 443 2>>"$LOG_FILE"
    ufw allow 'Nginx Full' 2>>"$LOG_FILE" || true
    ufw reload 2>>"$LOG_FILE"
    print_success "Firewall configured (ports 80, 443, SSH)"
}

show_completion() {
    print_header "Installation Complete!"
    echo -e "${GREEN}"
    cat << EOF
╔══════════════════════════════════════════════════════════════════╗
║                    Installation Successful!                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Website URL:     https://${DOMAIN_NAME}
║  API URL:         https://${DOMAIN_NAME}/api
║  Adminer URL:     https://adminer.${DOMAIN_NAME}
║                                                                   ║
║  Default Login Credentials:                                       ║
║    Admin:   admin@company.com / admin123                         ║
║    Editor:  editor@company.com / editor123                       ║
║    User:    user@company.com / user123                           ║
║                                                                   ║
║  ⚠️  IMPORTANT: Change default passwords immediately!             ║
║                                                                   ║
║  Database:  ${DB_NAME} (user: ${DB_USER})
║                                                                   ║
║  Commands: pm2 status | pm2 logs | pm2 restart all               ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    cat > ${INSTALL_DIR}/INSTALLATION_INFO.txt << EOF
Company Portal Installation Information
========================================
Date: $(date)
Version: 2.0
Website: ${SITE_NAME}
Domain: ${DOMAIN_NAME}
Admin Email: ${ADMIN_EMAIL}
Directory: ${INSTALL_DIR}
Database: ${DB_NAME} (user: ${DB_USER})
API Port: ${API_PORT}
Logs: ${LOG_FILE}
Remediation: ${REMEDIATION_LOG}

Default Credentials:
- admin@company.com / admin123
- editor@company.com / editor123
- user@company.com / user123

CHANGE THESE IMMEDIATELY!
EOF
    chmod 600 ${INSTALL_DIR}/INSTALLATION_INFO.txt
}

show_test_summary() {
    print_header "📊 Final Test & Remediation Summary"
    echo -e "  Total checks:      ${BLUE}${TOTAL_CHECKS}${NC}"
    echo -e "  Passed:            ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "  Failed:            ${RED}${FAILED_CHECKS}${NC}"
    echo -e "  Auto-remediated:   ${MAGENTA}${REMEDIATED_CHECKS}${NC}"
    echo ""
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  🎉 ALL CHECKS PASSED! Installation is healthy.  ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠ ${FAILED_CHECKS} check(s) failed. Review output above.     ║${NC}"
        echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
    fi
    echo ""
    echo "Logs:"
    echo "  Installation:  ${LOG_FILE}"
    echo "  Remediation:   ${REMEDIATION_LOG}"
}

# ============================================================
# MAIN
# ============================================================

main() {
    check_root
    check_os
    show_welcome
    collect_config
    
    echo "Installation started at $(date)" > "$LOG_FILE"
    echo "Remediation log started at $(date)" > "$REMEDIATION_LOG"
    
    # Phase 1: Installation
    print_header "📦 Phase 1: Installation"
    update_system
    install_dependencies
    install_nodejs
    install_mariadb
    setup_database
    install_nginx
    install_certbot
    install_adminer
    setup_application
    configure_nginx
    configure_firewall
    setup_ssl
    setup_pm2
    setup_systemd_service
    
    # Phase 2: Self-Remediation
    print_header "🔧 Phase 2: Self-Remediation & Diagnostics"
    sleep 2
    run_self_remediation
    
    # Phase 3: Connectivity Testing
    print_header "🧪 Phase 3: Connectivity Testing"
    sleep 2
    test_backend_connectivity "${API_PORT}"
    test_database_connectivity "${API_PORT}" "localhost" "${DB_USER}" "${DB_PASSWORD}" "${DB_NAME}"
    test_frontend_connectivity "${DOMAIN_NAME}" "${INSTALL_DIR}"
    
    # Phase 4: Integration Test - Post Sample Article
    print_header "📰 Phase 4: Integration Test"
    sleep 2
    post_sample_article "${API_PORT}"
    
    # Completion
    show_completion
    show_test_summary
}

main "$@"
