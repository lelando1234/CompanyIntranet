// API Configuration
// In the Tempo canvas environment there is no backend running, so any real fetch will fail.
// Default to an empty base URL and allow the app to gracefully fall back to local/default UI.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

// API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // If no API base URL is configured, treat the backend as unavailable.
  // This prevents noisy "Failed to fetch" errors in environments without the server.
  if (!API_BASE_URL) {
    return { success: false, message: "Backend not configured" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : { success: true };

    if (!response.ok) {
      // Handle 401 - token expired
      if (response.status === 401) {
        setAuthToken(null);
        window.location.href = '/';
      }
      return { success: false, message: data.message || 'Request failed', errors: data.errors };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ============ AUTH API ============

export const authAPI = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    const result = await apiFetch<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    
    if (result.success && result.data?.token) {
      setAuthToken(result.data.token);
    }
    
    return result;
  },

  logout: async () => {
    const result = await apiFetch('/auth/logout', { method: 'POST' });
    setAuthToken(null);
    return result;
  },

  getCurrentUser: () => apiFetch<any>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  refreshToken: () => apiFetch<{ token: string }>('/auth/refresh', { method: 'POST' }),
};

// ============ USERS API ============

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'user';
  avatar?: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  groups?: { id: string; name: string; color: string }[];
  last_login?: string;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'editor' | 'user';
  department?: string;
  phone?: string;
  groups?: string[];
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: 'admin' | 'editor' | 'user';
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  groups?: string[];
  password?: string;
}

export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ users: User[]; pagination: any }>(`/users${queryString}`);
  },

  getById: (id: string) => apiFetch<User>(`/users/${id}`),

  create: (data: CreateUserData) =>
    apiFetch<{ id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateUserData) =>
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),

  // Current user profile endpoints
  updateProfile: (data: { name?: string; email?: string; department?: string; phone?: string }) =>
    apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  },
};

// ============ GROUPS API ============

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  member_count?: number;
  permissions?: string[];
  members?: User[];
  created_at: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
  members?: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  members?: string[];
}

export const groupsAPI = {
  getAll: () => apiFetch<Group[]>('/groups'),

  getById: (id: string) => apiFetch<Group>(`/groups/${id}`),

  create: (data: CreateGroupData) =>
    apiFetch<{ id: string }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateGroupData) =>
    apiFetch(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/groups/${id}`, { method: 'DELETE' }),

  addMember: (groupId: string, userId: string) =>
    apiFetch(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeMember: (groupId: string, userId: string) =>
    apiFetch(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
};

// ============ ARTICLES API ============

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  views: number;
  attachments?: ArticleAttachment[];
  target_groups?: { id: string; name: string }[];
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleAttachment {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  status?: 'draft' | 'published';
  featured_image?: string;
  target_groups?: string[];
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  status?: 'draft' | 'published' | 'archived';
  featured_image?: string;
  target_groups?: string[];
}

export const articlesAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string; status?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ articles: Article[]; pagination: any }>(`/articles${queryString}`);
  },

  getById: (id: string) => apiFetch<Article>(`/articles/${id}`),

  create: (data: CreateArticleData) =>
    apiFetch<{ id: string }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateArticleData) =>
    apiFetch(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/articles/${id}`, { method: 'DELETE' }),

  uploadAttachment: async (articleId: string, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  },

  deleteAttachment: (articleId: string, attachmentId: string) =>
    apiFetch(`/articles/${articleId}/attachments/${attachmentId}`, { method: 'DELETE' }),
};

// ============ CATEGORIES API ============

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  article_count?: number;
  created_at: string;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

export const categoriesAPI = {
  getAll: () => apiFetch<Category[]>('/categories'),

  getById: (id: string) => apiFetch<Category>(`/categories/${id}`),

  create: (data: CreateCategoryData) =>
    apiFetch<{ id: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateCategoryData) =>
    apiFetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

// ============ URL CATEGORIES API ============

export interface URLLink {
  id: string;
  category_id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_external: boolean;
  created_at: string;
}

export interface URLCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  sort_order: number;
  links?: URLLink[];
  target_groups?: { id: string; name: string; color?: string }[];
  created_at: string;
}

export interface CreateURLCategoryData {
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  target_groups?: string[];
}

export interface CreateURLLinkData {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_external?: boolean;
}

