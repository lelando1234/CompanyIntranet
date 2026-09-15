import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { type URLCategory } from "@/lib/api";
import { resourceIconMap as iconMap, resourceHref } from "@/lib/resources";

import ResourceIcon from "@/components/ResourceIcon";

interface SideNavigationProps {
  logoUrl?: string;
  categories: URLCategory[];
  loading?: boolean;
  error?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  footer?: React.ReactNode;
}

const SideNavigation = ({
  logoUrl,
  categories,
  loading = false,
  error,
  collapsed = false,
  onToggleCollapse = () => {},
  onClose,
  footer,
}: SideNavigationProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const hasFooter = React.Children.toArray(footer).some(child => child !== '');
  useLayoutEffect(() => {
    const updateInsets = () => {
      sidebarRef.current?.style.setProperty('--sidebar-header-height', `${headerRef.current?.offsetHeight || 0}px`);
      sidebarRef.current?.style.setProperty('--sidebar-footer-height', `${footerRef.current?.offsetHeight || 0}px`);
    };
    const observer = new ResizeObserver(updateInsets);
    if (headerRef.current) observer.observe(headerRef.current);
    if (footerRef.current) observer.observe(footerRef.current);
    updateInsets();
    return () => observer.disconnect();
  }, [hasFooter]);
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  useEffect(() => {
    setOpenCategoryIds(categories.map(category => category.id));
  }, [categories]);

  const handleToggleCollapse = () => {
    onToggleCollapse();
  };

  return (
    <div
      ref={sidebarRef}
      className={`resource-sidebar relative h-full min-h-0 flex select-none flex-col overflow-hidden border-border transition-all duration-300 ${onClose ? "w-full" : collapsed ? "w-16 border-r" : "w-[340px] border-r"}`}
      style={{ backgroundColor: 'var(--sidebar-bg, hsl(var(--background)))', color: 'var(--sidebar-text, inherit)' }}
    >
      <div ref={headerRef} className="resource-sidebar-glass relative z-10 shrink-0" style={onClose ? { paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' } : undefined}>
      {logoUrl && !collapsed && (
        <div className="p-[11px]">
          <div className="flex items-center justify-center rounded-md">
            <img
              src={logoUrl}
              alt="Company Logo"
              className="header-logo"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-[22px] py-3">
        {!collapsed && <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Resources</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose || handleToggleCollapse}
          aria-label={onClose ? 'Close resources menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`h-7 w-7 rounded text-muted-foreground hover:bg-secondary hover:text-secondary-foreground ${collapsed ? "mx-auto" : ""}`}
        >
          {onClose ? <X size={18} /> : collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      </div>

      <ScrollArea className="inset-0 [&>[data-orientation=vertical]]:hidden" style={{ position: 'absolute' }}>
        <div style={{ paddingTop: 'var(--sidebar-header-height)', paddingBottom: onClose ? 'calc(var(--sidebar-footer-height) + env(safe-area-inset-bottom))' : 'var(--sidebar-footer-height)', paddingLeft: onClose ? 'env(safe-area-inset-left)' : undefined, paddingRight: onClose ? 'env(safe-area-inset-right)' : undefined }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p role="alert" className="px-4 py-8 text-sm text-muted-foreground">{error}</p>
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
                    className="mb-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground"
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
            {categories.map((category) => {
              const CategoryIcon = category.icon ? iconMap[category.icon] : null;
              return (
                <AccordionItem key={category.id} value={category.id} className="border-0">
                  <AccordionTrigger className={`rounded px-3 py-2.5 text-left hover:no-underline hover:bg-secondary hover:text-secondary-foreground [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-current ${openCategoryIds.includes(category.id) ? "bg-primary text-primary-foreground" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      {CategoryIcon && <CategoryIcon size={16} />}
                      <span className="min-w-0 text-[13.5px] font-medium">{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 py-1 pl-2">
                      {(category.links || []).map((link) => {
                        return (
                          <Button
                            key={link.id}
                            asChild
                            variant="ghost"
                            className="h-auto w-full justify-start gap-2 rounded py-1.5 pr-2 text-sm font-normal hover:bg-secondary hover:text-secondary-foreground"
                          >
                            <a href={resourceHref(link.url)} target="_blank" rel="noopener noreferrer">
                            <ResourceIcon icon={link.icon} iconUrl={link.icon_url} />
                            <span className="min-w-0 truncate">{link.title}</span>
                            </a>
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
        </div>
      </ScrollArea>
      {hasFooter && (
        <div ref={footerRef} className="resource-sidebar-glass relative z-10 mt-auto min-h-8 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SideNavigation;
