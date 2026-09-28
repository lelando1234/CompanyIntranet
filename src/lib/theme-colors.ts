import { darlingPortalColors } from "./theme-presets";

// Colour inputs and exported email HTML need a concrete hex value, not a CSS variable.
export function getThemePrimaryHex(): string {
  if (typeof document === "undefined") return darlingPortalColors.primary;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--primary");
  const parts = value.trim().split(/\s+/).map(parseFloat);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return darlingPortalColors.primary;
  const [h, saturation, lightness] = parts;
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

// Email clients do not inherit portal CSS; keep their export palette here.
export const emailColors = {
  foreground: "#333333",
  company: "#444444",
  contact: "#555555",
  title: "#666666",
  address: "#777777",
  muted: "#888888",
  disclaimer: "#999999",
  border: "#e0e0e0",
  onPrimary: "#ffffff",
};

// Helper: get contrast color for text readability
export function getContrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "#000000";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

