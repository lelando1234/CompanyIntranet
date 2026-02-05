import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "editor" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes
const mockUsers: (User & { password: string })[] = [
  { id: "1", email: "admin@company.com", password: "admin123", name: "Admin User", role: "admin" },
  { id: "2", email: "editor@company.com", password: "editor123", name: "Editor User", role: "editor" },
  { id: "3", email: "user@company.com", password: "user123", name: "Regular User", role: "user" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
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
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    // Simulate API call
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("portal_user");
    sessionStorage.removeItem("portal_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
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
