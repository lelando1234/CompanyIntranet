import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/components/home";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";
import UserProfile from "@/pages/UserProfile";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { settingsAPI } from "@/lib/api";
import routes from "tempo-routes";

// Load settings & theme on startup
function SettingsLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "0 0% 0%";
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      return `${h} ${s}% ${l}%`;
    };

    const applyPalette = (palette: any) => {
      const root = document.documentElement;
      if (palette.primary) root.style.setProperty("--primary", hexToHSL(palette.primary));
      if (palette.secondary) root.style.setProperty("--secondary", hexToHSL(palette.secondary));
      if (palette.accent) root.style.setProperty("--accent", hexToHSL(palette.accent));
      if (palette.background) root.style.setProperty("--background", hexToHSL(palette.background));
      if (palette.foreground) root.style.setProperty("--foreground", hexToHSL(palette.foreground));
      if (palette.headerBg) root.style.setProperty("--header-bg", palette.headerBg);
      if (palette.headerText) root.style.setProperty("--header-text", palette.headerText);
      if (palette.sidebarBg) root.style.setProperty("--sidebar-bg", palette.sidebarBg);
      if (palette.sidebarText) root.style.setProperty("--sidebar-text", palette.sidebarText);
      if (palette.articleCardBg) root.style.setProperty("--article-card-bg", palette.articleCardBg);
      if (palette.articleCardBorder) root.style.setProperty("--article-card-border", palette.articleCardBorder);
      if (palette.loginBg1) root.style.setProperty("--login-bg-1", palette.loginBg1);
      if (palette.loginBg2) root.style.setProperty("--login-bg-2", palette.loginBg2);
      if (palette.loginCardBorder) root.style.setProperty("--login-card-border", palette.loginCardBorder);
      if (palette.loginButtonBg1) root.style.setProperty("--login-button-bg-1", palette.loginButtonBg1);
      if (palette.loginButtonBg2) root.style.setProperty("--login-button-bg-2", palette.loginButtonBg2);
      if (palette.loginTitleColor1) root.style.setProperty("--login-title-color-1", palette.loginTitleColor1);
      if (palette.loginTitleColor2) root.style.setProperty("--login-title-color-2", palette.loginTitleColor2);
    };

    // Load theme from localStorage immediately (instant, no flicker)
    const saved = localStorage.getItem("theme-palette");
    if (saved) {
      try {
        applyPalette(JSON.parse(saved));
      } catch { /* ignore */ }
    }

    // Then load from API (overrides localStorage if available — this is the source of truth)
    const loadFromApi = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.site_name) {
            document.title = result.data.site_name;
          }
          if (result.data.theme_palette) {
            let palette;
            if (typeof result.data.theme_palette === 'string') {
              palette = JSON.parse(result.data.theme_palette);
            } else {
              palette = result.data.theme_palette;
            }
            applyPalette(palette);
            // Sync to localStorage so next load is instant
            localStorage.setItem("theme-palette", JSON.stringify(palette));
          }
        }
      } catch { /* use localStorage / defaults */ }
    };
    loadFromApi();
  }, []);

  return <>{children}</>;
}

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "editor"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </>
  );
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SettingsLoader>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </SettingsLoader>
    </Suspense>
  );
}

export default App;
