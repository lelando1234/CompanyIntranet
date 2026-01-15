import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette, RotateCcw } from "lucide-react";

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

const ThemeCustomizer = () => {
  const [colors, setColors] = useState<ColorPalette>({
    primary: "#0080ff",
    secondary: "#10b981",
    accent: "#10b981",
    background: "#ffffff",
    foreground: "#001a33",
  });

  // Apply colors to CSS variables
  const applyColors = (palette: ColorPalette) => {
    const root = document.documentElement;
    
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
    
    root.style.setProperty("--primary", hexToHSL(palette.primary));
    root.style.setProperty("--secondary", hexToHSL(palette.secondary));
    root.style.setProperty("--accent", hexToHSL(palette.accent));
    root.style.setProperty("--background", hexToHSL(palette.background));
    root.style.setProperty("--foreground", hexToHSL(palette.foreground));
    
    // Save to localStorage
    localStorage.setItem("theme-palette", JSON.stringify(palette));
  };

  // Load saved colors on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme-palette");
    if (saved) {
      const palette = JSON.parse(saved);
      setColors(palette);
      applyColors(palette);
    }
  }, []);

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
  };

  const handleApply = () => {
    applyColors(colors);
  };

  const handleReset = () => {
    const defaultColors: ColorPalette = {
      primary: "#0080ff",
      secondary: "#10b981",
      accent: "#10b981",
      background: "#ffffff",
      foreground: "#001a33",
    };
    setColors(defaultColors);
    applyColors(defaultColors);
  };

  const presets = [
    {
      name: "Blue & Green (Default)",
      colors: {
        primary: "#0080ff",
        secondary: "#10b981",
        accent: "#10b981",
        background: "#ffffff",
        foreground: "#001a33",
      },
    },
    {
      name: "Purple & Pink",
      colors: {
        primary: "#9333ea",
        secondary: "#ec4899",
        accent: "#ec4899",
        background: "#ffffff",
        foreground: "#1e1b4b",
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
      },
    },
    {
      name: "Red & Amber",
      colors: {
        primary: "#dc2626",
        secondary: "#f59e0b",
        accent: "#f59e0b",
        background: "#ffffff",
        foreground: "#450a0a",
      },
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setColors(preset.colors);
    applyColors(preset.colors);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Palette Customizer
          </CardTitle>
          <CardDescription>
            Customize your portal's color scheme. Changes are applied immediately and saved to your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="flex-1"
                  placeholder="#0080ff"
                />
              </div>
              <p className="text-xs text-muted-foreground">Main brand color for buttons and links</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => handleColorChange("secondary", e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => handleColorChange("secondary", e.target.value)}
                  className="flex-1"
                  placeholder="#10b981"
                />
              </div>
              <p className="text-xs text-muted-foreground">Complementary accent color</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={colors.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="flex-1"
                  placeholder="#10b981"
                />
              </div>
              <p className="text-xs text-muted-foreground">Highlights and secondary elements</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background"
                  type="color"
                  value={colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
              <p className="text-xs text-muted-foreground">Main background color</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foreground">Foreground Color</Label>
              <div className="flex gap-2">
                <Input
                  id="foreground"
                  type="color"
                  value={colors.foreground}
                  onChange={(e) => handleColorChange("foreground", e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.foreground}
                  onChange={(e) => handleColorChange("foreground", e.target.value)}
                  className="flex-1"
                  placeholder="#001a33"
                />
              </div>
              <p className="text-xs text-muted-foreground">Text and icon color</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button onClick={handleApply} className="gap-2">
              <Palette className="h-4 w-4" />
              Apply Colors
            </Button>
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your colors look on various elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button style={{ backgroundColor: colors.primary, color: colors.background }}>
              Primary Button
            </Button>
            <Button style={{ backgroundColor: colors.secondary, color: colors.background }}>
              Secondary Button
            </Button>
            <Button 
              variant="outline" 
              style={{ 
                borderColor: colors.primary, 
                color: colors.primary 
              }}
            >
              Outline Button
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="p-4 rounded-lg border text-center"
              style={{ backgroundColor: colors.primary, color: colors.background }}
            >
              <div className="font-semibold">Primary</div>
              <div className="text-xs opacity-80">{colors.primary}</div>
            </div>
            <div 
              className="p-4 rounded-lg border text-center"
              style={{ backgroundColor: colors.secondary, color: colors.background }}
            >
              <div className="font-semibold">Secondary</div>
              <div className="text-xs opacity-80">{colors.secondary}</div>
            </div>
            <div 
              className="p-4 rounded-lg border text-center"
              style={{ backgroundColor: colors.accent, color: colors.background }}
            >
              <div className="font-semibold">Accent</div>
              <div className="text-xs opacity-80">{colors.accent}</div>
            </div>
            <div 
              className="p-4 rounded-lg border text-center"
              style={{ backgroundColor: colors.background, color: colors.foreground }}
            >
              <div className="font-semibold">Background</div>
              <div className="text-xs opacity-80">{colors.background}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Color Presets</CardTitle>
          <CardDescription>Quick start with pre-made color combinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <Card key={preset.name} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => applyPreset(preset)}>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{preset.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-2">
                    <div 
                      className="h-12 flex-1 rounded" 
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div 
                      className="h-12 flex-1 rounded" 
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                    <div 
                      className="h-12 flex-1 rounded" 
                      style={{ backgroundColor: preset.colors.accent }}
                    />
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
