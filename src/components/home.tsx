import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [adminEmail, setAdminEmail] = useState("admin@company.com");
  const [loginHeroTitle, setLoginHeroTitle] = useState("Everything the depots run on, in one place.");
  const [loginHeroSubtitle, setLoginHeroSubtitle] = useState("Sign in to reach fleet, ERP, and support tools across all Darling Romery sites.");

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  useEffect(() => {
    const currentTitle = document.title;
    if (currentTitle && currentTitle !== "Vite + React + TS" && currentTitle !== "Vite App") {
      setPortalName(currentTitle);
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.logo_url) setLogoUrl(result.data.logo_url);
          if (result.data.site_name) setPortalName(result.data.site_name);
          if (result.data.admin_email) setAdminEmail(result.data.admin_email);
          if (result.data.login_hero_title) setLoginHeroTitle(result.data.login_hero_title);
          if (result.data.login_hero_subtitle) setLoginHeroSubtitle(result.data.login_hero_subtitle);
        }
      } catch {
        // Use defaults if settings are unavailable.
      }
    };
    loadSettings();
  }, []);

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
    } catch {
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
    } catch {
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#1c1c1a] antialiased">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className="relative flex min-h-[260px] flex-none flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1b4332] to-[#14302b] px-8 py-9 text-[#f5f4ef] lg:min-h-screen lg:basis-[46%] lg:px-16 lg:py-14">
          <div className="relative z-10 mx-auto flex w-full max-w-[380px] flex-1 flex-col items-center justify-center text-center">
            <img
              src="/login-logo.png"
              alt="Company Logo"
              className="mb-6 h-[88px] w-auto object-contain lg:mb-9 lg:h-[150px]"
              onError={(e) => {
                e.currentTarget.src = logoUrl;
              }}
            />
            <div className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#7c9885] before:block before:h-px before:w-6 before:bg-[#7c9885]">
              {portalName}
            </div>
            <h1 className="mb-4 max-w-[380px] font-serif text-[26px] font-medium leading-[1.18] text-[#f5f4ef] lg:text-[38px]">
              {loginHeroTitle}
            </h1>
            <p className="hidden max-w-[320px] text-[14.5px] leading-[1.65] text-[#f5f4ef]/60 lg:block">
              {loginHeroSubtitle}
            </p>
          </div>

          <div className="relative z-10 hidden w-full items-end justify-between self-end font-mono text-[11px] uppercase tracking-[0.08em] text-[#f5f4ef]/40 lg:flex">
            <span>Est. 1991 - Darling, Western Cape</span>
            <span>V.2026</span>
          </div>

          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[120px] w-full opacity-90 lg:h-[220px]"
            viewBox="0 0 600 220"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0,140 C120,120 180,160 300,150 C420,140 480,170 600,150" stroke="rgba(245,244,239,0.09)" strokeWidth="1" fill="none" />
            <path d="M0,170 C120,155 180,185 300,178 C420,170 480,190 600,178" stroke="rgba(245,244,239,0.09)" strokeWidth="1" fill="none" />
            <path d="M0,110 C130,85 170,130 300,118 C430,106 470,140 600,120" stroke="rgba(200,214,196,0.28)" strokeWidth="1" fill="none" />
          </svg>
        </section>

        <section className="flex flex-1 items-center justify-center bg-white px-6 py-8 lg:basis-[54%] lg:p-10">
          <div className="w-full max-w-[380px]">
            <div className="mb-9">
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6b6f66]">
                Sign in
              </div>
              <h2 className="mb-2 font-serif text-[28px] font-medium text-[#14302b]">
                Welcome back
              </h2>
              <p className="text-[13.5px] leading-normal text-[#6b6f66]">
                Enter your company credentials to continue.
              </p>
            </div>

            {!backendAvailable && (
              <Alert variant="destructive" className="mb-5">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>Backend server is not reachable.</strong> Login requires a running backend.
                  Check that the server is running at {import.meta.env.VITE_API_URL || "http://localhost:3001/api"}.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-5">
                <Label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-[0.02em] text-[#1c1c1a]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@darlingromery.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="username"
                  className="h-auto rounded border-[#e3e1d8] bg-[#fdfdfb] px-3.5 py-3 text-sm text-[#1c1c1a] shadow-none placeholder:text-[#a8a79c] hover:border-[#c9c7ba] focus-visible:ring-[#2d5a47]/15"
                />
              </div>

              <div className="mb-5">
                <Label htmlFor="password" className="mb-2 block text-xs font-semibold tracking-[0.02em] text-[#1c1c1a]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className="h-auto rounded border-[#e3e1d8] bg-[#fdfdfb] px-3.5 py-3 text-sm text-[#1c1c1a] shadow-none placeholder:text-[#a8a79c] hover:border-[#c9c7ba] focus-visible:ring-[#2d5a47]/15"
                />
              </div>

              <div className="mb-[26px] flex items-center justify-between text-[13px]">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded-sm border-[#a8a79c] data-[state=checked]:border-[#2d5a47] data-[state=checked]:bg-[#2d5a47]"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="cursor-pointer text-[13px] font-normal text-[#6b6f66]"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-[13px] font-medium text-[#2d5a47] hover:text-[#2d5a47]"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="h-auto w-full rounded bg-[#1b4332] p-[13px] text-sm font-semibold tracking-[0.01em] text-[#f5f4ef] hover:bg-[#2d5a47]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Enter portal <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-9 text-center text-[12.5px] text-[#6b6f66]">
              Trouble signing in?{" "}
              <a className="font-medium text-[#2d5a47] hover:underline" href={`mailto:${adminEmail}`}>
                Contact IT support
              </a>
            </p>
          </div>
        </section>
      </div>

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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
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
                    placeholder="you@darlingromery.co.za"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    disabled={forgotPasswordSubmitting}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
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
                  className="w-full bg-[#1b4332] hover:bg-[#2d5a47] sm:w-auto"
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
