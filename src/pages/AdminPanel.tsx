import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Newspaper,
  Link2,
  Users,
  UserPlus,
  HelpCircle,
  Palette,
  ChevronRight,
  ChevronDown,
  Home,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  User,
  LogOut,
  MessageCircleQuestion,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import RichTextEditor from "@/components/RichTextEditor";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  useUsers,
  useGroups,
  useArticles,
  useCategories,
  useURLCategories,
  useBackendStatus,
} from "@/hooks/useApi";
import {
  articlesAPI,
  settingsAPI,
  faqsAPI,
  type CreateUserData,
  type UpdateUserData,
  type CreateArticleData,
  type UpdateArticleData,
  type Article,
  type User,
  type Group,
  type URLCategory,
  type URLLink,
} from "@/lib/api";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("news");
  const [sidebarTab, setSidebarTab] = useState("news");

  // Backend status
  const { isAvailable: backendAvailable, checking: backendChecking } = useBackendStatus();

  // API hooks
  const { users, loading: usersLoading, error: usersError, fetchUsers, createUser, updateUser, deleteUser } = useUsers();
  const { groups, loading: groupsLoading, error: groupsError, fetchGroups, createGroup, updateGroup, deleteGroup } = useGroups();
  const { articles, loading: articlesLoading, error: articlesError, fetchArticles, createArticle, updateArticle, deleteArticle } = useArticles();
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const {
    urlCategories,
    loading: urlCategoriesLoading,
    error: urlCategoriesError,
    fetchURLCategories,
    createURLCategory,
    updateURLCategory,
    deleteURLCategory,
    createLink,
    updateLink,
    deleteLink,
  } = useURLCategories();

  // Dialog States
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isUrlCatDialogOpen, setIsUrlCatDialogOpen] = useState(false);
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);

  // Edit IDs
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingUrlCatId, setEditingUrlCatId] = useState<string | null>(null);
  const [editingUrlLinkId, setEditingUrlLinkId] = useState<string | null>(null);
  const [editingUrlCatForLink, setEditingUrlCatForLink] = useState<string | null>(null);
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null);

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category_id: "",
    status: "draft" as "draft" | "published",
    target_groups: [] as string[],
  });
  const [articleAttachments, setArticleAttachments] = useState<{ id: string; name: string; url: string; type: string }[]>([]);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "editor" | "user",
    department: "",
    phone: "",
    groups: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    members: [] as string[],
    permissions: [] as string[],
  });

  const [urlCatForm, setUrlCatForm] = useState({ name: "", description: "", icon: "Link" });
  const [urlLinkForm, setUrlLinkForm] = useState({ title: "", url: "", description: "", is_external: true });

  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
    is_active: true,
  });
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(false);

  // Logo settings
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");
  const [logoSize, setLogoSize] = useState<number>(40);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Favicon settings
  const [faviconUrl, setFaviconUrl] = useState<string>("/vite.svg");
  const faviconFileRef = useRef<HTMLInputElement>(null);

  // Settings form state
  const [portalName, setPortalName] = useState("Company Portal");
  const [adminEmail, setAdminEmail] = useState(authUser?.email || "admin@company.com");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to the Company Portal");
  const [welcomeSubtext, setWelcomeSubtext] = useState("Stay updated with the latest company news and access your personalized resources.");
  const [showWelcome, setShowWelcome] = useState(true);
  const [copyrightText, setCopyrightText] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Search & submitting
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await settingsAPI.getAll();
        if (result.success && result.data) {
          if (result.data.logo_url) setLogoUrl(result.data.logo_url);
          if (result.data.logo_size) setLogoSize(parseInt(result.data.logo_size));
          if (result.data.favicon_url) {
            setFaviconUrl(result.data.favicon_url);
            // Update the actual favicon in the browser
            updateBrowserFavicon(result.data.favicon_url);
          }
          if (result.data.site_name) {
            setPortalName(result.data.site_name);
            document.title = result.data.site_name;
          }
          if (result.data.admin_email) setAdminEmail(result.data.admin_email);
          if (result.data.welcome_message) setWelcomeMessage(result.data.welcome_message);
          if (result.data.welcome_subtext) setWelcomeSubtext(result.data.welcome_subtext);
          if (result.data.show_welcome !== undefined) setShowWelcome(result.data.show_welcome === true || result.data.show_welcome === 'true');
          if (result.data.copyright_text !== undefined) setCopyrightText(result.data.copyright_text || '');
        }
      } catch { /* use defaults */ }
    };
    if (backendAvailable) loadSettings();
  }, [backendAvailable]);

  // Load FAQs when tab is opened
  useEffect(() => {
    if (activeTab === "faqs" && backendAvailable) {
      fetchFAQs();
    }
  }, [activeTab, backendAvailable]);

  // Save settings handler
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await settingsAPI.bulkUpdate({
        site_name: portalName,
        admin_email: adminEmail,
        welcome_message: welcomeMessage,
        welcome_subtext: welcomeSubtext,
        show_welcome: showWelcome.toString(),
        copyright_text: copyrightText,
      });
      document.title = portalName;
      showSuccess("Settings saved successfully");
      setIsSettingsDialogOpen(false);
    } catch {
      showError("Failed to save settings");
    }
    setSettingsSaving(false);
  };

  // Helpers
  const showSuccess = (msg: string) => toast({ title: "Success", description: msg });
  const showError = (msg: string) => toast({ title: "Error", description: msg, variant: "destructive" });

  // --- NEWS ARTICLES CRUD ---
  const openNewArticle = () => {
    setEditingArticleId(null);
    setArticleForm({ title: "", content: "", excerpt: "", category_id: "", status: "draft", target_groups: [] });
    setArticleAttachments([]);
    setIsNewsDialogOpen(true);
  };

  const openEditArticle = (article: Article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || "",
      category_id: article.category_id || "",
      status: article.status as "draft" | "published",
      target_groups: article.target_groups?.map((g) => g.id) || [],
    });
    setArticleAttachments(
      article.attachments?.map((a) => ({ id: a.id, name: a.original_name, url: a.url, type: a.mime_type })) || []
    );
    setIsNewsDialogOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) { showError("Title and content are required"); return; }
    setSubmitting(true);
    try {
      const data: any = {
        title: articleForm.title,
        content: articleForm.content,
        excerpt: articleForm.excerpt || undefined,
        category_id: articleForm.category_id || undefined,
        status: articleForm.status,
        target_groups: articleForm.target_groups,
      };
      const result = editingArticleId ? await updateArticle(editingArticleId, data) : await createArticle(data);
      if (result.success) {
        showSuccess(editingArticleId ? "Article updated" : "Article created");
        setIsNewsDialogOpen(false);
      } else {
        showError(result.message || "Failed to save article");
      }
    } catch (err: any) { showError(err.message || "An error occurred"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const result = await deleteArticle(id);
    if (result.success) showSuccess("Article deleted");
    else showError(result.message || "Failed to delete");
  };

  // --- URL CATEGORIES CRUD ---
  const openNewUrlCat = () => { setEditingUrlCatId(null); setUrlCatForm({ name: "", description: "", icon: "Link" }); setIsUrlCatDialogOpen(true); };
  const openEditUrlCat = (cat: URLCategory) => { setEditingUrlCatId(cat.id); setUrlCatForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "Link" }); setIsUrlCatDialogOpen(true); };

  const handleSaveUrlCat = async () => {
    if (!urlCatForm.name.trim()) { showError("Name is required"); return; }
    setSubmitting(true);
    try {
      const result = editingUrlCatId ? await updateURLCategory(editingUrlCatId, urlCatForm) : await createURLCategory(urlCatForm);
      if (result.success) { showSuccess(editingUrlCatId ? "Category updated" : "Category created"); setIsUrlCatDialogOpen(false); }
      else showError(result.message || "Failed to save");
    } catch { showError("An error occurred"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUrlCat = async (id: string) => {
    if (!confirm("Delete category and all its links?")) return;
    const result = await deleteURLCategory(id);
    if (result.success) showSuccess("Deleted"); else showError(result.message || "Failed");
  };

  // URL Links
  const openNewUrlLink = (catId: string) => { setEditingUrlLinkId(null); setEditingUrlCatForLink(catId); setUrlLinkForm({ title: "", url: "", description: "", is_external: true }); setIsUrlDialogOpen(true); };
  const openEditUrlLink = (catId: string, link: URLLink) => { setEditingUrlLinkId(link.id); setEditingUrlCatForLink(catId); setUrlLinkForm({ title: link.title, url: link.url, description: link.description || "", is_external: link.is_external }); setIsUrlDialogOpen(true); };

  const handleSaveUrlLink = async () => {
    if (!urlLinkForm.title.trim() || !urlLinkForm.url.trim() || !editingUrlCatForLink) { showError("Title and URL required"); return; }
    setSubmitting(true);
    try {
      const result = editingUrlLinkId ? await updateLink(editingUrlCatForLink, editingUrlLinkId, urlLinkForm) : await createLink(editingUrlCatForLink, urlLinkForm);
      if (result.success) { showSuccess(editingUrlLinkId ? "Link updated" : "Link added"); setIsUrlDialogOpen(false); }
      else showError(result.message || "Failed");
    } catch { showError("An error occurred"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUrlLink = async (catId: string, linkId: string) => {
    if (!confirm("Delete this link?")) return;
    const result = await deleteLink(catId, linkId);
    if (result.success) showSuccess("Deleted"); else showError(result.message || "Failed");
  };

  // --- USERS CRUD ---
  const openNewUser = () => {
    setEditingUserId(null);
    setUserForm({ name: "", email: "", password: "", role: "user", department: "", phone: "", groups: [] });
    setShowPassword(false);
    setIsUserDialogOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, email: user.email, password: "", role: user.role, department: user.department || "", phone: user.phone || "", groups: user.groups?.map((g) => g.id) || [] });
    setShowPassword(false);
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) { showError("Name and email required"); return; }
    if (!editingUserId && !userForm.password.trim()) { showError("Password required for new users"); return; }
    setSubmitting(true);
    try {
      if (editingUserId) {
        const data: UpdateUserData = { name: userForm.name, email: userForm.email, role: userForm.role, department: userForm.department || undefined, phone: userForm.phone || undefined, groups: userForm.groups };
        if (userForm.password.trim()) data.password = userForm.password;
        const result = await updateUser(editingUserId, data);
        if (result.success) { showSuccess("User updated"); setIsUserDialogOpen(false); }
        else showError(result.message || "Failed");
      } else {
        const result = await createUser({ name: userForm.name, email: userForm.email, password: userForm.password, role: userForm.role, department: userForm.department || undefined, phone: userForm.phone || undefined, groups: userForm.groups });
        if (result.success) { showSuccess("User created"); setIsUserDialogOpen(false); }
        else showError(result.message || "Failed");
      }
    } catch (err: any) { showError(err.message || "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const result = await deleteUser(id);
    if (result.success) showSuccess("Deleted"); else showError(result.message || "Failed");
  };

  // --- GROUPS CRUD ---
  const openNewGroup = () => { setEditingGroupId(null); setGroupForm({ name: "", description: "", color: "#3B82F6", members: [], permissions: [] }); setIsGroupDialogOpen(true); };
  const openEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupForm({ name: group.name, description: group.description || "", color: group.color || "#3B82F6", members: group.members?.map((m: any) => typeof m === "string" ? m : m.id) || [], permissions: group.permissions || [] });
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) { showError("Name required"); return; }
    setSubmitting(true);
    try {
      const result = editingGroupId
        ? await updateGroup(editingGroupId, { name: groupForm.name, description: groupForm.description || undefined, color: groupForm.color, members: groupForm.members, permissions: groupForm.permissions })
        : await createGroup({ name: groupForm.name, description: groupForm.description || undefined, color: groupForm.color, members: groupForm.members, permissions: groupForm.permissions });
      if (result.success) { showSuccess(editingGroupId ? "Group updated" : "Group created"); setIsGroupDialogOpen(false); }
      else showError(result.message || "Failed");
    } catch { showError("Error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    const result = await deleteGroup(id);
    if (result.success) showSuccess("Deleted"); else showError(result.message || "Failed");
  };

  // --- FAQs CRUD ---
  const fetchFAQs = async () => {
    setFaqsLoading(true);
    try {
      const result = await faqsAPI.getAll({ active_only: false });
      if (result.success && result.data) {
        setFaqs(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
    } finally {
      setFaqsLoading(false);
    }
  };

  const openNewFAQ = () => {
    setEditingFAQId(null);
    setFaqForm({ question: "", answer: "", category: "", display_order: 0, is_active: true });
    setIsFAQDialogOpen(true);
  };

  const openEditFAQ = (faq: any) => {
    setEditingFAQId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      display_order: faq.display_order || 0,
      is_active: faq.is_active !== false,
    });
    setIsFAQDialogOpen(true);
  };

  const handleSaveFAQ = async () => {
    if (!faqForm.question.trim()) { showError("Question required"); return; }
    if (!faqForm.answer.trim()) { showError("Answer required"); return; }
    setSubmitting(true);
    try {
      const result = editingFAQId
        ? await faqsAPI.update(editingFAQId, faqForm)
        : await faqsAPI.create(faqForm);
      if (result.success) {
        showSuccess(editingFAQId ? "FAQ updated" : "FAQ created");
        setIsFAQDialogOpen(false);
        await fetchFAQs();
      } else {
        showError(result.message || "Failed");
      }
    } catch {
      showError("Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const result = await faqsAPI.delete(id);
      if (result.success) {
        showSuccess("Deleted");
        await fetchFAQs();
      } else {
        showError(result.message || "Failed");
      }
    } catch {
      showError("Error");
    }
  };

  // --- LOGO ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await settingsAPI.uploadLogo(file);
      if (result.success && result.data) { setLogoUrl(result.data.url || result.data.logo_url); showSuccess("Logo uploaded"); }
      else showError(result.message || "Upload failed");
    } catch { showError("Upload failed"); }
  };

  const handleLogoSizeChange = async (val: number[]) => {
    setLogoSize(val[0]);
    try { await settingsAPI.update("logo_size", val[0].toString()); } catch { /* silent */ }
  };

  // --- FAVICON ---
  const updateBrowserFavicon = (url: string) => {
    // Update the favicon in the browser
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = url;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = url;
      document.head.appendChild(newLink);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await settingsAPI.uploadFavicon(file);
      if (result.success && result.data) {
        const newFaviconUrl = result.data.url || result.data.favicon_url;
        setFaviconUrl(newFaviconUrl);
        updateBrowserFavicon(newFaviconUrl);
        showSuccess("Favicon uploaded and applied");
      } else {
        showError(result.message || "Upload failed");
      }
    } catch {
      showError("Upload failed");
    }
  };

  // Filtered data
  const filteredArticles = articles.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || (a.author_name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Helper components
  const LoadingSection = () => (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading...</span>
    </div>
  );

  const ErrorBanner = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  const BackendWarning = () => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Backend Not Connected</AlertTitle>
      <AlertDescription>
        The backend server is not reachable. Changes will NOT be saved.
        <br />API URL: <code className="font-mono text-xs">{import.meta.env.VITE_API_URL || "(not configured)"}</code>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="flex h-screen bg-background">
      <Toaster />
      {/* Side Navigation */}
      <div className="hidden md:block w-64 border-r" style={{ backgroundColor: 'var(--sidebar-bg, hsl(var(--card)))', color: 'var(--sidebar-text, inherit)' }}>
        <div className="p-4 space-y-4 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <img src={logoUrl} alt="Logo" style={{ height: logoSize }} className="w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <h2 className="text-lg font-bold">{portalName}</h2>
          </div>
          <div className="space-y-1 flex-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/dashboard")}>
              <ChevronRight className="mr-2 h-4 w-4" /> Dashboard
            </Button>
            <div className="py-2"><p className="text-xs font-semibold text-muted-foreground px-2 mb-2">ADMIN SECTIONS</p></div>
            {[
              { key: "news", icon: Newspaper, label: "News Articles" },
              { key: "urls", icon: Link2, label: "URL Categories" },
              { key: "users", icon: Users, label: "Users" },
              { key: "groups", icon: UserPlus, label: "Groups" },
              { key: "faqs", icon: MessageCircleQuestion, label: "FAQs" },
              { key: "theme", icon: Palette, label: "Theme & Logo" },
            ].map(({ key, icon: Icon, label }) => (
              <Button key={key} variant={sidebarTab === key ? "secondary" : "ghost"} className="w-full justify-start"
                onClick={() => { setSidebarTab(key); setActiveTab(key); }}>
                <Icon className="mr-2 h-4 w-4" /> {label}
              </Button>
            ))}
          </div>
          <div className="border-t pt-4 space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => setIsHelpDialogOpen(true)}>
              <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b p-4" style={{ backgroundColor: 'var(--header-bg, hsl(var(--card)))', color: 'var(--header-text, inherit)' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="w-[200px] pl-8 md:w-[300px] bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={authUser?.avatar || ""} alt={authUser?.name || "User"} />
                      <AvatarFallback>
                        {(authUser?.name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block">{authUser?.name || "User"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p>{authUser?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{authUser?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate("/"); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {backendChecking ? <LoadingSection /> : (
            <>
              {backendAvailable === false && <BackendWarning />}
              <Tabs value={activeTab} className="w-full" onValueChange={(val) => { setActiveTab(val); setSidebarTab(val); }}>
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="news">News Articles</TabsTrigger>
                    <TabsTrigger value="urls">URL Categories</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                    <TabsTrigger value="faqs">FAQs</TabsTrigger>
                    <TabsTrigger value="theme">Theme & Logo</TabsTrigger>
                  </TabsList>
                  {activeTab === "news" && <Button onClick={openNewArticle}><Plus className="mr-2 h-4 w-4" />Add Article</Button>}
                  {activeTab === "urls" && <Button onClick={openNewUrlCat}><Plus className="mr-2 h-4 w-4" />Add Category</Button>}
                  {activeTab === "users" && <Button onClick={openNewUser}><Plus className="mr-2 h-4 w-4" />Add User</Button>}
                  {activeTab === "groups" && <Button onClick={openNewGroup}><Plus className="mr-2 h-4 w-4" />Add Group</Button>}
                  {activeTab === "faqs" && <Button onClick={openNewFAQ}><Plus className="mr-2 h-4 w-4" />Add FAQ</Button>}
                </div>

                {/* NEWS TAB */}
                <TabsContent value="news" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage News Articles</CardTitle>
                      <CardDescription>Create, edit, and delete news articles for the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {articlesError && <ErrorBanner message={articlesError} />}
                      {articlesLoading ? <LoadingSection /> : filteredArticles.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No articles found. Create your first article!</p>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Target Groups</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredArticles.map((article) => (
                                <TableRow key={article.id}>
                                  <TableCell className="font-medium">{article.title}</TableCell>
                                  <TableCell>{article.author_name || "—"}</TableCell>
                                  <TableCell>{article.category_name || "—"}</TableCell>
                                  <TableCell>
                                    {article.target_groups && article.target_groups.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {article.target_groups.map((g) => <Badge key={g.id} variant="outline" className="text-xs">{g.name}</Badge>)}
                                      </div>
                                    ) : <span className="text-muted-foreground text-xs">All users</span>}
                                  </TableCell>
                                  <TableCell>{article.published_at ? new Date(article.published_at).toLocaleDateString() : new Date(article.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell><Badge variant={article.status === "published" ? "default" : "secondary"}>{article.status}</Badge></TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEditArticle(article)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteArticle(article.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* URL CATEGORIES TAB */}
                <TabsContent value="urls" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage URL Categories</CardTitle>
                      <CardDescription>Organize internal links into categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {urlCategoriesError && <ErrorBanner message={urlCategoriesError} />}
                      {urlCategoriesLoading ? <LoadingSection /> : urlCategories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No URL categories yet.</p>
                      ) : (
                        <div className="space-y-6">
                          {urlCategories.map((cat) => (
                            <div key={cat.id} className="border rounded-md p-4">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h3 className="text-lg font-medium">{cat.name}</h3>
                                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditUrlCat(cat)}><Edit2 className="mr-2 h-4 w-4" />Edit</Button>
                                  <Button variant="outline" size="sm" onClick={() => openNewUrlLink(cat.id)}><Plus className="mr-2 h-4 w-4" />Add Link</Button>
                                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteUrlCat(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                              {cat.links && cat.links.length > 0 && (
                                <div className="border rounded-md">
                                  <Table>
                                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>URL</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                      {cat.links.map((link) => (
                                        <TableRow key={link.id}>
                                          <TableCell>{link.title}</TableCell>
                                          <TableCell><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-md">{link.url}</a></TableCell>
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEditUrlLink(cat.id, link)}><Edit2 className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteUrlLink(cat.id, link.id)}><Trash2 className="h-4 w-4" /></Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* USERS TAB */}
                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Users</CardTitle>
                      <CardDescription>Add, edit, and delete users with passwords and group assignments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {usersError && <ErrorBanner message={usersError} />}
                      {usersLoading ? <LoadingSection /> : filteredUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No users found.</p>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Groups</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {user.groups && user.groups.length > 0 ? user.groups.slice(0, 3).map((g) => <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>) : <span className="text-muted-foreground text-sm">None</span>}
                                      {user.groups && user.groups.length > 3 && <Badge variant="secondary" className="text-xs">+{user.groups.length - 3}</Badge>}
                                    </div>
                                  </TableCell>
                                  <TableCell><Badge variant={user.status === "active" ? "default" : "destructive"} className="capitalize">{user.status}</Badge></TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEditUser(user)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* GROUPS TAB */}
                <TabsContent value="groups" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Groups</CardTitle>
                      <CardDescription>Create and manage user groups.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {groupsError && <ErrorBanner message={groupsError} />}
                      {groupsLoading ? <LoadingSection /> : groups.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No groups yet.</p>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groups.map((group) => (
                                <TableRow key={group.id}>
                                  <TableCell className="font-medium">{group.name}</TableCell>
                                  <TableCell>{group.description || "—"}</TableCell>
                                  <TableCell><div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />{group.color}</div></TableCell>
                                  <TableCell><Badge variant="outline">{group.member_count || 0} members</Badge></TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEditGroup(group)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* THEME & LOGO TAB */}
                <TabsContent value="theme" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Logo Management</CardTitle>
                      <CardDescription>Upload your company logo and adjust its display size.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-6">
                        <div className="border rounded-lg p-4 bg-muted/30 min-w-[200px] flex items-center justify-center">
                          <img src={logoUrl} alt="Current Logo" style={{ height: logoSize }} className="w-auto max-w-[200px]" onError={(e) => { (e.target as HTMLImageElement).src = "/vite.svg"; }} />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label>Upload New Logo</Label>
                            <Input ref={logoFileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">Recommended: PNG or SVG with transparent background</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Logo Size: {logoSize}px</Label>
                            <Slider value={[logoSize]} onValueChange={handleLogoSizeChange} min={20} max={120} step={2} />
                            <div className="flex justify-between text-xs text-muted-foreground"><span>20px</span><span>120px</span></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Favicon Management Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Favicon Management</CardTitle>
                      <CardDescription>Upload a favicon (browser tab icon) for your portal. Recommended size: 32x32 or 64x64 pixels.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-6">
                        <div className="border rounded-lg p-4 bg-muted/30 min-w-[100px] min-h-[100px] flex items-center justify-center">
                          <img src={faviconUrl} alt="Current Favicon" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/vite.svg"; }} />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label>Upload New Favicon</Label>
                            <Input ref={faviconFileRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/ico,.ico" onChange={handleFaviconUpload} className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">Supported formats: PNG, ICO, SVG. Recommended: 32x32px or 64x64px</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Preview:</strong> The favicon will appear in browser tabs, bookmarks, and shortcuts after upload.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <ThemeCustomizer />
                </TabsContent>

                {/* FAQs TAB */}
                <TabsContent value="faqs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage FAQs</CardTitle>
                      <CardDescription>Create and manage frequently asked questions for users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {faqsLoading ? (
                        <LoadingSection />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Question</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="w-20">Order</TableHead>
                              <TableHead className="w-20">Active</TableHead>
                              <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {faqs.length === 0 ? (
                              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No FAQs yet.</TableCell></TableRow>
                            ) : (
                              faqs.map((faq) => (
                                <TableRow key={faq.id}>
                                  <TableCell className="font-medium">{faq.question}</TableCell>
                                  <TableCell>
                                    {faq.category && <Badge variant="outline">{faq.category}</Badge>}
                                  </TableCell>
                                  <TableCell>{faq.display_order}</TableCell>
                                  <TableCell>
                                    {faq.is_active ? (
                                      <Badge variant="default">Active</Badge>
                                    ) : (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => openEditFAQ(faq)}><Edit2 className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFAQ(faq.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* ARTICLE DIALOG */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticleId ? "Edit Article" : "New Article"}</DialogTitle>
            <DialogDescription>{editingArticleId ? "Update the article details." : "Create a new article with rich text and attachments."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={articleForm.category_id || "none"} onValueChange={(val) => setArticleForm({ ...articleForm, category_id: val === "none" ? "" : val })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={articleForm.status} onValueChange={(val) => setArticleForm({ ...articleForm, status: val as "draft" | "published" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Publish to Groups (leave empty for all users)</Label>
              <ScrollArea className="h-[120px] border rounded-md p-3">
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox id={`article-group-${group.id}`} checked={articleForm.target_groups.includes(group.id)}
                        onCheckedChange={(checked) => setArticleForm({ ...articleForm, target_groups: checked ? [...articleForm.target_groups, group.id] : articleForm.target_groups.filter((id) => id !== group.id) })} />
                      <Label htmlFor={`article-group-${group.id}`} className="cursor-pointer flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />{group.name}
                      </Label>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups available.</p>}
                </div>
              </ScrollArea>
            </div>
            <div className="grid gap-2">
              <Label>Excerpt (optional)</Label>
              <Textarea value={articleForm.excerpt} onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })} rows={2} placeholder="Brief summary..." />
            </div>
            <div className="grid gap-2">
              <Label>Content *</Label>
              <RichTextEditor content={articleForm.content} onChange={(content) => setArticleForm({ ...articleForm, content })} attachments={articleAttachments} onAttachmentsChange={setArticleAttachments} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveArticle} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingArticleId ? "Save Changes" : "Create Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL CAT DIALOG */}
      <Dialog open={isUrlCatDialogOpen} onOpenChange={setIsUrlCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUrlCatId ? "Edit Category" : "New URL Category"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name *</Label><Input value={urlCatForm.name} onChange={(e) => setUrlCatForm({ ...urlCatForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Input value={urlCatForm.description} onChange={(e) => setUrlCatForm({ ...urlCatForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUrlCatDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveUrlCat} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingUrlCatId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL LINK DIALOG */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUrlLinkId ? "Edit Link" : "New Link"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={urlLinkForm.title} onChange={(e) => setUrlLinkForm({ ...urlLinkForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>URL *</Label><Input value={urlLinkForm.url} onChange={(e) => setUrlLinkForm({ ...urlLinkForm, url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid gap-2"><Label>Description</Label><Input value={urlLinkForm.description} onChange={(e) => setUrlLinkForm({ ...urlLinkForm, description: e.target.value })} /></div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isExternal" checked={urlLinkForm.is_external} onCheckedChange={(checked) => setUrlLinkForm({ ...urlLinkForm, is_external: !!checked })} />
              <Label htmlFor="isExternal">Opens in new tab</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveUrlLink} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingUrlLinkId ? "Save" : "Add Link"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* USER DIALOG */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUserId ? "Edit User" : "New User"}</DialogTitle>
            <DialogDescription>{editingUserId ? "Update user details." : "Create a new user with a password."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Name *</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Email *</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Password {editingUserId ? "(leave blank to keep)" : "*"}</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={editingUserId ? "Leave blank to keep current" : "Enter password"} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(val) => setUserForm({ ...userForm, role: val as "admin" | "editor" | "user" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Department</Label><Input value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Phone</Label><Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Groups</Label>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox id={`user-group-${group.id}`} checked={userForm.groups.includes(group.id)}
                        onCheckedChange={(checked) => setUserForm({ ...userForm, groups: checked ? [...userForm.groups, group.id] : userForm.groups.filter((id) => id !== group.id) })} />
                      <Label htmlFor={`user-group-${group.id}`} className="cursor-pointer flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />{group.name}
                      </Label>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups available.</p>}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingUserId ? "Save Changes" : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GROUP DIALOG */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingGroupId ? "Edit Group" : "New Group"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Name *</Label><Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={groupForm.color} onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })} className="h-10 w-20 cursor-pointer" />
                  <Input value={groupForm.color} onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Input value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Members</Label>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox id={`group-member-${user.id}`} checked={groupForm.members.includes(user.id)}
                        onCheckedChange={(checked) => setGroupForm({ ...groupForm, members: checked ? [...groupForm.members, user.id] : groupForm.members.filter((id) => id !== user.id) })} />
                      <Label htmlFor={`group-member-${user.id}`} className="cursor-pointer">{user.name} ({user.email})</Label>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-muted-foreground">No users available.</p>}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingGroupId ? "Save Changes" : "Create Group"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ DIALOG */}
      <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFAQId ? "Edit FAQ" : "New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingFAQId ? "Update the FAQ details." : "Create a new frequently asked question."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Question *</Label>
              <Input
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div className="grid gap-2">
              <Label>Answer *</Label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category (Optional)</Label>
                <Input
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  placeholder="e.g., General, Account, Billing"
                />
              </div>
              <div className="grid gap-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={faqForm.display_order}
                  onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="faq-active"
                checked={faqForm.is_active}
                onCheckedChange={(checked) => setFaqForm({ ...faqForm, is_active: checked as boolean })}
              />
              <Label htmlFor="faq-active" className="cursor-pointer">Active (visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFAQDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveFAQ} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFAQId ? "Save Changes" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SETTINGS DIALOG */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Settings</DialogTitle><DialogDescription>Configure your portal settings.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label>Portal Name</Label>
              <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} placeholder="Company Portal" />
              <p className="text-xs text-muted-foreground">This name appears in the browser tab and throughout the portal.</p>
            </div>
            <div className="grid gap-2">
              <Label>Admin Email</Label>
              <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" />
            </div>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Welcome Banner</h4>
              <div className="flex items-center space-x-2">
                <Checkbox id="showWelcome" checked={showWelcome} onCheckedChange={(checked) => setShowWelcome(!!checked)} />
                <Label htmlFor="showWelcome" className="cursor-pointer">Show welcome message on dashboard</Label>
              </div>
              {showWelcome && (
                <>
                  <div className="grid gap-2">
                    <Label>Welcome Message</Label>
                    <Input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Welcome to the Company Portal" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Welcome Subtext</Label>
                    <Textarea value={welcomeSubtext} onChange={(e) => setWelcomeSubtext(e.target.value)} rows={2} placeholder="Stay updated with the latest..." />
                  </div>
                </>
              )}
            </div>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Copyright Footer</h4>
              <div className="grid gap-2">
                <Label>Copyright Text</Label>
                <Input value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} placeholder="© 2024 Company Name. All rights reserved." />
                <p className="text-xs text-muted-foreground">This text appears at the bottom of the dashboard. Leave empty to hide.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} disabled={settingsSaving}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HELP DIALOG */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Help & Support</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Backend Connection</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Status: {backendAvailable ? <Badge variant="default" className="ml-1">Connected</Badge> : <Badge variant="destructive" className="ml-1">Not Connected</Badge>}
                </p>
                <p className="text-sm text-muted-foreground mt-2">API: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{import.meta.env.VITE_API_URL || "(not configured)"}</code></p>
                {!backendAvailable && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="font-medium text-destructive">Troubleshooting:</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Check if backend is running: <code className="text-xs bg-muted px-1 rounded">pm2 status</code></li>
                      <li>If port conflict (EADDRINUSE): <code className="text-xs bg-muted px-1 rounded">fuser -k 3001/tcp && pm2 restart all</code></li>
                      <li>Check logs: <code className="text-xs bg-muted px-1 rounded">pm2 logs</code></li>
                      <li>Ensure MariaDB is running: <code className="text-xs bg-muted px-1 rounded">systemctl status mariadb</code></li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Contact Support</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  For technical assistance, contact your system administrator at: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{adminEmail}</code>
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter><Button onClick={() => setIsHelpDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
