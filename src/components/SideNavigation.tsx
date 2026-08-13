import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Link2, Globe, BookOpen, FileText, Briefcase, Heart, Star, Folder, HelpCircle, Settings, Users, Mail, Phone, MapPin, Calendar, Clock, Shield, Zap, Database, Code, Image, Video, Music, Download, Upload, Search, Home, type LucideIcon } from "lucide-react";
import { urlCategoriesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Map icon names from the backend to actual Lucide icon components
const iconMap: Record<string, LucideIcon> = {
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

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  icon_url?: string;
}

interface LinkCategory {
  id: string;
  name: string;
  icon?: string;
  links: LinkItem[];
}

interface SideNavigationProps {
  categories?: LinkCategory[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideNavigation = ({
  categories: propCategories,
  collapsed = false,
  onToggleCollapse = () => {},
}: SideNavigationProps) => {
  const [apiCategories, setApiCategories] = useState<LinkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch categories from API (filtered by user's groups)
  useEffect(() => {
    if (propCategories) {
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        // Get user's group IDs for filtering
        const userGroupIds = user?.groups?.map(g => g.id) || [];
        
        const result = await urlCategoriesAPI.getAll({
          filterByUser: true,
          userGroups: userGroupIds
        });
        if (result.success && result.data) {
          const mapped: LinkCategory[] = (result.data as any[]).map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            links: (cat.links || []).map((link: any) => ({
              id: link.id,
              title: link.title,
              url: link.url,
              icon: link.icon,
              icon_url: link.icon_url,
            })),
          }));
          setApiCategories(mapped);
        }
      } catch {
        // Use empty array if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [propCategories, user?.groups]);

  const categories = propCategories || apiCategories;

  useEffect(() => {
    if (!loading) {
      setOpenCategoryIds(categories.map((category) => category.id));
    }
  }, [loading, categories]);

  const handleToggleCollapse = () => {
    onToggleCollapse();
  };

  const handleLinkClick = (url: string) => {
    // Add protocol if missing
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    window.open(finalUrl, "_blank");
  };

  return (
    <div
      className={`h-full flex flex-col border-r border-[#e3e1d8] transition-all duration-300 ${collapsed ? "w-16" : "w-[340px]"}`}
      style={{ backgroundColor: 'var(--sidebar-bg, hsl(var(--background)))', color: 'var(--sidebar-text, inherit)' }}
    >
      <div className="flex items-center justify-between px-[22px] pb-3 pt-6">
        {!collapsed && <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Resources</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={`h-7 w-7 rounded text-muted-foreground hover:bg-[#e5eae3] hover:text-[#1b4332] ${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No resource categories available.
          </div>
        ) : collapsed ? (
          <div className="py-2">
            {categories.map((category) => {
              const CategoryIcon = category.icon ? iconMap[category.icon] : null;
              return (
                <div
                  key={category.id}
                  className="flex flex-col items-center py-2"
                >
                  <div
                    className="mb-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-[#e5eae3] text-[#2d5a47]"
                    title={category.name}
                  >
                    {CategoryIcon ? (
                      <CategoryIcon size={16} />
                    ) : (
                      category.name.charAt(0)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={openCategoryIds}
            onValueChange={setOpenCategoryIds}
            className="space-y-1 px-3 py-0"
          >
            {categories.map((category, index) => {
              const CategoryIcon = category.icon ? iconMap[category.icon] : null;
              return (
                <AccordionItem key={category.id} value={category.id} className="border-0">
                  <AccordionTrigger className={`rounded px-3 py-2.5 text-left hover:no-underline hover:bg-[#e5eae3] [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground ${index === 2 ? "bg-[#e5eae3] text-[#1b4332]" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      {CategoryIcon && <CategoryIcon size={16} className="text-[#2d5a47]" />}
                      <span className="min-w-0 text-[13.5px] font-medium">{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 py-1 pl-2">
                      {category.links.map((link) => {
                        const LinkIcon = link.icon ? iconMap[link.icon] : null;
                        return (
                          <Button
                            key={link.id}
                            variant="ghost"
                            className="h-auto w-full justify-start rounded py-1.5 pr-2 text-sm font-normal hover:bg-[#e5eae3]"
                            onClick={() => handleLinkClick(link.url)}
                          >
                            {link.icon_url ? (
                              <img 
                                src={link.icon_url.startsWith('/uploads') ? `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${link.icon_url}` : link.icon_url} 
                                alt="" 
                                className="w-4 h-4 mr-2 flex-shrink-0 object-contain"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : LinkIcon ? (
                              <LinkIcon size={14} className="mr-2 flex-shrink-0" />
                            ) : (
                              <ExternalLink size={14} className="mr-2 flex-shrink-0" />
                            )}
                            <span className="min-w-0 truncate">{link.title}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
};

export default SideNavigation;
