import { ExternalLink, Link2, Globe, BookOpen, FileText, Briefcase, Heart, Star, Folder, HelpCircle, Settings, Users, Mail, Phone, MapPin, Calendar, Clock, Shield, Zap, Database, Code, Image, Video, Music, Download, Upload, Search, Home, type LucideIcon } from "lucide-react";
// Map icon names from the backend to actual Lucide icon components
export const resourceIconMap: Record<string, LucideIcon> = {
  Link: Link2,
  Link2: Link2,
  Globe: Globe,
  BookOpen: BookOpen,
  FileText: FileText,
  Briefcase: Briefcase,
  Heart: Heart,
  Star: Star,
  Folder: Folder,
  HelpCircle: HelpCircle,
  Settings: Settings,
  Users: Users,
  Mail: Mail,
  Phone: Phone,
  MapPin: MapPin,
  Calendar: Calendar,
  Clock: Clock,
  Shield: Shield,
  Zap: Zap,
  Database: Database,
  Code: Code,
  Image: Image,
  Video: Video,
  Music: Music,
  Download: Download,
  Upload: Upload,
  Search: Search,
  Home: Home,
  ExternalLink: ExternalLink,
};


export const resourceHref = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

export const resourceIconUrl = (url: string) => url.startsWith('/uploads')
  ? `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}${url}` : url;

