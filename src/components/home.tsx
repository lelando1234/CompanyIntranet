import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertCircle, Loader2, WifiOff, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authAPI, settingsAPI } from "@/lib/api";

function Home() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, backendAvailable } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalName, setPortalName] = useState("Company Portal");
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");
  
  // Forgot password state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  // Load portal name from document title (already set by SettingsLoader in App.tsx)
  // This avoids a duplicate API call that contributes to rate limiting
  useEffect(() => {
    const currentTitle = document.title;
    if (currentTitle && currentTitle !== 'Vite + React + TS' && currentTitle !== 'Vite App') {
      setPortalName(currentTitle);
    }
  }, []);

  // Load logo from settings
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.logo_url) setLogoUrl(result.data.logo_url);
          if (result.data.site_name) setPortalName(result.data.site_name);
        }
      } catch { /* use defaults */ }
    };
    loadLogo();
  }, []);

  // Load theme colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme-palette");
    if (saved) {
      try {
        const palette = JSON.parse(saved);
        const root = document.documentElement;
        if (palette.loginBg1) root.style.setProperty("--login-bg-1", palette.loginBg1);
        if (palette.loginBg2) root.style.setProperty("--login-bg-2", palette.loginBg2);
        if (palette.loginCardBorder) root.style.setProperty("--login-card-border", palette.loginCardBorder);
        if (palette.loginButtonBg1) root.style.setProperty("--login-button-bg-1", palette.loginButtonBg1);
        if (palette.loginButtonBg2) root.style.setProperty("--login-button-bg-2", palette.loginButtonBg2);
        if (palette.loginTitleColor1) root.style.setProperty("--login-title-color-1", palette.loginTitleColor1);
        if (palette.loginTitleColor2) root.style.setProperty("--login-title-color-2", palette.loginTitleColor2);
      } catch { /* ignore */ }
    }
  }, []);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSubmitting(true);

    try {
      const result = await authAPI.forgotPassword(forgotPasswordEmail);
      if (result.success) {
        setForgotPasswordSent(true);
      } else {
        setForgotPasswordError(result.message || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      setForgotPasswordError("An error occurred. Please try again.");
    } finally {
      setForgotPasswordSubmitting(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setIsForgotPasswordOpen(false);
    setForgotPasswordEmail("");
    setForgotPasswordError("");
    setForgotPasswordSent(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom right, var(--login-bg-1, #eff6ff), var(--login-bg-2, #dcfce7), var(--login-bg-1, #eff6ff))`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  background: `linear-gradient(to right, var(--login-button-bg-1, #60a5fa), var(--login-button-bg-2, #4ade80))`,
                }}
              />
              <img
                src={logoUrl}
                alt="Company Logo"
                className="h-20 w-auto relative"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
          <h1
            className="text-4xl font-bold bg-clip-text text-transparent mb-2"
            style={{
              backgroundImage: `linear-gradient(to right, var(--login-title-color-1, #2563eb), var(--login-title-color-2, #16a34a))`,
            }}
          >
            {portalName}
          </h1>
          <p className="text-gray-600">
            Sign in to access your portal
          </p>
        </div>

        {/* Backend Status Warning */}
        {!backendAvailable && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend server is not reachable.</strong> Login requires a running backend.
              Check that the server is running at {import.meta.env.VITE_API_URL || "http://localhost:3001/api"}.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card
          className="shadow-xl"
          style={{ borderColor: 'var(--login-card-border, #bfdbfe)' }}
        >
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm px-0 h-auto font-normal"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{
                  background: `linear-gradient(to right, var(--login-button-bg-1, #2563eb), var(--login-button-bg-2, #16a34a))`,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Enter Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={closeForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordSent 
                ? "Check your email for password reset instructions."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </DialogDescription>
          </DialogHeader>

          {forgotPasswordSent ? (
            <div className="py-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                If an account exists with <strong>{forgotPasswordEmail}</strong>, you will receive a password reset email shortly.
              </p>
              <Button onClick={closeForgotPasswordDialog} className="w-full">
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="space-y-4 py-4">
                {forgotPasswordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{forgotPasswordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email Address</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="you@company.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    disabled={forgotPasswordSubmitting}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForgotPasswordDialog}
                  disabled={forgotPasswordSubmitting}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={forgotPasswordSubmitting || !forgotPasswordEmail}
                  className="w-full sm:w-auto"
                  style={{
                    background: `linear-gradient(to right, var(--login-button-bg-1, #2563eb), var(--login-button-bg-2, #16a34a))`,
                  }}
                >
                  {forgotPasswordSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;
