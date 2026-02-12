import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { urlCategoriesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

interface LinkCategory {
  id: string;
  name: string;
  links: LinkItem[];
}

interface SideNavigationProps {
  categories?: LinkCategory[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideNavigation = ({
  categories: propCategories,
  isCollapsed = false,
  onToggleCollapse = () => {},
}: SideNavigationProps) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [apiCategories, setApiCategories] = useState<LinkCategory[]>([]);
  const [loading, setLoading] = useState(true);
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
            links: (cat.links || []).map((link: any) => ({
              id: link.id,
              title: link.title,
              url: link.url,
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

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
    onToggleCollapse();
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className={`h-full flex flex-col border-r transition-all duration-300 ${collapsed ? "w-16" : "w-64 md:w-72"}`}
      style={{ backgroundColor: 'var(--sidebar-bg, hsl(var(--background)))', color: 'var(--sidebar-text, inherit)' }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Resources</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={`${collapsed ? "mx-auto" : ""}`}
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
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col items-center py-2"
              >
                <div
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-1 cursor-pointer"
                  title={category.name}
                >
                  {category.name.charAt(0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Accordion type="multiple" className="px-2 py-2">
            {categories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">{category.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-2 py-1 space-y-1">
                    {category.links.map((link) => (
                      <Button
                        key={link.id}
                        variant="ghost"
                        className="w-full justify-start text-sm font-normal py-1.5 h-auto"
                        onClick={() => handleLinkClick(link.url)}
                      >
                        <ExternalLink
                          size={14}
                          className="mr-2 flex-shrink-0"
                        />
                        <span className="truncate">{link.title}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
};

export default SideNavigation;
