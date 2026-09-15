import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function resolveUploadUrl(url: string = "") {
  if (!url.startsWith("/uploads/")) return url;
  const backendUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
  return `${backendUrl}${url}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
