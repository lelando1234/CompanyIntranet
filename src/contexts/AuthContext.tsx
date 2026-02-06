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
  backendAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const available = await checkBackendAvailable();
      setBackendAvailable(available);

      if (available) {
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
      }
      // If backend is NOT available, user stays null = not authenticated
      // No more fallback mock auth
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      const result = await authAPI.login(email, password, rememberMe);
      if (result.success && result.data) {
        setUser(result.data.user);
        setBackendAvailable(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setAuthToken(null);
  };

  const refreshUser = async () => {
    if (getAuthToken()) {
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
        backendAvailable,
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
