import { useState, useEffect, useCallback } from 'react';
import api, {
  User,
  Group,
  Article,
  Category,
  URLCategory,
  CreateUserData,
  UpdateUserData,
  CreateGroupData,
  UpdateGroupData,
  CreateArticleData,
  UpdateArticleData,
  CreateCategoryData,
  CreateURLCategoryData,
  CreateURLLinkData,
  ThemeSettings,
} from '@/lib/api';

// Check if backend is available
const checkBackendAvailable = async (): Promise<boolean> => {
  try {
    const result = await api.healthCheck();
    return result.success;
  } catch {
    return false;
  }
};

// ============ USERS HOOK ============

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchUsers = useCallback(async (params?: { page?: number; search?: string; role?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.users.getAll(params);
      if (result.success && result.data) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: CreateUserData) => {
    const result = await api.users.create(data);
    if (result.success) {
      await fetchUsers();
    }
    return result;
  };

  const updateUser = async (id: string, data: UpdateUserData) => {
    const result = await api.users.update(id, data);
    if (result.success) {
      await fetchUsers();
    }
    return result;
  };

  const deleteUser = async (id: string) => {
    const result = await api.users.delete(id);
    if (result.success) {
      await fetchUsers();
    }
    return result;
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, pagination, fetchUsers, createUser, updateUser, deleteUser };
}

// ============ GROUPS HOOK ============

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.groups.getAll();
      if (result.success && result.data) {
        setGroups(result.data);
      } else {
        setError(result.message || 'Failed to fetch groups');
      }
    } catch (err) {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = async (data: CreateGroupData) => {
    const result = await api.groups.create(data);
    if (result.success) {
      await fetchGroups();
    }
    return result;
  };

  const updateGroup = async (id: string, data: UpdateGroupData) => {
    const result = await api.groups.update(id, data);
    if (result.success) {
      await fetchGroups();
    }
    return result;
  };

  const deleteGroup = async (id: string) => {
    const result = await api.groups.delete(id);
    if (result.success) {
      await fetchGroups();
    }
    return result;
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, fetchGroups, createGroup, updateGroup, deleteGroup };
}

// ============ ARTICLES HOOK ============

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchArticles = useCallback(async (params?: { page?: number; category?: string; search?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.articles.getAll(params);
      if (result.success && result.data) {
        setArticles(result.data.articles);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch articles');
      }
    } catch (err) {
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  const createArticle = async (data: CreateArticleData) => {
    const result = await api.articles.create(data);
    if (result.success) {
      await fetchArticles();
    }
    return result;
  };

  const updateArticle = async (id: string, data: UpdateArticleData) => {
    const result = await api.articles.update(id, data);
    if (result.success) {
      await fetchArticles();
    }
    return result;
  };

  const deleteArticle = async (id: string) => {
    const result = await api.articles.delete(id);
    if (result.success) {
      await fetchArticles();
    }
    return result;
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, pagination, fetchArticles, createArticle, updateArticle, deleteArticle };
}

// ============ CATEGORIES HOOK ============

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.categories.getAll();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        setError(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (data: CreateCategoryData) => {
    const result = await api.categories.create(data);
    if (result.success) {
      await fetchCategories();
    }
    return result;
  };

  const updateCategory = async (id: string, data: Partial<CreateCategoryData>) => {
    const result = await api.categories.update(id, data);
    if (result.success) {
      await fetchCategories();
    }
    return result;
  };

  const deleteCategory = async (id: string) => {
    const result = await api.categories.delete(id);
    if (result.success) {
      await fetchCategories();
    }
    return result;
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory };
}

// ============ URL CATEGORIES HOOK ============

export function useURLCategories() {
  const [urlCategories, setUrlCategories] = useState<URLCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchURLCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.urlCategories.getAll();
      if (result.success && result.data) {
        setUrlCategories(result.data);
      } else {
        setError(result.message || 'Failed to fetch URL categories');
      }
    } catch (err) {
      setError('Failed to fetch URL categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createURLCategory = async (data: CreateURLCategoryData) => {
    const result = await api.urlCategories.create(data);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  const updateURLCategory = async (id: string, data: Partial<CreateURLCategoryData>) => {
    const result = await api.urlCategories.update(id, data);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  const deleteURLCategory = async (id: string) => {
    const result = await api.urlCategories.delete(id);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  const createLink = async (categoryId: string, data: CreateURLLinkData) => {
    const result = await api.urlCategories.createLink(categoryId, data);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  const updateLink = async (categoryId: string, linkId: string, data: Partial<CreateURLLinkData>) => {
    const result = await api.urlCategories.updateLink(categoryId, linkId, data);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  const deleteLink = async (categoryId: string, linkId: string) => {
    const result = await api.urlCategories.deleteLink(categoryId, linkId);
    if (result.success) {
      await fetchURLCategories();
    }
    return result;
  };

  useEffect(() => {
    fetchURLCategories();
  }, [fetchURLCategories]);

  return {
    urlCategories,
    loading,
    error,
    fetchURLCategories,
    createURLCategory,
    updateURLCategory,
    deleteURLCategory,
    createLink,
    updateLink,
    deleteLink,
  };
}

// ============ SETTINGS HOOK ============

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsResult, themeResult] = await Promise.all([
        api.settings.getAll(),
        api.settings.getTheme(),
      ]);

      if (settingsResult.success && settingsResult.data) {
        setSettings(settingsResult.data);
      }
      if (themeResult.success && themeResult.data) {
        setTheme(themeResult.data);
      }
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const result = await api.settings.update(key, value);
    if (result.success) {
      await fetchSettings();
    }
    return result;
  };

  const updateTheme = async (data: Partial<ThemeSettings>) => {
    const result = await api.settings.updateTheme(data);
    if (result.success) {
      await fetchSettings();
    }
    return result;
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, theme, loading, error, fetchSettings, updateSetting, updateTheme };
}

// ============ AUDIT LOG HOOK ============

export function useAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  const fetchLogs = useCallback(async (params?: { page?: number; action?: string; user_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.settings.getAuditLog(params);
      if (result.success && result.data) {
        setLogs(result.data.logs);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch audit log');
      }
    } catch (err) {
      setError('Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, pagination, fetchLogs };
}

// ============ BACKEND STATUS HOOK ============

export function useBackendStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const available = await checkBackendAvailable();
      setIsAvailable(available);
      setChecking(false);
    };
    check();
  }, []);

  return { isAvailable, checking };
}
