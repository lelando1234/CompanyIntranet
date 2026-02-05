import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, setAuthToken, getAuthToken } from "@/lib/api";

export type UserRole = "admin" | "editor" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
  status?: string;
  groups?: { id: string; name: string; color: string }[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback mock users for when backend is not available
const mockUsers: (User & { password: string })[] = [
  { id: "1", email: "admin@company.com", password: "admin123", name: "Admin User", role: "admin" },
  { id: "2", email: "editor@company.com", password: "editor123", name: "Editor User", role: "editor" },
  { id: "3", email: "user@company.com", password: "user123", name: "Regular User", role: "user" },
];

// Check if backend is available
const checkBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check if backend is available
      const backendAvailable = await checkBackendAvailable();
      setUseBackend(backendAvailable);

      if (backendAvailable) {
        // Try to get user from backend using stored token
        const token = getAuthToken();
        if (token) {
          try {
            const result = await authAPI.getCurrentUser();
            if (result.success && result.data) {
              setUser(result.data);
            } else {
              setAuthToken(null);
            }
          } catch {
            setAuthToken(null);
          }
        }
      } else {
        // Fallback to localStorage for mock auth
        const storedUser = localStorage.getItem("portal_user") || sessionStorage.getItem("portal_user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem("portal_user");
            sessionStorage.removeItem("portal_user");
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    if (useBackend) {
      try {
        const result = await authAPI.login(email, password, rememberMe);
        if (result.success && result.data) {
          setUser(result.data.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login error:', error);
        // Fallback to mock auth if backend fails
        return fallbackLogin(email, password, rememberMe);
      }
    } else {
      return fallbackLogin(email, password, rememberMe);
    }
  };

  const fallbackLogin = (email: string, password: string, rememberMe: boolean): boolean => {
    const foundUser = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("portal_user", JSON.stringify(userWithoutPassword));
      
      return true;
    }
    
    return false;
  };

  const logout = async () => {
    if (useBackend) {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("portal_user");
    sessionStorage.removeItem("portal_user");
  };

  const refreshUser = async () => {
    if (useBackend && getAuthToken()) {
      try {
        const result = await authAPI.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error('Refresh user error:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
