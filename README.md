# Company Portal

A modern, feature-rich internal company portal built with React, Node.js, and MariaDB. This application provides a centralized platform for company news, announcements, resource links, and user management.

![Company Portal](https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Admin Panel](#admin-panel)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Company Portal is designed to serve as a central hub for internal company communications. It enables organizations to:

- **Publish and manage company news** - Keep employees informed with categorized news articles
- **Organize resource links** - Provide quick access to internal tools and external resources
- **Manage users and groups** - Control access with role-based permissions
- **Customize branding** - Apply company colors, logos, and themes
- **Track activity** - Audit log for all administrative actions

### Purpose

This portal solves the common challenge of scattered internal communications by providing:

1. **Centralized Information Hub** - One place for all company updates
2. **Role-Based Access Control** - Secure content based on user roles
3. **Easy Content Management** - Rich text editor for creating engaging content
4. **Customizable Interface** - Match your company's branding
5. **Audit Trail** - Track who did what and when

## ✨ Features

### For All Users
- 🔐 Secure authentication with JWT tokens
- 📰 News feed with search, filter, and pagination
- 📎 File attachments on articles
- 🔗 Organized resource links
- 📱 Responsive design for mobile and desktop
- 🌙 Customizable themes and colors

### For Editors
- ✍️ Rich text editor for articles
- 📁 Category management
- 🖼️ Image and file uploads
- 📋 Draft and publish workflow

### For Administrators
- 👥 User management (create, edit, delete)
- 👔 Group management with permissions
- 🎨 Theme customization
- ⚙️ Portal settings
- 📊 Audit log viewing
- 🔗 URL category management

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Lucide React** - Icons
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MariaDB** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation

### Infrastructure
- **Nginx** - Reverse proxy
- **PM2** - Process manager
- **Let's Encrypt** - SSL certificates
- **Adminer** - Database management

## 📦 Prerequisites

- **OS**: Debian 12 (Bookworm) or compatible
- **Node.js**: 20.x or higher
- **MariaDB**: 10.11 or higher
- **Nginx**: 1.22 or higher
- **Domain**: A registered domain name
- **SSL**: Let's Encrypt (automated via installer)

## 🚀 Installation

### Quick Install (Recommended)

The automated installer handles everything:

```bash
# Clone the repository
git clone https://github.com/lelando1234/CompanyIntranet.git
cd company-portal

# Make installer executable
chmod +x install.sh

# Run the installer as root
sudo bash install.sh
```

The installer will:
1. Update system packages
2. Install Node.js 20.x
3. Install and secure MariaDB
4. Create database and user
5. Install Nginx as reverse proxy
6. Configure SSL with Let's Encrypt
7. Install Adminer for database management
8. Setup PM2 for process management
9. Configure firewall rules

### Manual Installation

If you prefer manual installation:

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB
sudo apt install -y mariadb-server mariadb-client

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Setup Database

```bash
# Secure MariaDB
sudo mysql_secure_installation

# Create database and user
sudo mariadb -u root -p << EOF
CREATE DATABASE company_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON company_portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

#### 3. Setup Application

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Seed database
npm run seed

# Build frontend
cd ..
npm run build
```

#### 4. Configure Nginx

Create `/etc/nginx/sites-available/portal.conf` with your configuration (see install.sh for template).

#### 5. Setup SSL

```bash
sudo certbot --nginx -d yourdomain.com
```

#### 6. Start Application

```bash
cd backend
pm2 start src/index.js --name company-portal-api
pm2 save
pm2 startup
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=portal_user
DB_PASSWORD=your_secure_password
DB_NAME=company_portal

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# Session
SESSION_SECRET=your_session_secret

# Uploads
UPLOAD_DIR=./uploads
```

#### Frontend (.env)

```env
VITE_API_URL=https://yourdomain.com/api
VITE_SITE_NAME=Company Portal
```

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/refresh` | Refresh token |

### Users (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Groups (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List all groups |
| GET | `/api/groups/:id` | Get group with members |
| POST | `/api/groups` | Create group |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List articles |
| GET | `/api/articles/:id` | Get article |
| POST | `/api/articles` | Create article (Editor+) |
| PUT | `/api/articles/:id` | Update article (Editor+) |
| DELETE | `/api/articles/:id` | Delete article (Editor+) |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category (Editor+) |
| PUT | `/api/categories/:id` | Update category (Editor+) |
| DELETE | `/api/categories/:id` | Delete category (Editor+) |

### URL Categories & Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/url-categories` | List URL categories with links |
| POST | `/api/url-categories` | Create URL category (Editor+) |
| POST | `/api/url-categories/:id/links` | Create link |
| DELETE | `/api/url-categories/:id/links/:linkId` | Delete link |

### Settings (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings/:key` | Update setting |
| GET | `/api/settings/theme/active` | Get active theme |
| PUT | `/api/settings/theme/active` | Update theme |
| GET | `/api/settings/audit/log` | Get audit log |

## 🗄 Database Schema

### Tables

- **users** - User accounts
- **groups** - User groups
- **user_groups** - User-group relationships
- **group_permissions** - Group permissions
- **news_categories** - Article categories
- **articles** - News articles
- **article_attachments** - File attachments
- **url_categories** - Link categories
- **url_links** - Resource links
- **settings** - Portal settings
- **theme_settings** - Theme configuration
- **audit_log** - Activity tracking
- **sessions** - User sessions

## 👥 User Roles

### Admin
- Full access to all features
- User and group management
- Theme and settings configuration
- Audit log access

### Editor
- Create, edit, delete articles
- Manage categories
- Manage URL links
- Cannot manage users

### User
- View published articles
- View resource links
- Update own profile
- Change password

## 🎛 Admin Panel

The admin panel provides:

- **News Articles Management** - Create/edit/delete articles with rich text editor
- **URL Categories** - Manage resource links organized by category
- **User Management** - Create/edit/delete users with role assignment
- **Groups Management** - Organize users into groups with shared permissions
- **Theme Customization** - Color scheme and appearance settings
- **Settings** - Portal configuration

## 🔧 Troubleshooting

### Database Connection Failed
```bash
sudo systemctl status mariadb
mariadb -u portal_user -p company_portal
```

### Nginx 502 Bad Gateway
```bash
pm2 status
pm2 restart company-portal-api
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

### Logs
```bash
pm2 logs company-portal-api
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updating the Application

Follow these steps to update the Company Portal to the latest version on your server.

### Automatic Update (Recommended)

An update script is included in the project:

```bash
cd /var/www/company-portal
sudo bash scripts/update.sh
```

### Manual Update

#### 1. Backup First

Always backup before updating:

```bash
# Backup database
cd /var/www/company-portal
sudo bash scripts/backup-db.sh

# Backup current files
sudo cp -r /var/www/company-portal /var/www/company-portal.backup.$(date +%Y%m%d)
```

#### 2. Pull Latest Code

```bash
cd /var/www/company-portal
git pull https://github.com/lelando1234/CompanyIntranet.git main
```

Or if you've set up the remote:

```bash
cd /var/www/company-portal
git fetch origin
git pull origin main
```

#### 3. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

#### 4. Run Database Migrations

```bash
cd backend
npm run migrate
cd ..
```

#### 5. Build Frontend

```bash
npm run build
```

#### 6. Restart Backend

```bash
cd backend
pm2 restart company-portal-api
```

#### 7. Verify

```bash
# Check backend status
pm2 status
pm2 logs company-portal-api --lines 20

# Test the API
curl -s http://localhost:3001/api/health

# Check Nginx
sudo systemctl status nginx
```

### Rollback

If something goes wrong:

```bash
# Stop the service
pm2 stop company-portal-api

# Restore backup
sudo rm -rf /var/www/company-portal
sudo cp -r /var/www/company-portal.backup.YYYYMMDD /var/www/company-portal

# Restore database
cd /var/www/company-portal
sudo bash scripts/restore-db.sh /path/to/backup.sql

# Restart
cd backend
pm2 start ecosystem.config.js
```

### Setting Up Git Remote (First Time)

If you haven't configured the remote repository:

```bash
cd /var/www/company-portal
git remote add origin https://github.com/lelando1234/CompanyIntranet.git
git fetch origin
```

After that, you can simply run `git pull origin main` for future updates.

## 📄 Default Credentials

After installation, use these credentials to log in:

- **Admin**: admin@company.com / admin123
- **Editor**: editor@company.com / editor123
- **User**: user@company.com / user123

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

---

**Built with ❤️ for better internal communications**
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
