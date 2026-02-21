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
  User as UserIcon,
  LogOut,
  MessageCircleQuestion,
  Tag,
  Mail,
  Send,
  CheckCircle,
  Check,
  X,
  Shield,
  XCircle,
  Link,
  Globe,
  BookOpen,
  FileText,
  Briefcase,
  Heart,
  Star,
  Folder,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Zap,
  Database,
  Code,
  Video,
  Music,
  Download,
  Upload,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  groupsAPI,
  settingsAPI,
  faqsAPI,
  categoriesAPI,
  urlCategoriesAPI,
  type CreateUserData,
  type UpdateUserData,
  type CreateArticleData,
  type UpdateArticleData,
  type Article,
  type Group,
  type URLCategory,
  type URLLink,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData,
  type EmailSettings,
  type EmailTemplates,
} from "@/lib/api";
import type { User } from "@/types/database";

type SectionPerms = { read: boolean; write: boolean; delete: boolean };
type RolePermsMap = Record<string, Record<string, SectionPerms>>;

const defaultSections = ["news", "users", "groups", "categories", "urls", "faqs", "email", "theme"];

const makeDefaultPerms = (allTrue = false): Record<string, SectionPerms> =>
  Object.fromEntries(defaultSections.map((s) => [s, { read: allTrue, write: allTrue, delete: allTrue }]));

const defaultRolePermissions: RolePermsMap = {
  admin: makeDefaultPerms(true),
  editor: {
    news: { read: true, write: true, delete: false },
    users: { read: false, write: false, delete: false },
    groups: { read: false, write: false, delete: false },
    categories: { read: true, write: false, delete: false },
    urls: { read: true, write: false, delete: false },
    faqs: { read: true, write: true, delete: false },
    email: { read: false, write: false, delete: false },
    theme: { read: false, write: false, delete: false },
  },
  user: {
    news: { read: true, write: false, delete: false },
    users: { read: false, write: false, delete: false },
    groups: { read: false, write: false, delete: false },
    categories: { read: true, write: false, delete: false },
    urls: { read: true, write: false, delete: false },
    faqs: { read: true, write: false, delete: false },
    email: { read: false, write: false, delete: false },
    theme: { read: false, write: false, delete: false },
  },
};