export const urlCategoriesAPI = {
  getAll: (params?: { filterByUser?: boolean; userGroups?: string[] }) => {
    const queryParams = new URLSearchParams();
    if (params?.filterByUser) {
      queryParams.set('filterByUser', 'true');
      if (params?.userGroups) {
        queryParams.set('userGroups', JSON.stringify(params.userGroups));
      }
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiFetch<URLCategory[]>(`/url-categories${queryString}`);
  },

  getById: (id: string) => apiFetch<URLCategory>(`/url-categories/${id}`),

  create: (data: CreateURLCategoryData) =>
    apiFetch<{ id: string }>('/url-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateURLCategoryData>) =>
    apiFetch(`/url-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/url-categories/${id}`, { method: 'DELETE' }),

  // Links
  createLink: (categoryId: string, data: CreateURLLinkData) =>
    apiFetch<{ id: string }>(`/url-categories/${categoryId}/links`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLink: (categoryId: string, linkId: string, data: Partial<CreateURLLinkData>) =>
    apiFetch(`/url-categories/${categoryId}/links/${linkId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLink: (categoryId: string, linkId: string) =>
    apiFetch(`/url-categories/${categoryId}/links/${linkId}`, { method: 'DELETE' }),
};

// ============ SETTINGS API ============

export interface ThemeSettings {
  id?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_type: 'solid' | 'gradient' | 'image';
  background_value: string;
  logo_url?: string;
  logo_size?: number;
  favicon_url?: string;
}

export const settingsAPI = {
  getAll: () => apiFetch<Record<string, any>>('/settings'),

  get: (key: string) => apiFetch<{ key: string; value: any; type: string }>(`/settings/${key}`),

  update: (key: string, value: any, type?: string) =>
    apiFetch(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, type }),
    }),

  bulkUpdate: (settings: Record<string, any>) =>
    apiFetch('/settings/bulk', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    }),

  // Theme
  getTheme: () => apiFetch<ThemeSettings>('/settings/theme/active'),

  updateTheme: (data: Partial<ThemeSettings>) =>
    apiFetch('/settings/theme/active', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadLogo: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${API_BASE_URL}/settings/upload/logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  },

  uploadFavicon: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('favicon', file);

    const response = await fetch(`${API_BASE_URL}/settings/upload/favicon`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  },

  // Audit log
  getAuditLog: (params?: { page?: number; limit?: number; action?: string; user_id?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<{ logs: any[]; pagination: any }>(`/settings/audit/log${queryString}`);
  },
};

// ============ HEALTH CHECK ============

export const healthCheck = () => apiFetch<{ status: string; timestamp: string }>('/health');

// ============ NOTIFICATIONS API ============

export const notificationsAPI = {
  getReadIds: () => apiFetch<string[]>('/notifications/read'),

  markAsRead: (articleId: string) =>
    apiFetch('/notifications/read/' + articleId, { method: 'POST' }),

  markAllRead: (articleIds: string[]) =>
    apiFetch('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),
};

// ============ USER PREFERENCES API ============
// Per-user persistent preferences (stored in DB, works across browsers)

export const preferencesAPI = {
  getAll: () => apiFetch<Record<string, any>>('/preferences'),

  get: (key: string) => apiFetch<any>(`/preferences/${key}`),

  set: (key: string, value: any) =>
    apiFetch(`/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  bulkSet: (preferences: Record<string, any>) =>
    apiFetch('/preferences/bulk', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }),
};

// ============ FAQs API ============

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFAQData {
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
  is_active?: boolean;
}

// ============ FAQs API ============

export const faqsAPI = {
  getAll: (params?: { category?: string; active_only?: boolean }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<FAQ[]>(`/faqs${queryString}`);
  },

  getById: (id: string) => apiFetch<FAQ>(`/faqs/${id}`),

  create: (data: CreateFAQData) =>
    apiFetch<{ id: string }>('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateFAQData>) =>
    apiFetch(`/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/faqs/${id}`, { method: 'DELETE' }),
};

export default {
  auth: authAPI,
  users: usersAPI,
  groups: groupsAPI,
  articles: articlesAPI,
  categories: categoriesAPI,
  urlCategories: urlCategoriesAPI,
  settings: settingsAPI,
  notifications: notificationsAPI,
  preferences: preferencesAPI,
  faqs: faqsAPI,
  healthCheck,
};
