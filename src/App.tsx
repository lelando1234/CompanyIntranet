import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import routes from "tempo-routes";

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
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Suspense>
  );
}

export default App;
