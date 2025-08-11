// Database connection and query utilities
// This would typically connect to Supabase or another database service

import {
  User,
  Group,
  NewsArticle,
  URLCategory,
  URL,
  URLPermission,
} from "@/types/database";

// Mock database service - replace with actual database connection
class DatabaseService {
  // Users
  async getUsers(): Promise<User[]> {
    // Mock implementation - replace with actual database query
    return [
      {
        id: "1",
        email: "admin@company.com",
        name: "Admin User",
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
      {
        id: "2",
        email: "editor@company.com",
        name: "Editor User",
        role: "editor",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
    ];
  }

  async createUser(
    userData: Omit<User, "id" | "created_at" | "updated_at">,
  ): Promise<User> {
    // Mock implementation
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData,
    };
    return newUser;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return [
      {
        id: "1",
        name: "HR",
        description: "Human Resources Department",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Engineering",
        description: "Engineering Team",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // News Articles
  async getNewsArticles(published?: boolean): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [
      {
        id: "1",
        title: "Company Quarterly Results",
        content: "Our company has exceeded quarterly expectations...",
        preview_text:
          "Our company has exceeded quarterly expectations with a 15% growth...",
        author_id: "1",
        category: "Finance",
        published: true,
        featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "New Office Opening",
        content: "We are excited to announce the opening of our new office...",
        preview_text:
          "We are excited to announce the opening of our new office in Chicago...",
        author_id: "1",
        category: "Announcements",
        published: true,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      },
    ];

    if (published !== undefined) {
      return articles.filter((article) => article.published === published);
    }
    return articles;
  }

  async createNewsArticle(
    articleData: Omit<NewsArticle, "id" | "created_at" | "updated_at">,
  ): Promise<NewsArticle> {
    const newArticle: NewsArticle = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...articleData,
    };
    return newArticle;
  }

  // URL Categories
  async getURLCategories(): Promise<URLCategory[]> {
    return [
      {
        id: "1",
        name: "Human Resources",
        description: "HR related resources and tools",
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "IT Resources",
        description: "IT support and technical resources",
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // URLs
  async getURLs(): Promise<URL[]> {
    return [
      {
        id: "1",
        title: "Employee Handbook",
        url: "https://internal.company.com/hr/handbook",
        category_id: "1",
        access_type: "public",
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "HR Portal",
        url: "https://internal.company.com/hr/portal",
        category_id: "1",
        access_type: "restricted",
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // URL Permissions
  async getURLPermissions(urlId?: string): Promise<URLPermission[]> {
    const permissions: URLPermission[] = [
      {
        id: "1",
        url_id: "2",
        entity_type: "group",
        entity_id: "1",
        created_at: new Date().toISOString(),
      },
    ];

    if (urlId) {
      return permissions.filter((permission) => permission.url_id === urlId);
    }
    return permissions;
  }

  async createURLPermission(
    permissionData: Omit<URLPermission, "id" | "created_at">,
  ): Promise<URLPermission> {
    const newPermission: URLPermission = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      ...permissionData,
    };
    return newPermission;
  }

  async deleteURLPermission(permissionId: string): Promise<void> {
    // Mock implementation - would delete from database
    console.log(`Deleting permission ${permissionId}`);
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Database setup instructions
export const DATABASE_SETUP_INSTRUCTIONS = `
# Database Setup Instructions

## Option 1: Supabase (Recommended)
1. Go to https://supabase.com and create a new project
2. In the SQL Editor, run the schema from src/types/database.ts
3. Get your project URL and anon key from Settings > API
4. Add environment variables:
   - VITE_SUPABASE_URL=your_project_url
   - VITE_SUPABASE_ANON_KEY=your_anon_key

## Option 2: PostgreSQL
1. Install PostgreSQL locally or use a cloud provider
2. Create a new database for the project
3. Run the schema from src/types/database.ts
4. Add environment variables:
   - DATABASE_URL=postgresql://username:password@localhost:5432/database_name

## Option 3: SQLite (Development)
1. Install sqlite3
2. Create a new database file
3. Run the schema (adapted for SQLite syntax)

## Next Steps
1. Replace the mock DatabaseService with actual database queries
2. Implement authentication and authorization
3. Add data validation and error handling
4. Set up database migrations for schema changes
`;