// Component to show group members in a popover
const GroupMemberPopover = ({ groupId, groupName, users }: { groupId: string; groupName: string; users: User[] }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const result = await groupsAPI.getById(groupId);
        if (result.success && result.data?.members) {
          const memberIds = result.data.members.map((m: any) => typeof m === "string" ? m : m.id);
          const matchedUsers = users.filter(u => memberIds.includes(u.id));
          // Also include members from the API response that might not be in the users list
          const apiMembers = result.data.members
            .filter((m: any) => typeof m !== "string" && !matchedUsers.find(u => u.id === m.id))
            .map((m: any) => m);
          setMembers([...matchedUsers, ...apiMembers]);
        }
      } catch (err) {
        console.error("Failed to fetch group members:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupId, users]);

  return (
    <div className="p-3">
      <p className="font-semibold text-sm mb-2">{groupName} — Members</p>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No members in this group.</p>
      ) : (
        <ScrollArea className={members.length > 5 ? "h-[200px]" : ""}>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{(member.name || member.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{member.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

// Sortable URL Category Component
interface SortableUrlCategoryProps {
  cat: URLCategory;
  onEdit: (cat: URLCategory) => void;
  onDelete: (id: string) => void;
  onAddLink: (catId: string) => void;
  onEditLink: (catId: string, link: URLLink) => void;
  onDeleteLink: (catId: string, linkId: string) => void;
  onReorderLinks: (catId: string, linkIds: string[]) => void;
}

const SortableUrlCategory = ({
  cat,
  onEdit,
  onDelete,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onReorderLinks,
}: SortableUrlCategoryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && cat.links) {
      const oldIndex = cat.links.findIndex((link) => link.id === active.id);
      const newIndex = cat.links.findIndex((link) => link.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLinks = arrayMove(cat.links, oldIndex, newIndex);
        const linkIds = newLinks.map((link) => link.id);
        onReorderLinks(cat.id, linkIds);
      }
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-md p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">{cat.name}</h3>
            <p className="text-sm text-muted-foreground">{cat.description}</p>
            <div className="mt-2">
              {cat.target_groups && cat.target_groups.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Visible to:</span>
                  {cat.target_groups.map((g) => (
                    <Badge key={g.id} variant="outline" className="text-xs">
                      {g.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Visible to: All users</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(cat)}>
            <Edit2 className="mr-2 h-4 w-4" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAddLink(cat.id)}>
            <Plus className="mr-2 h-4 w-4" />Add Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(cat.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {cat.links && cat.links.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={cat.links.map((link) => link.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {cat.links.map((link) => (
                    <SortableUrlLink
                      key={link.id}
                      link={link}
                      categoryId={cat.id}
                      onEdit={onEditLink}
                      onDelete={onDeleteLink}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </div>
        </DndContext>
      )}
    </div>
  );
};

// Sortable URL Link Component
interface SortableUrlLinkProps {
  link: URLLink;
  categoryId: string;
  onEdit: (catId: string, link: URLLink) => void;
  onDelete: (catId: string, linkId: string) => void;
}

const SortableUrlLink = ({
  link,
  categoryId,
  onEdit,
  onDelete,
}: SortableUrlLinkProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>{link.title}</TableCell>
      <TableCell>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate block max-w-md"
        >
          {link.url}
        </a>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(categoryId, link)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => onDelete(categoryId, link.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Dialog States
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isUrlCatDialogOpen, setIsUrlCatDialogOpen] = useState(false);
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Edit IDs
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingUrlCatId, setEditingUrlCatId] = useState<string | null>(null);
  const [editingUrlLinkId, setEditingUrlLinkId] = useState<string | null>(null);
  const [editingUrlCatForLink, setEditingUrlCatForLink] = useState<string | null>(null);
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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
    confirmPassword: "",
    role: "user" as "user" | "admin" | "editor",
    department: "",
    phone: "",
    groups: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmUserPassword, setShowConfirmUserPassword] = useState(false);
  const [userPasswordError, setUserPasswordError] = useState("");

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    members: [] as string[],
    permissions: [] as string[],
  });
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);

  const [urlCatForm, setUrlCatForm] = useState({ name: "", description: "", icon: "Link", target_groups: [] as string[] });
  const [urlLinkForm, setUrlLinkForm] = useState({ title: "", url: "", description: "", icon_url: "", is_external: true });

  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
    is_active: true,
  });
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(false);

  // News Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
  });
  const [newsCategoriesData, setNewsCategoriesData] = useState<Category[]>([]);
  const [newsCategoriesLoading, setNewsCategoriesLoading] = useState(false);

  // Email settings form state
  const [emailForm, setEmailForm] = useState<EmailSettings>({
    smtp_host: "",
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: "",
    smtp_password: "",
    from_email: "",
    from_name: "",
    email_enabled: false,
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Email template state
  const [emailTemplates, setEmailTemplates] = useState({
    email_template_password_reset_subject: "Password Reset Request",
    email_template_password_reset_body: `<h2>Password Reset Request</h2>\n<p>Hello {{user_name}},</p>\n<p>You requested a password reset. Click the link below to reset your password:</p>\n<p><a href="{{reset_url}}" style="display:inline-block;padding:10px 20px;background:{{primary_color}};color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a></p>\n<p>Or copy this URL: {{reset_url}}</p>\n<p>This link will expire in 1 hour.</p>\n<p>If you didn't request this, please ignore this email.</p>`,
    email_template_welcome_subject: "Welcome to {{site_name}}",
    email_template_welcome_body: `<h2>Welcome to {{site_name}}!</h2>\n<p>Hello {{user_name}},</p>\n<p>Your account has been created successfully.</p>\n<p><a href="{{login_url}}" style="display:inline-block;padding:10px 20px;background:{{primary_color}};color:#fff;text-decoration:none;border-radius:5px;">Log In Now</a></p>`,
    email_template_notification_subject: "New Article: {{article_title}}",
    email_template_notification_body: `<h2>{{article_title}}</h2>\n<p>Hello {{user_name}},</p>\n<p>A new article has been published on {{site_name}}.</p>\n<p><a href="{{article_url}}" style="display:inline-block;padding:10px 20px;background:{{primary_color}};color:#fff;text-decoration:none;border-radius:5px;">Read More</a></p>`,
  });
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState("password_reset");

  // Role management state
  const [rolePermissions, setRolePermissions] = useState<RolePermsMap>(defaultRolePermissions);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Dynamic role management
  const [customRoles, setCustomRoles] = useState<string[]>(["admin", "editor", "user"]);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [renamingRole, setRenamingRole] = useState<string | null>(null);
  const [renameRoleName, setRenameRoleName] = useState("");

  const roleDescriptions: Record<string, string> = {
    admin: "Full system access - can manage all features",
    editor: "Limited to content management - can publish articles",
    user: "Read-only access - can view content",
  };

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

  // Helper: check if the current user's role has read access to a tab/section
  const tabToPermissionKey: Record<string, string> = {
    news: "news",
    categories: "categories",
    urls: "urls",
    users: "users",
    roles: "users", // roles tab is part of user management
    groups: "groups",
    faqs: "faqs",
    email: "email",
    theme: "theme",
  };

  const canViewTab = (tabValue: string): boolean => {
    // Admins can always see everything
    if (authUser?.role === "admin") return true;
    // If permissions haven't loaded from backend yet, only show news for non-admins
    if (!permissionsLoaded && backendAvailable) {
      return tabValue === "news";
    }
    const permKey = tabToPermissionKey[tabValue];
    if (!permKey) return true;
    const userRole = authUser?.role || "user";
    const perms = rolePermissions[userRole];
    if (!perms) return false;
    const sectionPerms = perms[permKey];
    if (!sectionPerms) return false;
    return sectionPerms.read === true;
  };

  const canWriteSection = (sectionKey: string): boolean => {
    if (authUser?.role === "admin") return true;
    const userRole = authUser?.role || "user";
    const perms = rolePermissions[userRole];
    if (!perms) return false;
    const sectionPerms = perms[sectionKey];
    if (!sectionPerms) return false;
    return sectionPerms.write === true;
  };

  const canDeleteSection = (sectionKey: string): boolean => {
    if (authUser?.role === "admin") return true;
    const userRole = authUser?.role || "user";
    const perms = rolePermissions[userRole];
    if (!perms) return false;
    const sectionPerms = perms[sectionKey];
    if (!sectionPerms) return false;
    return sectionPerms.delete === true;
  };

  // Add role handler
  const handleAddRole = () => {
    const roleName = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!roleName || customRoles.includes(roleName)) return;
    setCustomRoles((prev) => [...prev, roleName]);
    setRolePermissions((prev) => ({
      ...prev,
      [roleName]: makeDefaultPerms(false),
    }));
    setNewRoleName("");
    setIsAddRoleDialogOpen(false);
  };

  // Rename role handler
  const handleRenameRole = (oldName: string) => {
    const newName = renameRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!newName || newName === oldName || customRoles.includes(newName)) return;
    setCustomRoles((prev) => prev.map((r) => (r === oldName ? newName : r)));
    setRolePermissions((prev) => {
      const updated = { ...prev };
      updated[newName] = updated[oldName];
      delete updated[oldName];
      return updated;
    });
    setRenamingRole(null);
    setRenameRoleName("");
  };

  // Delete role handler
  const handleDeleteRole = (roleName: string) => {
    if (roleName === "admin") return; // Never delete admin
    setCustomRoles((prev) => prev.filter((r) => r !== roleName));
    setRolePermissions((prev) => {
      const updated = { ...prev };
      delete updated[roleName];
      return updated;
    });
  };

  // Set initial active tab to first visible tab when permissions load
  useEffect(() => {
    const allTabs = ["news", "categories", "urls", "users", "roles", "groups", "faqs", "email", "theme"];
    const visibleTabs = allTabs.filter(tab => canViewTab(tab));
    if (visibleTabs.length > 0 && !canViewTab(activeTab)) {
      setActiveTab(visibleTabs[0]);
      setSidebarTab(visibleTabs[0]);
    }
  }, [rolePermissions, authUser?.role, permissionsLoaded]);

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
          // Load role permissions from backend
          if (result.data.role_permissions) {
            try {
              const parsed = typeof result.data.role_permissions === 'string' 
                ? JSON.parse(result.data.role_permissions) 
                : result.data.role_permissions;
              // Deep merge: for each role, merge each section's permissions
              setRolePermissions(prev => {
                const merged: RolePermsMap = { ...prev };
                for (const [role, sections] of Object.entries(parsed)) {
                  if (typeof sections === 'object' && sections !== null) {
                    merged[role] = { ...(merged[role] || makeDefaultPerms(false)) };
                    for (const [section, perms] of Object.entries(sections as Record<string, SectionPerms>)) {
                      merged[role][section] = { ...(merged[role][section] || { read: false, write: false, delete: false }), ...perms };
                    }
                  }
                }
                return merged;
              });
            } catch { /* use defaults */ }
          }
          // Load custom roles list from backend
          if (result.data.custom_roles) {
            try {
              const parsedRoles = typeof result.data.custom_roles === 'string'
                ? JSON.parse(result.data.custom_roles)
                : result.data.custom_roles;
              if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                setCustomRoles(parsedRoles);
              }
            } catch { /* use defaults */ }
          }
          setPermissionsLoaded(true);
        }
      } catch {
        setPermissionsLoaded(true);
      }
    };
    if (backendAvailable) {
      loadSettings();
    } else {
      setPermissionsLoaded(true);
    }
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
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      showError("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      // Filter out blob: URLs - these are local-only and can't be persisted
      const persistableAttachments = articleAttachments.filter(
        (att) => !att.url.startsWith('blob:')
      );
      
      // Map attachments to the format the backend expects
      const attachmentsData = persistableAttachments.map((att) => ({
        id: att.id,
        name: att.name,
        original_name: att.name,
        filename: att.url.split('/').pop() || '',
        mime_type: att.type,
        url: att.url,
        type: att.type,
        size: 0,
      }));

      const data: any = {
        title: articleForm.title,
        content: articleForm.content,
        excerpt: articleForm.excerpt || undefined,
        category_id: articleForm.category_id || undefined,
        status: articleForm.status,
        target_groups: articleForm.target_groups,
        attachments: attachmentsData,
      };
      const result = editingArticleId
        ? await updateArticle(editingArticleId, data)
        : await createArticle(data);
      if (result.success) {
        showSuccess(editingArticleId ? "Article updated" : "Article created");
        setIsNewsDialogOpen(false);
      } else {
        showError(result.message || "Failed to save article");
      }
    } catch (err: any) {
      showError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const result = await deleteArticle(id);
    if (result.success) showSuccess("Article deleted");
    else showError(result.message || "Failed to delete");
  };

  // --- URL CATEGORIES CRUD ---
  const openNewUrlCat = () => { setEditingUrlCatId(null); setUrlCatForm({ name: "", description: "", icon: "Link", target_groups: [] }); setIsUrlCatDialogOpen(true); };
  const openEditUrlCat = (cat: URLCategory) => { setEditingUrlCatId(cat.id); setUrlCatForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "Link", target_groups: cat.target_groups?.map(g => g.id) || [] }); setIsUrlCatDialogOpen(true); };

  const handleSaveUrlCat = async () => {
    if (!urlCatForm.name.trim()) { showError("Name is required"); return; }
    setSubmitting(true);
    try {
      const data = { name: urlCatForm.name, description: urlCatForm.description, icon: urlCatForm.icon, target_groups: urlCatForm.target_groups };
      const result = editingUrlCatId ? await updateURLCategory(editingUrlCatId, data) : await createURLCategory(data);
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
  const openNewUrlLink = (catId: string) => { setEditingUrlLinkId(null); setEditingUrlCatForLink(catId); setUrlLinkForm({ title: "", url: "", description: "", icon_url: "", is_external: true }); setIsUrlDialogOpen(true); };
  const openEditUrlLink = (catId: string, link: URLLink) => { setEditingUrlLinkId(link.id); setEditingUrlCatForLink(catId); setUrlLinkForm({ title: link.title, url: link.url, description: link.description || "", icon_url: (link as any).icon_url || "", is_external: link.is_external }); setIsUrlDialogOpen(true); };

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

  // Reorder handlers
  const handleReorderCategories = async (categoryIds: string[]) => {
    try {
      const result = await urlCategoriesAPI.reorderCategories(categoryIds);
      if (result.success) {
        showSuccess("Categories reordered");
        fetchURLCategories();
      } else {
        showError(result.message || "Failed to reorder");
      }
    } catch {
      showError("An error occurred");
    }
  };

  const handleReorderLinks = async (catId: string, linkIds: string[]) => {
    try {
      const result = await urlCategoriesAPI.reorderLinks(catId, linkIds);
      if (result.success) {
        showSuccess("Links reordered");
        fetchURLCategories();
      } else {
        showError(result.message || "Failed to reorder");
      }
    } catch {
      showError("An error occurred");
    }
  };

  // Drag end handler for categories
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = urlCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = urlCategories.findIndex((cat) => cat.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(urlCategories, oldIndex, newIndex);
        const categoryIds = newCategories.map((cat) => cat.id);
        handleReorderCategories(categoryIds);
      }
    }
  };

  // --- USERS CRUD ---
  const openNewUser = () => {
    setEditingUserId(null);
    setUserForm({ name: "", email: "", password: "", confirmPassword: "", role: "user", department: "", phone: "", groups: [] });
    setShowPassword(false);
    setShowConfirmUserPassword(false);
    setUserPasswordError("");
    setIsUserDialogOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, email: user.email, password: "", confirmPassword: "", role: user.role, department: user.department || "", phone: user.phone || "", groups: user.groups?.map((g) => g.id) || [] });
    setShowPassword(false);
    setShowConfirmUserPassword(false);
    setUserPasswordError("");
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showError("Name and email required");
      return;
    }
    if (!editingUserId && !userForm.password.trim()) {
      showError("Password required for new users");
      return;
    }
    // Password match validation
    if (userForm.password.trim() && userForm.password !== userForm.confirmPassword) {
      setUserPasswordError("Passwords don't match");
      showError("Passwords don't match");
      return;
    }
    setUserPasswordError("");
    setSubmitting(true);
    try {
      if (editingUserId) {
        const data: UpdateUserData = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          department: userForm.department || undefined,
          phone: userForm.phone || undefined,
          groups: userForm.groups,
        };
        if (userForm.password.trim()) data.password = userForm.password;
        const result = await updateUser(editingUserId, data);
        if (result.success) {
          showSuccess("User updated");
          setIsUserDialogOpen(false);
        } else {
          showError(result.message || "Failed");
        }
      } else {
        const result = await createUser({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          department: userForm.department || undefined,
          phone: userForm.phone || undefined,
          groups: userForm.groups,
        });
        if (result.success) {
          showSuccess("User created");
          setIsUserDialogOpen(false);
        } else {
          showError(result.message || "Failed");
        }
      }
    } catch (err: any) {
      showError(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const result = await deleteUser(id);
    if (result.success) showSuccess("Deleted"); else showError(result.message || "Failed");
  };

  // --- GROUPS CRUD ---
  const openNewGroup = () => { setEditingGroupId(null); setGroupForm({ name: "", description: "", color: "#3B82F6", members: [], permissions: [] }); setGroupMemberSearch(""); setIsGroupDialogOpen(true); };
  const openEditGroup = async (group: Group) => {
    setEditingGroupId(group.id);
    setGroupForm({ name: group.name, description: group.description || "", color: group.color || "#3B82F6", members: [], permissions: group.permissions || [] });
    setGroupMemberSearch("");
    setGroupMembersLoading(true);
    setIsGroupDialogOpen(true);
    try {
      const result = await groupsAPI.getById(group.id);
      if (result.success && result.data) {
        const fetchedGroup = result.data;
        const memberIds = fetchedGroup.members?.map((m: any) => typeof m === "string" ? m : m.id) || [];
        setGroupForm(prev => ({ ...prev, members: memberIds }));
      }
    } catch (err) {
      console.error("Failed to fetch group members:", err);
    } finally {
      setGroupMembersLoading(false);
    }
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

  // --- NEWS CATEGORIES CRUD ---
  const fetchNewsCategories = async () => {
    setNewsCategoriesLoading(true);
    try {
      const result = await categoriesAPI.getAll();
      if (result.success && result.data) {
        setNewsCategoriesData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setNewsCategoriesLoading(false);
    }
  };

  const openNewCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", slug: "", description: "", color: "#3B82F6" });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      color: cat.color || "#3B82F6",
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { showError("Name required"); return; }
    setSubmitting(true);
    try {
      const data: CreateCategoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description || undefined,
        color: categoryForm.color,
      };
      const result = editingCategoryId
        ? await categoriesAPI.update(editingCategoryId, data)
        : await categoriesAPI.create(data);
      if (result.success) {
        showSuccess(editingCategoryId ? "Category updated" : "Category created");
        setIsCategoryDialogOpen(false);
        await fetchNewsCategories();
        await fetchCategories(); // Refresh the categories hook too
      } else {
        showError(result.message || "Failed");
      }
    } catch {
      showError("Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Articles will be unassigned.")) return;
    try {
      const result = await categoriesAPI.delete(id);
      if (result.success) {
        showSuccess("Deleted");
        await fetchNewsCategories();
        await fetchCategories();
      } else {
        showError(result.message || "Failed");
      }
    } catch {
      showError("Error");
    }
  };

  // Load news categories when tab is opened
  useEffect(() => {
    if (activeTab === "categories" && backendAvailable) {
      fetchNewsCategories();
    }
  }, [activeTab, backendAvailable]);

  // --- EMAIL SETTINGS ---
  const fetchEmailSettings = async () => {
    setEmailLoading(true);
    try {
      const result = await settingsAPI.getEmailSettings();
      if (result.success && result.data) {
        setEmailForm(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch email settings:", error);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setEmailSaving(true);
    setEmailTestResult(null);
    try {
      const result = await settingsAPI.updateEmailSettings(emailForm);
      if (result.success) {
        showSuccess("Email settings saved");
      } else {
        showError(result.message || "Failed to save email settings");
      }
    } catch {
      showError("Error saving email settings");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleTestEmailConnection = async () => {
    setEmailTestResult(null);
    try {
      const result = await settingsAPI.testEmailConnection();
      if (result.success) {
        setEmailTestResult({ success: true, message: "Connection successful! SMTP server is reachable." });
      } else {
        setEmailTestResult({ success: false, message: result.message || "Connection failed" });
      }
    } catch {
      setEmailTestResult({ success: false, message: "Failed to test connection" });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      showError("Please enter an email address");
      return;
    }
    setEmailTestResult(null);
    try {
      const result = await settingsAPI.sendTestEmail(testEmailAddress);
      if (result.success) {
        setEmailTestResult({ success: true, message: `Test email sent to ${testEmailAddress}` });
        showSuccess("Test email sent successfully");
      } else {
        setEmailTestResult({ success: false, message: result.message || "Failed to send test email" });
      }
    } catch {
      setEmailTestResult({ success: false, message: "Failed to send test email" });
    }
  };

  // Load email settings when tab is opened
  useEffect(() => {
    if (activeTab === "email" && backendAvailable) {
      fetchEmailSettings();
      fetchEmailTemplates();
    }
  }, [activeTab, backendAvailable]);

  // --- EMAIL TEMPLATES ---
  const fetchEmailTemplates = async () => {
    setTemplateLoading(true);
    try {
      const result = await settingsAPI.getEmailTemplates();
      if (result.success && result.data) {
        setEmailTemplates(prev => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      console.error("Failed to fetch email templates:", error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSaveEmailTemplates = async () => {
    setTemplateSaving(true);
    try {
      const result = await settingsAPI.updateEmailTemplates(emailTemplates);
      if (result.success) {
        showSuccess("Email templates saved");
      } else {
        showError(result.message || "Failed to save email templates");
      }
    } catch {
      showError("Error saving email templates");
    } finally {
      setTemplateSaving(false);
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
  function LoadingSection() {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  function ErrorBanner({ message }: { message: string }) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  function BackendWarning() {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Backend Not Connected</AlertTitle>
        <AlertDescription>
          The backend server is not reachable. Changes will NOT be saved.
          <br />API URL:{" "}
          <code className="font-mono text-xs">{import.meta.env.VITE_API_URL || "(not configured)"}</code>
        </AlertDescription>
      </Alert>
    );
  }

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
              { key: "news", icon: Newspaper, label: "News" },
              { key: "urls", icon: Link2, label: "URLs" },
              { key: "users", icon: Users, label: "Users" },
              { key: "faqs", icon: MessageCircleQuestion, label: "FAQs" },
              { key: "email", icon: Mail, label: "Email Settings" },
              { key: "theme", icon: Palette, label: "Theme & Logo" },
            ].filter(({ key }) => canViewTab(key) || (key === "news" && (canViewTab("news") || canViewTab("categories"))) || (key === "users" && (canViewTab("users") || canViewTab("roles") || canViewTab("groups")))).map(({ key, icon: Icon, label }) => {
              // Determine if this sidebar item should be highlighted
              const isActive = key === "news" 
                ? (activeTab === "news" || activeTab === "categories")
                : key === "users"
                ? (activeTab === "users" || activeTab === "roles" || activeTab === "groups")
                : sidebarTab === key;
              
              return (
                <Button key={key} variant={isActive ? "secondary" : "ghost"} className="w-full justify-start"
                  onClick={() => { 
                    setSidebarTab(key); 
                    setActiveTab(key); 
                  }}>
                  <Icon className="mr-2 h-4 w-4" /> {label}
                </Button>
              );
            })}
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
                    <UserIcon className="mr-2 h-4 w-4" />
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
                {/* NEWS SECTION - Articles and Categories */}
                {(canViewTab("news") || canViewTab("categories")) && (activeTab === "news" || activeTab === "categories") && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <Button variant={activeTab === "news" ? "default" : "outline"} onClick={() => { setActiveTab("news"); setSidebarTab("news"); }}>
                          News Articles
                        </Button>
                        {canViewTab("categories") && (
                          <Button variant={activeTab === "categories" ? "default" : "outline"} onClick={() => { setActiveTab("categories"); setSidebarTab("categories"); }}>
                            News Categories
                          </Button>
                        )}
                      </div>
                      {activeTab === "news" && canWriteSection("news") && <Button onClick={openNewArticle}><Plus className="mr-2 h-4 w-4" />Add Article</Button>}
                      {activeTab === "categories" && canWriteSection("categories") && <Button onClick={openNewCategory}><Plus className="mr-2 h-4 w-4" />Add Category</Button>}
                    </div>
                  </div>
                )}

                {/* USERS SECTION - Users, Roles, and Groups */}
                {(canViewTab("users") || canViewTab("roles") || canViewTab("groups")) && (activeTab === "users" || activeTab === "roles" || activeTab === "groups") && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <Button variant={activeTab === "users" ? "default" : "outline"} onClick={() => { setActiveTab("users"); setSidebarTab("users"); }}>
                          Users
                        </Button>
                        {canViewTab("groups") && (
                          <Button variant={activeTab === "groups" ? "default" : "outline"} onClick={() => { setActiveTab("groups"); setSidebarTab("groups"); }}>
                            Groups
                          </Button>
                        )}
                        {canViewTab("roles") && (
                          <Button variant={activeTab === "roles" ? "default" : "outline"} onClick={() => { setActiveTab("roles"); setSidebarTab("roles"); }}>
                            Roles
                          </Button>
                        )}
                      </div>
                      {activeTab === "users" && canWriteSection("users") && <Button onClick={openNewUser}><Plus className="mr-2 h-4 w-4" />Add User</Button>}
                      {activeTab === "groups" && canWriteSection("groups") && <Button onClick={openNewGroup}><Plus className="mr-2 h-4 w-4" />Add Group</Button>}
                    </div>
                  </div>
                )}

                {/* OTHER SECTIONS - Keep their action buttons */}
                {activeTab !== "news" && activeTab !== "categories" && activeTab !== "users" && activeTab !== "roles" && activeTab !== "groups" && (
                  <div className="flex justify-end mb-6">
                    {activeTab === "urls" && canWriteSection("urls") && <Button onClick={openNewUrlCat}><Plus className="mr-2 h-4 w-4" />Add Category</Button>}
                    {activeTab === "faqs" && canWriteSection("faqs") && <Button onClick={openNewFAQ}><Plus className="mr-2 h-4 w-4" />Add FAQ</Button>}
                  </div>
                )}

                {/* NEWS TAB */}
                {canViewTab("news") && (
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
                )}

                {/* NEWS CATEGORIES TAB */}
                {canViewTab("categories") && (
                <TabsContent value="categories" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Manage News Categories</CardTitle>
                      <CardDescription>Create and manage categories for organizing news articles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {newsCategoriesLoading ? (
                        <LoadingSection />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Slug</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead className="w-20">Articles</TableHead>
                              <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newsCategoriesData.length === 0 ? (
                              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No categories yet. Create your first category!</TableCell></TableRow>
                            ) : (
                              newsCategoriesData.map((cat) => (
                                <TableRow key={cat.id}>
                                  <TableCell className="font-medium">{cat.name}</TableCell>
                                  <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{cat.slug}</code></TableCell>
                                  <TableCell className="max-w-[200px] truncate">{cat.description || "—"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cat.color }} />
                                      <span className="text-xs text-muted-foreground">{cat.color}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{cat.article_count || 0}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => openEditCategory(cat)}><Edit2 className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
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
                )}

                {/* URL CATEGORIES TAB */}
                {canViewTab("urls") && (
                <TabsContent value="urls" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage URL Categories</CardTitle>
                      <CardDescription>Organize internal links into categories. Drag to reorder.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {urlCategoriesError && <ErrorBanner message={urlCategoriesError} />}
                      {urlCategoriesLoading ? <LoadingSection /> : urlCategories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No URL categories yet.</p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleCategoryDragEnd}
                        >
                          <SortableContext
                            items={urlCategories.map((cat) => cat.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-6">
                              {urlCategories.map((cat) => (
                                <SortableUrlCategory
                                  key={cat.id}
                                  cat={cat}
                                  onEdit={openEditUrlCat}
                                  onDelete={handleDeleteUrlCat}
                                  onAddLink={openNewUrlLink}
                                  onEditLink={openEditUrlLink}
                                  onDeleteLink={handleDeleteUrlLink}
                                  onReorderLinks={handleReorderLinks}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                )}

                {/* USERS TAB */}
                {canViewTab("users") && (
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
                )}

                {/* USER ROLES TAB */}
                {canViewTab("roles") && (
                <TabsContent value="roles" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            User Roles & Permissions
                          </CardTitle>
                          <CardDescription>
                            Configure what each user role can access and modify. Add new roles or rename existing ones. Admin always has full access.
                          </CardDescription>
                        </div>
                        <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Role</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Role</DialogTitle>
                              <DialogDescription>Create a new custom role. Role name will be lowercased and spaces replaced with underscores.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Role Name</Label>
                                <Input
                                  value={newRoleName}
                                  onChange={(e) => setNewRoleName(e.target.value)}
                                  placeholder="e.g. moderator, reviewer, manager"
                                />
                                {newRoleName && customRoles.includes(newRoleName.trim().toLowerCase().replace(/\s+/g, "_")) && (
                                  <p className="text-sm text-destructive">A role with this name already exists</p>
                                )}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { setIsAddRoleDialogOpen(false); setNewRoleName(""); }}>Cancel</Button>
                              <Button onClick={handleAddRole} disabled={!newRoleName.trim() || customRoles.includes(newRoleName.trim().toLowerCase().replace(/\s+/g, "_"))}>Create Role</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {customRoles.map((role) => (
                        <Card key={role} className={`border-2 ${role === "admin" ? "border-primary/30" : ""}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {renamingRole === role ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={renameRoleName}
                                      onChange={(e) => setRenameRoleName(e.target.value)}
                                      className="max-w-[200px] h-8"
                                      placeholder="New role name"
                                      autoFocus
                                      onKeyDown={(e) => { if (e.key === "Enter") handleRenameRole(role); if (e.key === "Escape") { setRenamingRole(null); setRenameRoleName(""); } }}
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => handleRenameRole(role)}><Check className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setRenamingRole(null); setRenameRoleName(""); }}><X className="h-4 w-4" /></Button>
                                  </div>
                                ) : (
                                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    {role.replace(/_/g, " ")}
                                    {role === "admin" && <Badge variant="default" className="ml-2 text-xs">Protected</Badge>}
                                  </CardTitle>
                                )}
                                <CardDescription>
                                  {roleDescriptions[role] || `Custom role - configure permissions below`}
                                </CardDescription>
                              </div>
                              {role !== "admin" && renamingRole !== role && (
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => { setRenamingRole(role); setRenameRoleName(role); }}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteRole(role)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {rolePermissions[role] && Object.entries(rolePermissions[role]).map(([section, perms]) => (
                                <div key={section} className="flex items-center justify-between border-b pb-3 last:border-0">
                                  <div className="flex-1">
                                    <Label className="text-sm font-medium capitalize">{section.replace(/_/g, " ")}</Label>
                                  </div>
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={perms.read}
                                        onChange={(e) => {
                                          setRolePermissions({
                                            ...rolePermissions,
                                            [role]: {
                                              ...rolePermissions[role],
                                              [section]: { ...perms, read: e.target.checked }
                                            }
                                          });
                                        }}
                                        className="rounded border-gray-300"
                                        disabled={role === "admin"}
                                      />
                                      <span className="text-sm text-muted-foreground">Read</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={perms.write}
                                        onChange={(e) => {
                                          setRolePermissions({
                                            ...rolePermissions,
                                            [role]: {
                                              ...rolePermissions[role],
                                              [section]: { ...perms, write: e.target.checked }
                                            }
                                          });
                                        }}
                                        className="rounded border-gray-300"
                                        disabled={role === "admin"}
                                      />
                                      <span className="text-sm text-muted-foreground">Write</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={perms.delete}
                                        onChange={(e) => {
                                          setRolePermissions({
                                            ...rolePermissions,
                                            [role]: {
                                              ...rolePermissions[role],
                                              [section]: { ...perms, delete: e.target.checked }
                                            }
                                          });
                                        }}
                                        className="rounded border-gray-300"
                                        disabled={role === "admin"}
                                      />
                                      <span className="text-sm text-muted-foreground">Delete</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          onClick={async () => {
                            setRolesSaving(true);
                            try {
                              // Save role permissions and custom roles to backend
                              await settingsAPI.bulkUpdate({
                                role_permissions: JSON.stringify(rolePermissions),
                                custom_roles: JSON.stringify(customRoles),
                              });
                              showSuccess("Role permissions saved successfully");
                            } catch {
                              showError("Failed to save role permissions");
                            } finally {
                              setRolesSaving(false);
                            }
                          }}
                          disabled={rolesSaving}
                        >
                          {rolesSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Permissions"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                )}

                {/* GROUPS TAB */}
                {canViewTab("groups") && (
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
                                  <TableCell>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">{group.member_count || 0} members</Badge>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-72 p-0" align="start">
                                        <GroupMemberPopover groupId={group.id} groupName={group.name} users={users} />
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
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
                )}

                {/* EMAIL SETTINGS TAB */}
                {canViewTab("email") && (
                <TabsContent value="email" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email Configuration</CardTitle>
                      <CardDescription>Configure SMTP settings for password reset emails and notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {emailLoading ? (
                        <LoadingSection />
                      ) : (
                        <>
                          {/* Enable/Disable Toggle */}
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div>
                              <Label className="text-base font-medium">Email Notifications</Label>
                              <p className="text-sm text-muted-foreground">Enable email functionality for password resets and notifications</p>
                            </div>
                            <Switch
                              checked={emailForm.email_enabled}
                              onCheckedChange={(checked) => setEmailForm({ ...emailForm, email_enabled: checked })}
                            />
                          </div>

                          {emailForm.email_enabled && (
                            <>
                              {/* SMTP Server Settings */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm border-b pb-2">SMTP Server Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>SMTP Host *</Label>
                                    <Input
                                      value={emailForm.smtp_host}
                                      onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                                      placeholder="smtp.example.com"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>SMTP Port *</Label>
                                    <Input
                                      type="number"
                                      value={emailForm.smtp_port}
                                      onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                                      placeholder="587"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>SMTP Username</Label>
                                    <Input
                                      value={emailForm.smtp_user}
                                      onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                                      placeholder="user@example.com"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>SMTP Password</Label>
                                    <div className="relative">
                                      <Input
                                        type={showSmtpPassword ? "text" : "password"}
                                        value={emailForm.smtp_password}
                                        onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                                        placeholder="••••••••"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                      >
                                        {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="smtp-secure"
                                    checked={emailForm.smtp_secure}
                                    onCheckedChange={(checked) => setEmailForm({ ...emailForm, smtp_secure: !!checked })}
                                  />
                                  <Label htmlFor="smtp-secure" className="cursor-pointer">Use SSL/TLS (port 465)</Label>
                                </div>
                              </div>

                              {/* Sender Settings */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm border-b pb-2">Sender Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>From Email *</Label>
                                    <Input
                                      type="email"
                                      value={emailForm.from_email}
                                      onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                                      placeholder="noreply@company.com"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>From Name</Label>
                                    <Input
                                      value={emailForm.from_name}
                                      onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                                      placeholder="Company Portal"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Test Email */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm border-b pb-2">Test Configuration</h4>
                                <div className="flex items-end gap-4">
                                  <div className="flex-1 space-y-2">
                                    <Label>Test Email Address</Label>
                                    <Input
                                      type="email"
                                      value={testEmailAddress}
                                      onChange={(e) => setTestEmailAddress(e.target.value)}
                                      placeholder="your@email.com"
                                    />
                                  </div>
                                  <Button variant="outline" onClick={handleTestEmailConnection} className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Test Connection
                                  </Button>
                                  <Button variant="outline" onClick={handleSendTestEmail} disabled={!testEmailAddress} className="gap-2">
                                    <Send className="h-4 w-4" />
                                    Send Test Email
                                  </Button>
                                </div>

                                {emailTestResult && (
                                  <Alert variant={emailTestResult.success ? "default" : "destructive"}>
                                    {emailTestResult.success ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    <AlertDescription>{emailTestResult.message}</AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </>
                          )}

                          {/* Save Button */}
                          <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSaveEmailSettings} disabled={emailSaving}>
                              {emailSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save Email Settings
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Email Templates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Email Templates</CardTitle>
                      <CardDescription>Customize the email templates sent for password resets, welcome emails, and notifications. Use variables like {"{{user_name}}"}, {"{{reset_url}}"}, {"{{site_name}}"}, {"{{primary_color}}"} in your templates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {templateLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      ) : (
                        <>
                          {/* Template selector tabs */}
                          <div className="flex gap-2 border-b pb-2">
                            {[
                              { key: "password_reset", label: "Password Reset" },
                              { key: "welcome", label: "Welcome Email" },
                              { key: "notification", label: "Notification" },
                            ].map(({ key, label }) => (
                              <Button
                                key={key}
                                variant={activeTemplateTab === key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveTemplateTab(key)}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>

                          {/* Available variables info */}
                          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Available Variables:</p>
                            <div className="flex flex-wrap gap-2">
                              {activeTemplateTab === "password_reset" && (
                                <>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{user_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{user_email}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{reset_url}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{site_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{primary_color}}"}</code>
                                </>
                              )}
                              {activeTemplateTab === "welcome" && (
                                <>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{user_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{user_email}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{login_url}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{site_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{primary_color}}"}</code>
                                </>
                              )}
                              {activeTemplateTab === "notification" && (
                                <>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{user_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{article_title}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{article_excerpt}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{article_url}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{site_name}}"}</code>
                                  <code className="bg-background px-1.5 py-0.5 rounded">{"{{primary_color}}"}</code>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Password Reset Template */}
                          {activeTemplateTab === "password_reset" && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                  value={emailTemplates.email_template_password_reset_subject}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_password_reset_subject: e.target.value })}
                                  placeholder="Password Reset Request"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email Body (HTML)</Label>
                                <Textarea
                                  value={emailTemplates.email_template_password_reset_body}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_password_reset_body: e.target.value })}
                                  rows={12}
                                  className="font-mono text-xs"
                                  placeholder="<h2>Password Reset</h2><p>Hello {{user_name}},</p>..."
                                />
                              </div>
                            </div>
                          )}

                          {/* Welcome Template */}
                          {activeTemplateTab === "welcome" && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                  value={emailTemplates.email_template_welcome_subject}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_welcome_subject: e.target.value })}
                                  placeholder="Welcome to {{site_name}}"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email Body (HTML)</Label>
                                <Textarea
                                  value={emailTemplates.email_template_welcome_body}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_welcome_body: e.target.value })}
                                  rows={12}
                                  className="font-mono text-xs"
                                  placeholder="<h2>Welcome!</h2><p>Hello {{user_name}},</p>..."
                                />
                              </div>
                            </div>
                          )}

                          {/* Notification Template */}
                          {activeTemplateTab === "notification" && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                  value={emailTemplates.email_template_notification_subject}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_notification_subject: e.target.value })}
                                  placeholder="New Article: {{article_title}}"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email Body (HTML)</Label>
                                <Textarea
                                  value={emailTemplates.email_template_notification_body}
                                  onChange={(e) => setEmailTemplates({ ...emailTemplates, email_template_notification_body: e.target.value })}
                                  rows={12}
                                  className="font-mono text-xs"
                                  placeholder="<h2>{{article_title}}</h2><p>Hello {{user_name}},</p>..."
                                />
                              </div>
                            </div>
                          )}

                          {/* Save Templates Button */}
                          <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSaveEmailTemplates} disabled={templateSaving}>
                              {templateSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save Templates
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Email Feature Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Email Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Password Reset Emails</p>
                            <p>Users can reset their passwords via email link from the login page</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Welcome Emails</p>
                            <p>New users receive a welcome email when their account is created</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">News Notifications</p>
                            <p>Optional email notifications when new articles are published</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                )}

                {/* THEME & LOGO TAB */}
                {canViewTab("theme") && (
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
                )}

                {/* FAQs TAB */}
                {canViewTab("faqs") && (
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
                )}
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
                  {/* Select/Deselect All Toggle */}
                  <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                    <Checkbox 
                      id="article-toggle-all"
                      checked={groups.length > 0 && articleForm.target_groups.length === groups.length}
                      onCheckedChange={(checked) => setArticleForm({ ...articleForm, target_groups: checked ? groups.map(g => g.id) : [] })}
                    />
                    <Label htmlFor="article-toggle-all" className="cursor-pointer font-medium">
                      {articleForm.target_groups.length === groups.length ? "Deselect All" : "Select All Groups"}
                    </Label>
                  </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingUrlCatId ? "Edit Category" : "New URL Category"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name *</Label><Input value={urlCatForm.name} onChange={(e) => setUrlCatForm({ ...urlCatForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Input value={urlCatForm.description} onChange={(e) => setUrlCatForm({ ...urlCatForm, description: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select value={urlCatForm.icon} onValueChange={(value) => setUrlCatForm({ ...urlCatForm, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="Link"><span className="flex items-center gap-2"><Link className="h-4 w-4" /> Link</span></SelectItem>
                  <SelectItem value="Link2"><span className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Link2</span></SelectItem>
                  <SelectItem value="Globe"><span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Globe</span></SelectItem>
                  <SelectItem value="BookOpen"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Book</span></SelectItem>
                  <SelectItem value="FileText"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> File</span></SelectItem>
                  <SelectItem value="Briefcase"><span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Briefcase</span></SelectItem>
                  <SelectItem value="Heart"><span className="flex items-center gap-2"><Heart className="h-4 w-4" /> Heart</span></SelectItem>
                  <SelectItem value="Star"><span className="flex items-center gap-2"><Star className="h-4 w-4" /> Star</span></SelectItem>
                  <SelectItem value="Folder"><span className="flex items-center gap-2"><Folder className="h-4 w-4" /> Folder</span></SelectItem>
                  <SelectItem value="HelpCircle"><span className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Help</span></SelectItem>
                  <SelectItem value="Settings"><span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</span></SelectItem>
                  <SelectItem value="Users"><span className="flex items-center gap-2"><Users className="h-4 w-4" /> Users</span></SelectItem>
                  <SelectItem value="Mail"><span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Mail</span></SelectItem>
                  <SelectItem value="Phone"><span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</span></SelectItem>
                  <SelectItem value="MapPin"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span></SelectItem>
                  <SelectItem value="Calendar"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Calendar</span></SelectItem>
                  <SelectItem value="Clock"><span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Clock</span></SelectItem>
                  <SelectItem value="Shield"><span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Shield</span></SelectItem>
                  <SelectItem value="Zap"><span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Lightning</span></SelectItem>
                  <SelectItem value="Database"><span className="flex items-center gap-2"><Database className="h-4 w-4" /> Database</span></SelectItem>
                  <SelectItem value="Code"><span className="flex items-center gap-2"><Code className="h-4 w-4" /> Code</span></SelectItem>
                  <SelectItem value="Image"><span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image</span></SelectItem>
                  <SelectItem value="Video"><span className="flex items-center gap-2"><Video className="h-4 w-4" /> Video</span></SelectItem>
                  <SelectItem value="Music"><span className="flex items-center gap-2"><Music className="h-4 w-4" /> Music</span></SelectItem>
                  <SelectItem value="Download"><span className="flex items-center gap-2"><Download className="h-4 w-4" /> Download</span></SelectItem>
                  <SelectItem value="Upload"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload</span></SelectItem>
                  <SelectItem value="Search"><span className="flex items-center gap-2"><Search className="h-4 w-4" /> Search</span></SelectItem>
                  <SelectItem value="Home"><span className="flex items-center gap-2"><Home className="h-4 w-4" /> Home</span></SelectItem>
                  <SelectItem value="ExternalLink"><span className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> External Link</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Visible to Groups (leave empty for all users)</Label>
              <ScrollArea className="h-[120px] border rounded-md p-3">
                <div className="space-y-2">
                  {/* Select/Deselect All */}
                  <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                    <Checkbox 
                      id="url-cat-toggle-all"
                      checked={groups.length > 0 && urlCatForm.target_groups.length === groups.length}
                      onCheckedChange={(checked) => setUrlCatForm({ ...urlCatForm, target_groups: checked ? groups.map(g => g.id) : [] })}
                    />
                    <Label htmlFor="url-cat-toggle-all" className="cursor-pointer font-medium">
                      {urlCatForm.target_groups.length === groups.length ? "Deselect All" : "Select All Groups"}
                    </Label>
                  </div>
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox id={`url-cat-group-${group.id}`} checked={urlCatForm.target_groups.includes(group.id)}
                        onCheckedChange={(checked) => setUrlCatForm({ ...urlCatForm, target_groups: checked ? [...urlCatForm.target_groups, group.id] : urlCatForm.target_groups.filter((id) => id !== group.id) })} />
                      <Label htmlFor={`url-cat-group-${group.id}`} className="cursor-pointer flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />{group.name}
                      </Label>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups available.</p>}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">If no groups are selected, this category will be visible to all users.</p>
            </div>
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
            <div className="grid gap-2">
              <Label>Favicon Icon (optional)</Label>
              <div className="space-y-2">
                {urlLinkForm.icon_url && (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <img 
                      src={urlLinkForm.icon_url.startsWith('/') ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${urlLinkForm.icon_url}` : urlLinkForm.icon_url} 
                      alt="Current favicon" 
                      className="h-6 w-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {urlLinkForm.icon_url.split('/').pop() || urlLinkForm.icon_url}
                    </span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => setUrlLinkForm({ ...urlLinkForm, icon_url: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input 
                  type="file"
                  accept="image/*,.ico"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const result = await urlCategoriesAPI.uploadLinkIcon(file);
                        if (result.success && result.data?.url) {
                          setUrlLinkForm({ ...urlLinkForm, icon_url: result.data.url });
                        } else {
                          showError(result.message || "Failed to upload icon");
                        }
                      } catch {
                        showError("Error uploading icon file");
                      }
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Upload a small image or .ico file to display as favicon (16x16px recommended)</p>
              </div>
            </div>
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
                  <Input type={showPassword ? "text" : "password"} value={userForm.password} onChange={(e) => { setUserForm({ ...userForm, password: e.target.value }); if (userPasswordError) setUserPasswordError(""); }} placeholder={editingUserId ? "Leave blank to keep current" : "Enter password"} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Confirm Password {editingUserId ? "" : "*"}</Label>
                <div className="relative">
                  <Input type={showConfirmUserPassword ? "text" : "password"} value={userForm.confirmPassword} onChange={(e) => { setUserForm({ ...userForm, confirmPassword: e.target.value }); if (userPasswordError) setUserPasswordError(""); }} placeholder="Confirm password" className={userPasswordError ? "border-red-500 focus-visible:ring-red-500" : ""} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmUserPassword(!showConfirmUserPassword)}>
                    {showConfirmUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {userPasswordError && <p className="text-sm text-red-500 font-medium">{userPasswordError}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(val) => setUserForm({ ...userForm, role: val as "user" | "admin" | "editor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {customRoles.map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">{role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                    ))}
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
              <div className="flex items-center justify-between">
                <Label>Members</Label>
                <span className="text-xs text-muted-foreground">{groupForm.members.length} selected</span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={groupMemberSearch}
                  onChange={(e) => setGroupMemberSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {groupMembersLoading ? (
                <div className="flex items-center justify-center h-[150px] border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading members...</span>
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-2">
                    {/* Show selected members first */}
                    {(() => {
                      const searchLower = groupMemberSearch.toLowerCase();
                      const filtered = users.filter(
                        (user) =>
                          (user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower))
                      );
                      const selected = filtered.filter(u => groupForm.members.includes(u.id));
                      const unselected = filtered.filter(u => !groupForm.members.includes(u.id));
                      const sorted = [...selected, ...unselected];
                      
                      if (sorted.length === 0 && groupMemberSearch) {
                        return <p className="text-sm text-muted-foreground">No users matching "{groupMemberSearch}"</p>;
                      }
                      
                      return sorted.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox id={`group-member-${user.id}`} checked={groupForm.members.includes(user.id)}
                            onCheckedChange={(checked) => setGroupForm({ ...groupForm, members: checked ? [...groupForm.members, user.id] : groupForm.members.filter((id) => id !== user.id) })} />
                          <Label htmlFor={`group-member-${user.id}`} className="cursor-pointer">{user.name} ({user.email})</Label>
                        </div>
                      ));
                    })()}
                    {users.length === 0 && <p className="text-sm text-muted-foreground">No users available.</p>}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingGroupId ? "Save Changes" : "Create Group"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategoryId ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategoryId ? "Update the category details." : "Create a new category for organizing news articles."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="category-slug (auto-generated if empty)"
              />
              <p className="text-xs text-muted-foreground">URL-friendly identifier. Leave blank to auto-generate from name.</p>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategoryId ? "Save Changes" : "Create Category"}
            </Button>
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
