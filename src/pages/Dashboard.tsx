import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, User, ChevronDown, Settings, LogOut, X, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewsFeed from "@/components/NewsFeed";
import SideNavigation from "@/components/SideNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { settingsAPI, articlesAPI, notificationsAPI, type Article } from "@/lib/api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Settings state
  const [portalName, setPortalName] = useState("Company Portal");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to the Company Portal");
  const [welcomeSubtext, setWelcomeSubtext] = useState("Stay updated with the latest company news and access your personalized resources.");
  const [showWelcome, setShowWelcome] = useState(true);
  const [copyrightText, setCopyrightText] = useState("");

  // Notification state
  const [notifications, setNotifications] = useState<{ id: string; title: string; date: string; read: boolean }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";
  const [companyLogo, setCompanyLogo] = useState<string>("/logo.png");
  const [logoSize, setLogoSize] = useState<number>(40);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.site_name) {
            setPortalName(result.data.site_name);
            document.title = result.data.site_name;
          }
          if (result.data.welcome_message) setWelcomeMessage(result.data.welcome_message);
          if (result.data.welcome_subtext) setWelcomeSubtext(result.data.welcome_subtext);
          if (result.data.show_welcome !== undefined) setShowWelcome(result.data.show_welcome === true || result.data.show_welcome === 'true');
          if (result.data.copyright_text !== undefined) setCopyrightText(result.data.copyright_text);
          
          // Load logo settings
          if (result.data.logo_url) setCompanyLogo(result.data.logo_url);
          if (result.data.logo_size) setLogoSize(parseInt(result.data.logo_size));
          
          // Load and apply favicon
          if (result.data.favicon_url) {
            const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (link) {
              link.href = result.data.favicon_url;
            } else {
              const newLink = document.createElement('link');
              newLink.rel = 'icon';
              newLink.href = result.data.favicon_url;
              document.head.appendChild(newLink);
            }
          }
        }
      } catch { /* use defaults */ }
    };
    loadSettings();
  }, []);

  // Load recent articles as notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const result = await articlesAPI.getAll({ limit: 10, status: 'published' });
        if (result.success && result.data) {
          // Get read IDs from backend (per-user, persists across browsers)
          let readIds: string[] = [];
          try {
            const readResult = await notificationsAPI.getReadIds();
            if (readResult.success && readResult.data) {
              readIds = readResult.data;
            }
          } catch {
            // Backend unavailable - notifications won't persist across browsers
            readIds = [];
          }
          const notifs = result.data.articles.map((article: Article) => ({
            id: article.id,
            title: article.title,
            date: article.published_at || article.created_at,
            read: readIds.includes(article.id),
          }));
          setNotifications(notifs);
        }
      } catch { /* silent */ }
    };
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    // Save to backend (persists across browsers per user)
    try {
      await notificationsAPI.markAsRead(id);
    } catch {
      // Backend unavailable - still update local UI state
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const allIds = notifications.map(n => n.id);
    // Save to backend (persists across browsers per user)
    try {
      await notificationsAPI.markAllRead(allIds);
    } catch {
      // Backend unavailable - still update local UI state
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Check if user can access admin panel (admin or editor)
  const canAccessAdmin = user?.role === "admin" || user?.role === "editor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10" style={{ backgroundColor: 'var(--header-bg, hsl(var(--background)))', color: 'var(--header-text, inherit)' }}>
        <div className="h-16 px-4 md:px-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 shrink-0">
            <img
              src={companyLogo}
              alt="Company Logo"
              style={{ height: Math.min(Math.max(logoSize, 42), 48) }}
              className="w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <h1 className="text-[17px] font-medium hidden md:block font-serif">
              {portalName}
            </h1>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-[480px] mr-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
              <Input
                type="search"
                placeholder="Search news or resources..."
                className="h-9 rounded border-white/20 bg-white/10 pl-9 text-[13.5px] text-current placeholder:text-current/45 focus-visible:ring-1 focus-visible:ring-white/25"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Notifications */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-current/75 hover:bg-white/10 hover:text-current">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#b8934d] text-[9px] font-bold text-[#14302b]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-[300px]">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                            <div className={!notif.read ? '' : 'ml-4'}>
                              <p className={`text-sm ${!notif.read ? 'font-medium' : ''}`}>{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full px-1.5 py-1 text-current hover:bg-white/10 hover:text-current">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-[#7c9885] text-[11.5px] font-bold text-[#14302b]">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-[13.5px] md:inline-block">{userName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p>{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {canAccessAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-white/10 hover:text-current"
              onClick={toggleMobileMenu}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 rounded border-white/20 bg-white/10 pl-9 text-current placeholder:text-current/45"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation - Desktop */}
        <div className="hidden md:block">
          <SideNavigation 
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            collapsed={isSidebarCollapsed}
          />
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-20 bg-background md:hidden">
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex justify-end items-center mb-4">
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SideNavigation />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-[1100px]">
            {showWelcome && (
              <Card className="mb-8 rounded border-0 p-6 md:px-8 md:py-6 shadow-none" style={{ backgroundColor: "var(--header-bg, hsl(var(--primary)))", color: "var(--header-text, #ffffff)" }}>
                <h2 className="mb-1.5 font-serif text-[23px] font-medium leading-tight">
                  {welcomeMessage}{user?.name ? `, ${user.name.split(" ")[0]}!` : '!'}
                </h2>
                <p className="text-[13.5px] opacity-70">
                  {welcomeSubtext}
                </p>
              </Card>
            )}

            <div>
              <NewsFeed useApi={true} externalSearchTerm={searchQuery} />
            </div>
          </div>

          {/* Copyright Footer */}
          {copyrightText && (
            <footer className="sr-only">
              <div className="container mx-auto text-center text-sm text-muted-foreground">
                {copyrightText}
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
