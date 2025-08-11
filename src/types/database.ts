// Database Types for Company Portal

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "user";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
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

// Database Schema SQL
export const DATABASE_SCHEMA = `
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Group junction table
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- News articles table
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  preview_text VARCHAR(500),
  author_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(100) NOT NULL,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- URL categories table
CREATE TABLE url_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- URLs table
CREATE TABLE urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES url_categories(id) ON DELETE CASCADE,
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('public', 'restricted')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- URL permissions table
CREATE TABLE url_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('user', 'group')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(url_id, entity_type, entity_id)
);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
INSERT INTO users (email, name, role) VALUES 
  ('admin@company.com', 'Admin User', 'admin'),
  ('editor@company.com', 'Editor User', 'editor'),
  ('user@company.com', 'Regular User', 'user');

INSERT INTO groups (name, description) VALUES 
  ('HR', 'Human Resources Department'),
  ('Engineering', 'Engineering Team'),
  ('Marketing', 'Marketing Department'),
  ('Executive', 'Executive Team');

INSERT INTO url_categories (name, description, sort_order) VALUES 
  ('Human Resources', 'HR related resources and tools', 1),
  ('IT Resources', 'IT support and technical resources', 2),
  ('Finance', 'Financial tools and resources', 3),
  ('Marketing', 'Marketing assets and tools', 4);
`;
