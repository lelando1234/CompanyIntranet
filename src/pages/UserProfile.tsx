import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Eye, EyeOff, ChevronDown, Settings, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, usersAPI, preferencesAPI, settingsAPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  sidebarText: string;
}

const defaultColors: ColorPalette = {
  primary: "#0080ff",
  secondary: "#10b981",
  accent: "#10b981",
  background: "#ffffff",
  foreground: "#001a33",
  headerBg: "#ffffff",
  headerText: "#001a33",
  sidebarBg: "#ffffff",
  sidebarText: "#001a33",
};

// Color theme presets
const colorPresets = [
  { 
    name: "Blue & Green (Default)", 
    colors: { ...defaultColors } 
  },
  {
    name: "Purple & Pink",
    colors: {
      primary: "#9333ea",
      secondary: "#ec4899",
      accent: "#ec4899",
      background: "#ffffff",
      foreground: "#1e1b4b",
      headerBg: "#581c87",
      headerText: "#ffffff",
      sidebarBg: "#f5f3ff",
      sidebarText: "#1e1b4b",
    },
  },
  {
    name: "Orange & Yellow",
    colors: {
      primary: "#f97316",
      secondary: "#eab308",
      accent: "#eab308",
      background: "#ffffff",
      foreground: "#431407",
      headerBg: "#9a3412",
      headerText: "#ffffff",
      sidebarBg: "#fff7ed",
      sidebarText: "#431407",
    },
  },
  {
    name: "Teal & Cyan",
    colors: {
      primary: "#14b8a6",
      secondary: "#06b6d4",
      accent: "#06b6d4",
      background: "#ffffff",
      foreground: "#042f2e",
      headerBg: "#115e59",
      headerText: "#ffffff",
      sidebarBg: "#f0fdfa",
      sidebarText: "#042f2e",
    },
  },
  {
    name: "Dark Professional",
    colors: {
      primary: "#3b82f6",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      foreground: "#e2e8f0",
      background: "#0f172a",
      headerBg: "#1e293b",
      headerText: "#e2e8f0",
      sidebarBg: "#1e293b",
      sidebarText: "#e2e8f0",
    },
  },
  {
    name: "Rose & Coral",
    colors: {
      primary: "#f43f5e",
      secondary: "#fb7185",
      accent: "#ff6b9d",
      background: "#ffffff",
      foreground: "#4c0519",
      headerBg: "#9f1239",
      headerText: "#ffffff",
      sidebarBg: "#fff1f2",
      sidebarText: "#4c0519",
    },
  },
  {
    name: "Emerald & Lime",
    colors: {
      primary: "#10b981",
      secondary: "#84cc16",
      accent: "#84cc16",
      background: "#ffffff",
      foreground: "#064e3b",
      headerBg: "#047857",
      headerText: "#ffffff",
      sidebarBg: "#ecfdf5",
      sidebarText: "#064e3b",
    },
  },
  {
    name: "Indigo & Purple",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#a855f7",
      background: "#ffffff",
      foreground: "#312e81",
      headerBg: "#4338ca",
      headerText: "#ffffff",
      sidebarBg: "#eef2ff",
      sidebarText: "#312e81",
    },
  },
  {
    name: "Amber & Red",
    colors: {
      primary: "#f59e0b",
      secondary: "#ef4444",
      accent: "#fb923c",
      background: "#ffffff",
      foreground: "#451a03",
      headerBg: "#b45309",
      headerText: "#ffffff",
      sidebarBg: "#fffbeb",
      sidebarText: "#451a03",
    },
  },
  {
    name: "Sky & Blue",
    colors: {
      primary: "#0ea5e9",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      background: "#ffffff",
      foreground: "#0c4a6e",
      headerBg: "#0369a1",
      headerText: "#ffffff",
      sidebarBg: "#f0f9ff",
      sidebarText: "#0c4a6e",
    },
  },
  {
    name: "Slate & Gray",
    colors: {
      primary: "#475569",
      secondary: "#64748b",
      accent: "#94a3b8",
      foreground: "#e2e8f0",
      background: "#1e293b",
      headerBg: "#334155",
      headerText: "#f1f5f9",
      sidebarBg: "#334155",
      sidebarText: "#f1f5f9",
    },
  },
  {
    name: "Violet & Fuchsia",
    colors: {
      primary: "#7c3aed",
      secondary: "#d946ef",
      accent: "#e879f9",
      background: "#ffffff",
      foreground: "#3b0764",
      headerBg: "#6b21a8",
      headerText: "#ffffff",
      sidebarBg: "#faf5ff",
      sidebarText: "#3b0764",
    },
  },
];

