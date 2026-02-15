// Database Types for Company Portal

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  groups?: { id: string; name: string; color?: string }[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  preview_text: string;
  author_id: string;
  category: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface URLCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface URL {
  id: string;
  title: string;
  url: string;
  description?: string;
  category_id: string;
  access_type: "public" | "restricted";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface URLPermission {
  id: string;
  url_id: string;
  entity_type: "user" | "group";
  entity_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  created_at: string;
}

// Database Schema SQL for MariaDB
export const DATABASE_SCHEMA = `
-- Users table
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'user') NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Groups table
CREATE TABLE groups (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User-Group junction table
CREATE TABLE user_groups (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  group_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- News articles table
CREATE TABLE news_articles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(500) NOT NULL,
  content LONGTEXT NOT NULL,
  preview_text VARCHAR(500),
  author_id CHAR(36) NOT NULL,
  category VARCHAR(100) NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- URL categories table
CREATE TABLE url_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- URLs table
CREATE TABLE urls (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category_id CHAR(36) NOT NULL,
  access_type ENUM('public', 'restricted') NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES url_categories(id) ON DELETE CASCADE
);

-- URL permissions table
CREATE TABLE url_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  url_id CHAR(36) NOT NULL,
  entity_type ENUM('user', 'group') NOT NULL,
  entity_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(url_id, entity_type, entity_id),
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id CHAR(36) NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_news_articles_published ON news_articles(published, published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_urls_category ON urls(category_id);
CREATE INDEX idx_urls_access_type ON urls(access_type);
CREATE INDEX idx_url_permissions_url ON url_permissions(url_id);
CREATE INDEX idx_url_permissions_entity ON url_permissions(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Sample data
INSERT INTO users (id, email, name, role) VALUES 
  (UUID(), 'admin@company.com', 'Admin User', 'admin'),
  (UUID(), 'editor@company.com', 'Editor User', 'editor'),
  (UUID(), 'user@company.com', 'Regular User', 'user');

INSERT INTO groups (id, name, description) VALUES 
  (UUID(), 'HR', 'Human Resources Department'),
  (UUID(), 'Engineering', 'Engineering Team'),
  (UUID(), 'Marketing', 'Marketing Department'),
  (UUID(), 'Executive', 'Executive Team');

INSERT INTO url_categories (id, name, description, sort_order) VALUES 
  (UUID(), 'Human Resources', 'HR related resources and tools', 1),
  (UUID(), 'IT Resources', 'IT support and technical resources', 2),
  (UUID(), 'Finance', 'Financial tools and resources', 3),
  (UUID(), 'Marketing', 'Marketing assets and tools', 4);
`;
