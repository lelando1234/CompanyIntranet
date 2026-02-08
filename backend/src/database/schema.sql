-- Company Portal Database Schema
-- For MariaDB
-- Note: Database creation and USE commands are handled by migrate.js based on environment variables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'user') NOT NULL DEFAULT 'user',
    avatar VARCHAR(500),
    department VARCHAR(100),
    phone VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Groups table
CREATE TABLE IF NOT EXISTS `groups` (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User-Group relationship (many-to-many)
CREATE TABLE IF NOT EXISTS user_groups (
    user_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Group permissions
CREATE TABLE IF NOT EXISTS group_permissions (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_group_permission (group_id, permission),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- News categories
CREATE TABLE IF NOT EXISTS news_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- News articles
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    category_id VARCHAR(36),
    author_id VARCHAR(36) NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    featured_image VARCHAR(500),
    views INT DEFAULT 0,
    published_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    FULLTEXT INDEX idx_search (title, content)
) ENGINE=InnoDB;

-- Article-Group targeting (many-to-many)
CREATE TABLE IF NOT EXISTS article_groups (
    article_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (article_id, group_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Article attachments
CREATE TABLE IF NOT EXISTS article_attachments (
    id VARCHAR(36) PRIMARY KEY,
    article_id VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size INT,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- URL Categories (Resource Links)
CREATE TABLE IF NOT EXISTS url_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Link',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- URL Links
CREATE TABLE IF NOT EXISTS url_links (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_external BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES url_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Portal settings
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value LONGTEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Theme settings
CREATE TABLE IF NOT EXISTS theme_settings (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'default',
    primary_color VARCHAR(20) DEFAULT '#3B82F6',
    secondary_color VARCHAR(20) DEFAULT '#6366F1',
    accent_color VARCHAR(20) DEFAULT '#8B5CF6',
    background_type ENUM('solid', 'gradient', 'image') DEFAULT 'gradient',
    background_value TEXT,
    header_bg VARCHAR(20) DEFAULT '#ffffff',
    header_text VARCHAR(20) DEFAULT '#001a33',
    sidebar_bg VARCHAR(20) DEFAULT '#ffffff',
    sidebar_text VARCHAR(20) DEFAULT '#001a33',
    article_card_bg VARCHAR(20) DEFAULT '#ffffff',
    article_card_border VARCHAR(20) DEFAULT '#e5e7eb',
    login_bg_1 VARCHAR(20) DEFAULT '#eff6ff',
    login_bg_2 VARCHAR(20) DEFAULT '#dcfce7',
    login_card_border VARCHAR(20) DEFAULT '#bfdbfe',
    login_button_bg_1 VARCHAR(20) DEFAULT '#2563eb',
    login_button_bg_2 VARCHAR(20) DEFAULT '#16a34a',
    login_title_color_1 VARCHAR(20) DEFAULT '#2563eb',
    login_title_color_2 VARCHAR(20) DEFAULT '#16a34a',
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    old_value LONGTEXT,
    new_value LONGTEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- User notification read state
CREATE TABLE IF NOT EXISTS user_notification_reads (
    user_id VARCHAR(36) NOT NULL,
    article_id VARCHAR(36) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User theme preferences (per-user override, not used yet; global theme stored in settings)
-- We'll use the settings table with key 'theme_palette' for global theme

-- Sessions table (for persistent sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;