export default function UserProfile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Site settings state
  const [portalName, setPortalName] = useState("Company Portal");
  const [copyrightText, setCopyrightText] = useState("");
  const companyLogo = "/logo.png";

  // Profile picture state
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Color preferences state
  const [colors, setColors] = useState<ColorPalette>({ ...defaultColors });
  const [adminColors, setAdminColors] = useState<ColorPalette>({ ...defaultColors });
  const [savingColors, setSavingColors] = useState(false);
  const [useAdminColors, setUseAdminColors] = useState(true);

  // Email notifications state
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Load user preferences and admin color settings
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.site_name) setPortalName(result.data.site_name);
          if (result.data.copyright_text !== undefined) setCopyrightText(result.data.copyright_text);
        }
      } catch { /* use defaults */ }
    };
    loadSiteSettings();
  }, []);

  // Load user preferences and admin color settings
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load user preferences
        const prefResult = await preferencesAPI.getAll();
        if (prefResult.success && prefResult.data) {
          const userColors = prefResult.data.theme_colors;
          const useAdmin = prefResult.data.use_admin_theme !== false;
          setUseAdminColors(useAdmin);
          
          // Load email notifications preference
          if (prefResult.data.email_notifications_enabled !== undefined) {
            setEmailNotificationsEnabled(prefResult.data.email_notifications_enabled);
          }
          
          if (userColors && typeof userColors === "object") {
            setColors({ ...defaultColors, ...userColors });
          }
        }

        // Load admin theme settings
        const adminTheme = await settingsAPI.getAll();
        if (adminTheme.success && adminTheme.data) {
          const adminPalette: Partial<ColorPalette> = {};
          if (adminTheme.data.theme_primary) adminPalette.primary = adminTheme.data.theme_primary;
          if (adminTheme.data.theme_secondary) adminPalette.secondary = adminTheme.data.theme_secondary;
          if (adminTheme.data.theme_accent) adminPalette.accent = adminTheme.data.theme_accent;
          if (adminTheme.data.theme_background) adminPalette.background = adminTheme.data.theme_background;
          if (adminTheme.data.theme_foreground) adminPalette.foreground = adminTheme.data.theme_foreground;
          if (adminTheme.data.theme_header_bg) adminPalette.headerBg = adminTheme.data.theme_header_bg;
          if (adminTheme.data.theme_header_text) adminPalette.headerText = adminTheme.data.theme_header_text;
          if (adminTheme.data.theme_sidebar_bg) adminPalette.sidebarBg = adminTheme.data.theme_sidebar_bg;
          if (adminTheme.data.theme_sidebar_text) adminPalette.sidebarText = adminTheme.data.theme_sidebar_text;
          
          setAdminColors({ ...defaultColors, ...adminPalette });
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Convert hex to HSL for CSS variables
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

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return;

    setUploadingAvatar(true);
    try {
      const result = await usersAPI.uploadAvatar(avatarFile);

      if (result.success) {
        await refreshUser();
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
        setAvatarFile(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const result = await authAPI.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Save color preferences
  const handleSaveColors = async () => {
    setSavingColors(true);
    try {
      const result = await preferencesAPI.bulkSet({
        theme_colors: colors,
        use_admin_theme: useAdminColors,
      });

      if (result.success) {
        // Apply colors immediately
        const activeColors = useAdminColors ? adminColors : colors;
        const root = document.documentElement;
        root.style.setProperty("--primary", hexToHSL(activeColors.primary));
        root.style.setProperty("--secondary", hexToHSL(activeColors.secondary));
        root.style.setProperty("--accent", hexToHSL(activeColors.accent));
        root.style.setProperty("--background", hexToHSL(activeColors.background));
        root.style.setProperty("--foreground", hexToHSL(activeColors.foreground));
        root.style.setProperty("--header-bg", activeColors.headerBg);
        root.style.setProperty("--header-text", activeColors.headerText);
        root.style.setProperty("--sidebar-bg", activeColors.sidebarBg);
        root.style.setProperty("--sidebar-text", activeColors.sidebarText);

        // Sync to localStorage so theme persists across page navigations
        localStorage.setItem("theme-palette", JSON.stringify(activeColors));

        toast({
          title: "Success",
          description: "Color preferences saved successfully",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save color preferences",
        variant: "destructive",
      });
    } finally {
      setSavingColors(false);
    }
  };

  // Reset to admin colors
  const handleResetToAdmin = () => {
    setUseAdminColors(true);
    setColors({ ...adminColors });
  };

  // Apply a color preset
  const applyPreset = (preset: typeof colorPresets[0]) => {
    setColors(preset.colors as ColorPalette);
    setUseAdminColors(false);
  };

  // Save email notification preference
  const handleSaveEmailNotifications = async () => {
    setSavingNotifications(true);
    try {
      const result = await preferencesAPI.set("email_notifications_enabled", emailNotificationsEnabled);

      if (result.success) {
        toast({
          title: "Success",
          description: "Notification preferences saved successfully",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";
  const canAccessAdmin = user?.role === "admin" || user?.role === "editor";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b shadow-sm" style={{ backgroundColor: 'var(--header-bg, hsl(var(--background)))', color: 'var(--header-text, inherit)' }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={companyLogo} alt="Company Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold hidden md:block">
              {portalName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback>
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{userName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p>{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                {canAccessAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Update your profile picture (max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar} alt={user?.name} />
                  <AvatarFallback className="text-2xl">
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                      Choose Image
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </Label>
                  {avatarFile && (
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        // Clear error when user types
                        if (passwordError) setPasswordError("");
                      }}
                      className={passwordError && confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500 font-medium">{passwordError}</p>
                  )}
                </div>

                <Button type="submit" disabled={changingPassword}>
                  {changingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Email Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Manage your email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">
                    Receive email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new articles, announcements, and updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotificationsEnabled}
                  onCheckedChange={setEmailNotificationsEnabled}
                />
              </div>
              <Button onClick={handleSaveEmailNotifications} disabled={savingNotifications}>
                {savingNotifications && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Color Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle>Color Preferences</CardTitle>
              <CardDescription>
                Customize your personal color theme or use the admin defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant={useAdminColors ? "default" : "outline"}
                  onClick={() => setUseAdminColors(true)}
                >
                  Use Admin Theme
                </Button>
                <Button
                  variant={!useAdminColors ? "default" : "outline"}
                  onClick={() => setUseAdminColors(false)}
                >
                  Custom Theme
                </Button>
              </div>

              {!useAdminColors && (
                <>
                  <Separator />
                  
                  {/* Color Presets */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Color Presets</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Quick start with pre-made color combinations
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {colorPresets.map((preset) => (
                        <Card 
                          key={preset.name} 
                          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                          onClick={() => applyPreset(preset)}
                        >
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm">{preset.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex gap-1 mb-2">
                              <div 
                                className="h-8 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.primary }} 
                              />
                              <div 
                                className="h-8 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.secondary }} 
                              />
                              <div 
                                className="h-8 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.accent }} 
                              />
                            </div>
                            <div className="flex gap-1">
                              <div 
                                className="h-4 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.headerBg }} 
                              />
                              <div 
                                className="h-4 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.sidebarBg }} 
                              />
                              <div 
                                className="h-4 flex-1 rounded" 
                                style={{ backgroundColor: preset.colors.background }} 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Manual Color Customization */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Custom Colors</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fine-tune individual colors to your preference
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color-primary">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-primary"
                          type="color"
                          value={colors.primary}
                          onChange={(e) =>
                            setColors({ ...colors, primary: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.primary}
                          onChange={(e) =>
                            setColors({ ...colors, primary: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-secondary">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-secondary"
                          type="color"
                          value={colors.secondary}
                          onChange={(e) =>
                            setColors({ ...colors, secondary: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.secondary}
                          onChange={(e) =>
                            setColors({ ...colors, secondary: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-accent">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-accent"
                          type="color"
                          value={colors.accent}
                          onChange={(e) =>
                            setColors({ ...colors, accent: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.accent}
                          onChange={(e) =>
                            setColors({ ...colors, accent: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-header-bg">Header Background</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-header-bg"
                          type="color"
                          value={colors.headerBg}
                          onChange={(e) =>
                            setColors({ ...colors, headerBg: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.headerBg}
                          onChange={(e) =>
                            setColors({ ...colors, headerBg: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-sidebar-bg">Sidebar Background</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-sidebar-bg"
                          type="color"
                          value={colors.sidebarBg}
                          onChange={(e) =>
                            setColors({ ...colors, sidebarBg: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.sidebarBg}
                          onChange={(e) =>
                            setColors({ ...colors, sidebarBg: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color-background">Page Background</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-background"
                          type="color"
                          value={colors.background}
                          onChange={(e) =>
                            setColors({ ...colors, background: e.target.value })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={colors.background}
                          onChange={(e) =>
                            setColors({ ...colors, background: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleResetToAdmin}
                    >
                      Reset to Admin Colors
                    </Button>
                  </div>
                </>
              )}

              <Button onClick={handleSaveColors} disabled={savingColors}>
                {savingColors && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Color Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Copyright Footer */}
      {copyrightText && (
        <footer className="mt-8 py-4 border-t">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            {copyrightText}
          </div>
        </footer>
      )}
      </main>
    </div>
  );
}
