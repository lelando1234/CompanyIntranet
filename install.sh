#!/bin/bash

# Company Portal - Complete Installation Wizard
# For Debian Bookworm (12.x)
# This script installs all dependencies, configures MariaDB, Nginx, and SSL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        echo "Please run: sudo bash install.sh"
        exit 1
    fi
}

# Welcome message
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
                                                                            
                    Installation Wizard v1.0
EOF
    echo -e "${NC}"
    echo ""
    echo "This wizard will guide you through the installation process."
    echo "It will install and configure:"
    echo "  - Node.js 20.x"
    echo "  - MariaDB Server"
    echo "  - Nginx (reverse proxy)"
    echo "  - Certbot (Let's Encrypt SSL)"
    echo "  - Adminer (Database management)"
    echo "  - PM2 (Process manager)"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
}

# Collect configuration
collect_config() {
    print_header "Configuration"
    
    # Website name
    while true; do
        read -p "Enter your website/company name: " SITE_NAME
        if [ -n "$SITE_NAME" ]; then
            break
        fi
        print_error "Website name cannot be empty"
    done
    
    # Domain name
    while true; do
        read -p "Enter your domain name (e.g., portal.company.com): " DOMAIN_NAME
        if [[ "$DOMAIN_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        fi
        print_error "Please enter a valid domain name"
    done
    
    # Email for SSL
    while true; do
        read -p "Enter admin email (for SSL certificate): " ADMIN_EMAIL
        if [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        fi
        print_error "Please enter a valid email address"
    done
    
    # Database configuration
    print_info "Database Configuration"
    read -p "Enter database name [company_portal]: " DB_NAME
    DB_NAME=${DB_NAME:-company_portal}
    
    read -p "Enter database user [portal_user]: " DB_USER
    DB_USER=${DB_USER:-portal_user}
    
    while true; do
        read -s -p "Enter database password: " DB_PASSWORD
        echo ""
        if [ ${#DB_PASSWORD} -lt 8 ]; then
            print_error "Password must be at least 8 characters"
            continue
        fi
        read -s -p "Confirm database password: " DB_PASSWORD_CONFIRM
        echo ""
        if [ "$DB_PASSWORD" == "$DB_PASSWORD_CONFIRM" ]; then
            break
        fi
        print_error "Passwords do not match"
    done
    
    # MariaDB root password
    while true; do
        read -s -p "Enter MariaDB root password: " MYSQL_ROOT_PASSWORD
        echo ""
        if [ ${#MYSQL_ROOT_PASSWORD} -lt 8 ]; then
            print_error "Password must be at least 8 characters"
            continue
        fi
        read -s -p "Confirm MariaDB root password: " MYSQL_ROOT_PASSWORD_CONFIRM
        echo ""
        if [ "$MYSQL_ROOT_PASSWORD" == "$MYSQL_ROOT_PASSWORD_CONFIRM" ]; then
            break
        fi
        print_error "Passwords do not match"
    done
    
    # Installation directory
    read -p "Enter installation directory [/var/www/company-portal]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-/var/www/company-portal}
    
    # Backend port
    read -p "Enter backend API port [3001]: " API_PORT
    API_PORT=${API_PORT:-3001}
    
    # Frontend port
    read -p "Enter frontend port [5173]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-5173}
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Confirm configuration
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
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

# Update system
update_system() {
    print_header "Updating System Packages"
    apt-get update -y
    apt-get upgrade -y
    print_success "System updated"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Install essential packages
    apt-get install -y \
        curl \
        wget \
        git \
        gnupg \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        lsb-release \
        ufw \
        unzip \
        build-essential
    
    print_success "Essential packages installed"
}

# Install Node.js
install_nodejs() {
    print_header "Installing Node.js 20.x"
    
    # Check if already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "Node.js $NODE_VERSION is already installed"
    else
        # Install NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        print_success "Node.js $(node -v) installed"
    fi
    
    # Install PM2 globally
    npm install -g pm2
    print_success "PM2 installed"
}

# Install MariaDB
install_mariadb() {
    print_header "Installing MariaDB Server"
    
    # Check if already installed
    if command -v mariadb &> /dev/null; then
        print_info "MariaDB is already installed"
    else
        apt-get install -y mariadb-server mariadb-client
        systemctl start mariadb
        systemctl enable mariadb
        print_success "MariaDB installed"
    fi
    
    # Secure MariaDB installation
    print_info "Securing MariaDB installation..."
    
    # Set root password and secure installation
    mariadb -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${MYSQL_ROOT_PASSWORD}');"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='';"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS test;"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;"
    
    print_success "MariaDB secured"
}

# Create database and user
setup_database() {
    print_header "Setting Up Database"
    
    # Create database
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    print_success "Database '${DB_NAME}' created"
    
    # Create user
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
    mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;"
    print_success "Database user '${DB_USER}' created"
}

# Install Nginx
install_nginx() {
    print_header "Installing Nginx"
    
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed"
}

# Install Certbot
install_certbot() {
    print_header "Installing Certbot for SSL"
    
    apt-get install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed"
}

# Install Adminer
install_adminer() {
    print_header "Installing Adminer"
    
    mkdir -p /var/www/adminer
    wget -O /var/www/adminer/index.php https://www.adminer.org/latest.php
    chown -R www-data:www-data /var/www/adminer
    
    print_success "Adminer installed"
}

# Setup application
setup_application() {
    print_header "Setting Up Application"
    
    # Create installation directory
    mkdir -p ${INSTALL_DIR}
    
    # Copy application files (assuming we're in the source directory)
    if [ -d "./backend" ]; then
        cp -r ./backend ${INSTALL_DIR}/
        cp -r ./src ${INSTALL_DIR}/
        cp -r ./public ${INSTALL_DIR}/ 2>/dev/null || true
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
    
    # Create backend .env file
    cat > ${INSTALL_DIR}/backend/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=${API_PORT}
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://${DOMAIN_NAME}

# Session Secret
SESSION_SECRET=${SESSION_SECRET}

# Upload Directory
UPLOAD_DIR=./uploads
EOF
    
    # Create frontend .env file
    cat > ${INSTALL_DIR}/.env << EOF
VITE_API_URL=https://${DOMAIN_NAME}/api
VITE_SITE_NAME=${SITE_NAME}
EOF
    
    print_success "Environment files created"
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Installing backend dependencies..."
    cd ${INSTALL_DIR}/backend
    npm install
    
    # Run database migrations
    print_info "Running database migrations..."
    npm run migrate
    
    # Seed database
    print_info "Seeding database..."
    npm run seed
    
    # Build frontend
    print_info "Building frontend..."
    cd ${INSTALL_DIR}
    npm run build
    
    # Create uploads directory
    mkdir -p ${INSTALL_DIR}/backend/uploads/articles
    mkdir -p ${INSTALL_DIR}/backend/uploads/branding
    chown -R www-data:www-data ${INSTALL_DIR}/backend/uploads
    
    print_success "Application setup complete"
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx"
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/${DOMAIN_NAME} << EOF
# Company Portal - Nginx Configuration

# Upstream for backend API
upstream portal_backend {
    server 127.0.0.1:${API_PORT};
    keepalive 64;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_NAME};
    
    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Root directory for frontend
    root ${INSTALL_DIR}/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    
    # API proxy
    location /api/ {
        proxy_pass http://portal_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://${DOMAIN_NAME}' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Uploads
    location /uploads/ {
        alias ${INSTALL_DIR}/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend routes (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.env$ {
        deny all;
    }
}

# Adminer configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name adminer.${DOMAIN_NAME};
    
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    root /var/www/adminer;
    index index.php;
    
    # Restrict access (change this IP or add authentication)
    # allow YOUR_IP;
    # deny all;
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }
}
EOF
    
    # Install PHP for Adminer
    apt-get install -y php-fpm php-mysql
    
    # Enable site
    ln -sf /etc/nginx/sites-available/${DOMAIN_NAME} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    
    print_success "Nginx configured"
}

# Setup SSL
setup_ssl() {
    print_header "Setting Up SSL Certificate"
    
    # Create certbot webroot
    mkdir -p /var/www/certbot
    
    # Obtain certificate
    print_info "Obtaining SSL certificate from Let's Encrypt..."
    certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email ${ADMIN_EMAIL} --redirect
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_success "SSL certificate installed"
}

# Setup PM2
setup_pm2() {
    print_header "Setting Up PM2 Process Manager"
    
    cd ${INSTALL_DIR}/backend
    
    # Create PM2 ecosystem file
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
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF
    
    # Start application
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root
    
    print_success "PM2 configured and application started"
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"
    
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw reload
    
    print_success "Firewall configured"
}

# Show completion message
show_completion() {
    print_header "Installation Complete!"
    
    echo -e "${GREEN}"
    cat << EOF
╔══════════════════════════════════════════════════════════════════╗
║                    Installation Successful!                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Your Company Portal has been installed successfully!             ║
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
║  Database:                                                        ║
║    Name:     ${DB_NAME}
║    User:     ${DB_USER}
║    Host:     localhost                                           ║
║                                                                   ║
║  Useful Commands:                                                 ║
║    pm2 status          - Check application status                ║
║    pm2 logs            - View application logs                   ║
║    pm2 restart all     - Restart application                     ║
║    systemctl status nginx - Check Nginx status                   ║
║    systemctl status mariadb - Check MariaDB status               ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    # Save installation info
    cat > ${INSTALL_DIR}/INSTALLATION_INFO.txt << EOF
Company Portal Installation Information
========================================
Installation Date: $(date)
Website Name: ${SITE_NAME}
Domain: ${DOMAIN_NAME}
Admin Email: ${ADMIN_EMAIL}
Install Directory: ${INSTALL_DIR}
Database: ${DB_NAME}
Database User: ${DB_USER}
API Port: ${API_PORT}

Default Credentials:
- admin@company.com / admin123
- editor@company.com / editor123
- user@company.com / user123

IMPORTANT: Change these passwords immediately after first login!
EOF
    
    chmod 600 ${INSTALL_DIR}/INSTALLATION_INFO.txt
}

# Main installation function
main() {
    check_root
    show_welcome
    collect_config
    
    print_header "Starting Installation"
    
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
    setup_ssl
    setup_pm2
    configure_firewall
    
    show_completion
}

# Run main function
main "$@"
