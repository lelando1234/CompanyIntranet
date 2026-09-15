import React, { useLayoutEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarPanelProps {
  title: string;
  logoUrl?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function SidebarPanel({ title, logoUrl, collapsed = false, onToggleCollapse, onClose, footer, children }: SidebarPanelProps) {
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
        <div className={`flex items-center justify-between py-3 ${collapsed ? 'px-3' : 'px-[22px]'}`}>
          {!collapsed && <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose || onToggleCollapse}
            aria-label={onClose ? `Close ${title.toLowerCase()} menu` : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`h-7 w-7 rounded text-muted-foreground hover:bg-secondary hover:text-secondary-foreground ${collapsed ? "mx-auto" : ""}`}
          >
            {onClose ? <X size={18} /> : collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>

      <ScrollArea className="inset-0 [&>[data-orientation=vertical]]:hidden" style={{ position: 'absolute' }}>
        <div style={{ paddingTop: 'var(--sidebar-header-height)', paddingBottom: onClose && !hasFooter ? 'calc(var(--sidebar-footer-height) + env(safe-area-inset-bottom))' : 'var(--sidebar-footer-height)', paddingLeft: onClose ? 'env(safe-area-inset-left)' : undefined, paddingRight: onClose ? 'env(safe-area-inset-right)' : undefined }}>
          {children}
        </div>
      </ScrollArea>
      {hasFooter && (
        <div ref={footerRef} className="resource-sidebar-glass relative z-10 mt-auto min-h-8 shrink-0" style={onClose ? { paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' } : undefined}>
          {footer}
        </div>
      )}
    </div>
  );
}
