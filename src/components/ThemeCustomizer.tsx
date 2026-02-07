import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette, RotateCcw, Loader2 } from "lucide-react";
import { settingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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
  articleCardBg: string;
  articleCardBorder: string;
  loginBg1: string;
  loginBg2: string;
  loginCardBorder: string;
  loginButtonBg1: string;
  loginButtonBg2: string;
  loginTitleColor1: string;
  loginTitleColor2: string;
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
  articleCardBg: "#ffffff",
  articleCardBorder: "#e5e7eb",
  loginBg1: "#eff6ff",
  loginBg2: "#dcfce7",
  loginCardBorder: "#bfdbfe",
  loginButtonBg1: "#2563eb",
  loginButtonBg2: "#16a34a",
  loginTitleColor1: "#2563eb",
  loginTitleColor2: "#16a34a",
};

// Helper: get contrast color for text readability
function getContrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "#000000";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

const ThemeCustomizer = () => {
  const { toast } = useToast();
  const [colors, setColors] = useState<ColorPalette>({ ...defaultColors });
  const [saving, setSaving] = useState(false);

  // Convert hex to HSL
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

  // Apply colors to CSS variables and localStorage
  const applyColors = (palette: ColorPalette) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", hexToHSL(palette.primary));
    root.style.setProperty("--secondary", hexToHSL(palette.secondary));
    root.style.setProperty("--accent", hexToHSL(palette.accent));
    root.style.setProperty("--background", hexToHSL(palette.background));
    root.style.setProperty("--foreground", hexToHSL(palette.foreground));
    root.style.setProperty("--header-bg", palette.headerBg);
    root.style.setProperty("--header-text", palette.headerText);
    root.style.setProperty("--sidebar-bg", palette.sidebarBg);
    root.style.setProperty("--sidebar-text", palette.sidebarText);
    root.style.setProperty("--article-card-bg", palette.articleCardBg);
    root.style.setProperty("--article-card-border", palette.articleCardBorder);
    root.style.setProperty("--login-bg-1", palette.loginBg1);
    root.style.setProperty("--login-bg-2", palette.loginBg2);
    root.style.setProperty("--login-card-border", palette.loginCardBorder);
    root.style.setProperty("--login-button-bg-1", palette.loginButtonBg1);
    root.style.setProperty("--login-button-bg-2", palette.loginButtonBg2);
    root.style.setProperty("--login-title-color-1", palette.loginTitleColor1);
    root.style.setProperty("--login-title-color-2", palette.loginTitleColor2);
    localStorage.setItem("theme-palette", JSON.stringify(palette));
  };

  // Load saved colors on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme-palette");
    if (saved) {
      try {
        const palette = JSON.parse(saved);
        const merged = { ...defaultColors, ...palette };
        setColors(merged);
        applyColors(merged);
      } catch { /* use defaults */ }
    }
  }, []);

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    setColors({ ...colors, [key]: value });
  };

  const handleApply = async () => {
    setSaving(true);
    applyColors(colors);
    try {
      await settingsAPI.bulkUpdate({ theme_palette: JSON.stringify(colors) });
      toast({ title: "Success", description: "Theme applied and saved." });
    } catch {
      toast({ title: "Applied Locally", description: "Colors applied. Backend save may have failed." });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setColors({ ...defaultColors });
    applyColors({ ...defaultColors });
  };

  const presets = [
    { name: "Blue & Green (Default)", colors: { ...defaultColors } },
    {
      name: "Purple & Pink",
      colors: {
        ...defaultColors, primary: "#9333ea", secondary: "#ec4899", accent: "#ec4899", foreground: "#1e1b4b",
        headerBg: "#581c87", headerText: "#ffffff", sidebarBg: "#f5f3ff", sidebarText: "#1e1b4b",
        loginBg1: "#f5f3ff", loginBg2: "#fdf2f8", loginCardBorder: "#d8b4fe",
        loginButtonBg1: "#9333ea", loginButtonBg2: "#ec4899", loginTitleColor1: "#9333ea", loginTitleColor2: "#ec4899",
      },
    },
    {
      name: "Orange & Yellow",
      colors: {
        ...defaultColors, primary: "#f97316", secondary: "#eab308", accent: "#eab308", foreground: "#431407",
        headerBg: "#9a3412", headerText: "#ffffff", sidebarBg: "#fff7ed", sidebarText: "#431407",
        loginBg1: "#fff7ed", loginBg2: "#fefce8", loginCardBorder: "#fdba74",
        loginButtonBg1: "#f97316", loginButtonBg2: "#eab308", loginTitleColor1: "#f97316", loginTitleColor2: "#eab308",
      },
    },
    {
      name: "Teal & Cyan",
      colors: {
        ...defaultColors, primary: "#14b8a6", secondary: "#06b6d4", accent: "#06b6d4", foreground: "#042f2e",
        headerBg: "#115e59", headerText: "#ffffff", sidebarBg: "#f0fdfa", sidebarText: "#042f2e",
        loginBg1: "#f0fdfa", loginBg2: "#ecfeff", loginCardBorder: "#5eead4",
        loginButtonBg1: "#14b8a6", loginButtonBg2: "#06b6d4", loginTitleColor1: "#14b8a6", loginTitleColor2: "#06b6d4",
      },
    },
    {
      name: "Dark Professional",
      colors: {
        ...defaultColors, primary: "#3b82f6", secondary: "#6366f1", accent: "#8b5cf6",
        foreground: "#e2e8f0", background: "#0f172a",
        headerBg: "#1e293b", headerText: "#e2e8f0", sidebarBg: "#1e293b", sidebarText: "#e2e8f0",
        articleCardBg: "#1e293b", articleCardBorder: "#334155",
        loginBg1: "#0f172a", loginBg2: "#1e293b", loginCardBorder: "#334155",
        loginButtonBg1: "#3b82f6", loginButtonBg2: "#6366f1", loginTitleColor1: "#60a5fa", loginTitleColor2: "#818cf8",
      },
    },
  ];

  const applyPreset = (preset: (typeof presets)[0]) => {
    setColors(preset.colors as ColorPalette);
    applyColors(preset.colors as ColorPalette);
  };

  const ColorInput = ({ id, label, description, colorKey }: { id: string; label: string; description: string; colorKey: keyof ColorPalette }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} type="color" value={colors[colorKey]} onChange={(e) => handleColorChange(colorKey, e.target.value)} className="h-10 w-20 cursor-pointer" />
        <Input type="text" value={colors[colorKey]} onChange={(e) => handleColorChange(colorKey, e.target.value)} className="flex-1" />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Base Color Palette</CardTitle>
          <CardDescription>Customize your portal&apos;s core color scheme.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ColorInput id="primary" label="Primary Color" description="Main brand color for buttons and links" colorKey="primary" />
            <ColorInput id="secondary" label="Secondary Color" description="Complementary accent color" colorKey="secondary" />
            <ColorInput id="accent" label="Accent Color" description="Highlights and secondary elements" colorKey="accent" />
            <ColorInput id="background" label="Background Color" description="Main background color" colorKey="background" />
            <ColorInput id="foreground" label="Foreground Color" description="Text and icon color" colorKey="foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header & Navigation Colors</CardTitle>
          <CardDescription>Customize the top header bar and side panel colors on the Dashboard and Admin pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ColorInput id="headerBg" label="Header Background" description="Background color of the top header bar" colorKey="headerBg" />
            <ColorInput id="headerText" label="Header Text Color" description="Text color in the header" colorKey="headerText" />
            <ColorInput id="sidebarBg" label="Sidebar Background" description="Background color of the Resources/Admin side panel" colorKey="sidebarBg" />
            <ColorInput id="sidebarText" label="Sidebar Text Color" description="Text color in the sidebar" colorKey="sidebarText" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Article Card Colors</CardTitle>
          <CardDescription>Customize the appearance of news article cards on the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorInput id="articleCardBg" label="Card Background" description="Background color of article cards" colorKey="articleCardBg" />
            <ColorInput id="articleCardBorder" label="Card Border Color" description="Border color of article cards" colorKey="articleCardBorder" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Screen Colors</CardTitle>
          <CardDescription>Customize the login page appearance including the gradient background, card, and button colors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ColorInput id="loginBg1" label="Background Gradient Start" description="First color of the login page gradient" colorKey="loginBg1" />
            <ColorInput id="loginBg2" label="Background Gradient End" description="Second color of the login page gradient" colorKey="loginBg2" />
            <ColorInput id="loginCardBorder" label="Card Border Color" description="Login card border color" colorKey="loginCardBorder" />
            <ColorInput id="loginButtonBg1" label="Button Gradient Start" description="Login button gradient start" colorKey="loginButtonBg1" />
            <ColorInput id="loginButtonBg2" label="Button Gradient End" description="Login button gradient end" colorKey="loginButtonBg2" />
            <ColorInput id="loginTitleColor1" label="Title Color Start" description="Portal title gradient start" colorKey="loginTitleColor1" />
            <ColorInput id="loginTitleColor2" label="Title Color End" description="Portal title gradient end" colorKey="loginTitleColor2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleApply} className="gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
          Apply & Save Colors
        </Button>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Preview</CardTitle><CardDescription>See how your colors look on various elements</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button style={{ backgroundColor: colors.primary, color: colors.background }}>Primary Button</Button>
            <Button style={{ backgroundColor: colors.secondary, color: colors.background }}>Secondary Button</Button>
            <Button variant="outline" style={{ borderColor: colors.primary, color: colors.primary, backgroundColor: "transparent" }}>Outline Button</Button>
          </div>
          <div className="rounded-lg overflow-hidden border">
            <div className="p-3 flex items-center gap-4" style={{ backgroundColor: colors.headerBg, color: colors.headerText }}>
              <div className="w-8 h-8 rounded bg-white/20" />
              <span className="font-bold">Header Preview</span>
              <div className="ml-auto flex gap-2">
                <div className="w-16 h-6 rounded" style={{ border: `1px solid ${colors.headerText}40` }} />
              </div>
            </div>
            <div className="flex">
              <div className="w-48 p-3 border-r" style={{ backgroundColor: colors.sidebarBg, color: colors.sidebarText }}>
                <p className="font-semibold mb-2">Sidebar</p>
                <p className="text-sm opacity-70">Resources</p>
                <p className="text-sm opacity-70">Links</p>
              </div>
              <div className="flex-1 p-3" style={{ backgroundColor: colors.background }}>
                <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: colors.articleCardBg, border: `1px solid ${colors.articleCardBorder}`, color: colors.foreground }}>
                  <p className="font-medium">Article Card Preview</p>
                  <p className="text-sm opacity-70">Sample article content...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Primary", color: colors.primary },
              { label: "Secondary", color: colors.secondary },
              { label: "Header", color: colors.headerBg },
              { label: "Sidebar", color: colors.sidebarBg },
              { label: "Article BG", color: colors.articleCardBg },
              { label: "Login BG", color: colors.loginBg1 },
              { label: "Login Btn", color: colors.loginButtonBg1 },
              { label: "Login Title", color: colors.loginTitleColor1 },
            ].map(({ label, color }) => (
              <div key={label} className="p-4 rounded-lg border text-center" style={{ backgroundColor: color, color: getContrastColor(color) }}>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-80">{color}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Color Presets</CardTitle><CardDescription>Quick start with pre-made color combinations</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <Card key={preset.name} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => applyPreset(preset)}>
                <CardHeader className="p-4"><CardTitle className="text-sm">{preset.name}</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-1 mb-2">
                    <div className="h-8 flex-1 rounded" style={{ backgroundColor: preset.colors.primary }} />
                    <div className="h-8 flex-1 rounded" style={{ backgroundColor: preset.colors.secondary }} />
                    <div className="h-8 flex-1 rounded" style={{ backgroundColor: preset.colors.accent }} />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.colors.headerBg }} />
                    <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.colors.sidebarBg }} />
                    <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.colors.loginButtonBg1 }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeCustomizer;
