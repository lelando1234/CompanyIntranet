import { LayoutDashboard, Settings, HelpCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarPanel from "@/components/SidebarPanel";

interface AdminSideNavigationProps {
  logoUrl: string;
  items: { key: string; label: string; icon: LucideIcon; active: boolean }[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onNavigate: (path: string) => void;
  onSelect: (key: string) => void;
  onSettings: () => void;
  onHelp: () => void;
}

export default function AdminSideNavigation({ logoUrl, items, collapsed = false, onToggleCollapse, onClose, onNavigate, onSelect, onSettings, onHelp }: AdminSideNavigationProps) {
  const item = (label: string, Icon: LucideIcon, action: () => void, active = false) => (
    <Button
      variant="ghost"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={`h-auto w-full gap-2 rounded py-1.5 text-sm font-normal ${collapsed ? 'justify-center px-0' : 'justify-start px-3'} ${active ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'hover:bg-secondary hover:text-secondary-foreground'}`}
      onClick={() => { onClose?.(); action(); }}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-current" />
      {!collapsed && <span className="min-w-0 truncate">{label}</span>}
    </Button>
  );

  return (
    <SidebarPanel
      title="Admin sections"
      logoUrl={logoUrl}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onClose={onClose}
      footer={
        <div className="space-y-1 px-3 py-3">
          {item('Settings', Settings, onSettings)}
          {item('Help & Support', HelpCircle, onHelp)}
        </div>
      }
    >
      <nav aria-label="Administration" className="space-y-1 px-3">
        {item('Dashboard', LayoutDashboard, () => onNavigate('/dashboard'))}
        <div className="space-y-1 border-t border-border pt-2 mt-2">
          {items.map(section => (
            <div key={section.key}>
              {item(section.label, section.icon, () => onSelect(section.key), section.active)}
            </div>
          ))}
        </div>
      </nav>
    </SidebarPanel>
  );
}
