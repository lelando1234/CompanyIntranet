import React, { useState } from "react";
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
  Home,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import { useNavigate } from "react-router-dom";

// Types
interface NewsArticle {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
  category: string;
  published: boolean;
}

interface URL {
  id: string;
  title: string;
  url: string;
}

interface URLCategory {
  id: string;
  name: string;
  description: string;
  urls: URL[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  permissions: string[];
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("news");
  const [sidebarTab, setSidebarTab] = useState("news");

  // News Articles State
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([
    {
      id: "1",
      title: "Company Quarterly Results",
      author: "John Smith",
      date: "2023-06-15",
      content:
        "Our company has exceeded quarterly expectations with a 15% growth in revenue...",
      category: "Finance",
      published: true,
    },
    {
      id: "2",
      title: "New Office Opening",
      author: "Jane Doe",
      date: "2023-06-10",
      content:
        "We are excited to announce the opening of our new office in Chicago...",
      category: "Announcements",
      published: true,
    },
    {
      id: "3",
      title: "Product Launch Announcement",
      author: "Mike Johnson",
      date: "2023-06-05",
      content:
        "Get ready for our biggest product launch yet, coming next month...",
      category: "Products",
      published: false,
    },
  ]);

  // URL Categories State
  const [urlCategories, setUrlCategories] = useState<URLCategory[]>([
    {
      id: "1",
      name: "HR Resources",
      description: "Human Resources links and tools",
      urls: [
        {
          id: "101",
          title: "Employee Handbook",
          url: "https://internal.company.com/hr/handbook",
        },
        {
          id: "102",
          title: "Benefits Portal",
          url: "https://internal.company.com/hr/benefits",
        },
      ],
    },
    {
      id: "2",
      name: "IT Support",
      description: "IT related resources",
      urls: [
        {
          id: "201",
          title: "Help Desk",
          url: "https://internal.company.com/it/helpdesk",
        },
        {
          id: "202",
          title: "Software Requests",
          url: "https://internal.company.com/it/software",
        },
      ],
    },
    {
      id: "3",
      name: "Marketing",
      description: "Marketing assets and tools",
      urls: [
        {
          id: "301",
          title: "Brand Guidelines",
          url: "https://internal.company.com/marketing/brand",
        },
        {
          id: "302",
          title: "Asset Library",
          url: "https://internal.company.com/marketing/assets",
        },
      ],
    },
  ]);

  // Users State
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", permissions: ["news", "hr-resources", "it-support"] },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor", permissions: ["news", "marketing"] },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", permissions: ["hr-resources"] },
    { id: "4", name: "Alice Williams", email: "alice@example.com", role: "User", permissions: [] },
  ]);

  // Groups State
  const [groups, setGroups] = useState<Group[]>([
    { id: "1", name: "Marketing", description: "Marketing team members", members: ["2"], permissions: ["news", "marketing"] },
    { id: "2", name: "Engineering", description: "Engineering team", members: ["3"], permissions: ["it-support"] },
    { id: "3", name: "HR", description: "Human Resources team", members: ["4"], permissions: ["hr-resources", "news"] },
    { id: "4", name: "Executive", description: "Executive leadership", members: ["1"], permissions: ["news", "hr-resources", "it-support", "marketing"] },
  ]);

  // Dialog States
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  // Edit States
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [editingCategory, setEditingCategory] = useState<URLCategory | null>(null);
  const [editingUrl, setEditingUrl] = useState<{ url: URL; categoryId: string } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Form States
  const [newArticle, setNewArticle] = useState<Partial<NewsArticle>>({
    title: "",
    author: "",
    content: "",
    category: "General",
    published: false,
  });

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newUrl, setNewUrl] = useState({ title: "", url: "", categoryId: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "User", permissions: [] as string[] });
  const [newGroup, setNewGroup] = useState({ name: "", description: "", members: [] as string[], permissions: [] as string[] });

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Available permissions (including News Articles)
  const availablePermissions = [
    { id: "news", name: "News Articles" },
    ...urlCategories.map(cat => ({ id: cat.name.toLowerCase().replace(/\s+/g, "-"), name: cat.name })),
  ];

  // --- News Articles CRUD ---
  const handleAddArticle = () => {
    const article: NewsArticle = {
      id: Date.now().toString(),
      title: newArticle.title || "",
      author: newArticle.author || "",
      date: new Date().toISOString().split("T")[0],
      content: newArticle.content || "",
      category: newArticle.category || "General",
      published: newArticle.published || false,
    };
    setNewsArticles([...newsArticles, article]);
    setNewArticle({ title: "", author: "", content: "", category: "General", published: false });
    setIsNewsDialogOpen(false);
  };

  const handleEditArticle = () => {
    if (!editingArticle) return;
    setNewsArticles(newsArticles.map(a => a.id === editingArticle.id ? editingArticle : a));
    setEditingArticle(null);
    setIsNewsDialogOpen(false);
  };

  const handleDeleteArticle = (id: string) => {
    setNewsArticles(newsArticles.filter(a => a.id !== id));
  };

  // --- URL Categories CRUD ---
  const handleAddCategory = () => {
    const category: URLCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      urls: [],
    };
    setUrlCategories([...urlCategories, category]);
    setNewCategory({ name: "", description: "" });
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = () => {
    if (!editingCategory) return;
    setUrlCategories(urlCategories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    setUrlCategories(urlCategories.filter(c => c.id !== id));
  };

  // --- URLs CRUD ---
  const handleAddUrl = () => {
    const url: URL = {
      id: Date.now().toString(),
      title: newUrl.title,
      url: newUrl.url,
    };
    setUrlCategories(urlCategories.map(c => 
      c.id === newUrl.categoryId ? { ...c, urls: [...c.urls, url] } : c
    ));
    setNewUrl({ title: "", url: "", categoryId: "" });
    setIsUrlDialogOpen(false);
  };

  const handleEditUrl = () => {
    if (!editingUrl) return;
    setUrlCategories(urlCategories.map(c => 
      c.id === editingUrl.categoryId 
        ? { ...c, urls: c.urls.map(u => u.id === editingUrl.url.id ? editingUrl.url : u) }
        : c
    ));
    setEditingUrl(null);
    setIsUrlDialogOpen(false);
  };

  const handleDeleteUrl = (categoryId: string, urlId: string) => {
    setUrlCategories(urlCategories.map(c => 
      c.id === categoryId ? { ...c, urls: c.urls.filter(u => u.id !== urlId) } : c
    ));
  };

  // --- Users CRUD ---
  const handleAddUser = () => {
    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
    };
    setUsers([...users, user]);
    setNewUser({ name: "", email: "", role: "User", permissions: [] });
    setIsUserDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    setIsUserDialogOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    // Also remove from groups
    setGroups(groups.map(g => ({ ...g, members: g.members.filter(m => m !== id) })));
  };

  // --- Groups CRUD ---
  const handleAddGroup = () => {
    const group: Group = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      members: newGroup.members,
      permissions: newGroup.permissions,
    };
    setGroups([...groups, group]);
    setNewGroup({ name: "", description: "", members: [], permissions: [] });
    setIsGroupDialogOpen(false);
  };

  const handleEditGroup = () => {
    if (!editingGroup) return;
    setGroups(groups.map(g => g.id === editingGroup.id ? editingGroup : g));
    setEditingGroup(null);
    setIsGroupDialogOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  // Filter articles based on search
  const filteredArticles = newsArticles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Side Navigation Component
  const SideNavigation = () => {
    return (
      <div className="p-4 space-y-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
          <h2 className="text-lg font-bold">Company Portal</h2>
        </div>
        
        <div className="space-y-1 flex-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => navigate("/")}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          
          <div className="py-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">ADMIN SECTIONS</p>
          </div>
          
          <Button 
            variant={sidebarTab === "news" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => { setSidebarTab("news"); setActiveTab("news"); }}
          >
            <Newspaper className="mr-2 h-4 w-4" />
            News Articles
          </Button>
          <Button 
            variant={sidebarTab === "urls" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => { setSidebarTab("urls"); setActiveTab("urls"); }}
          >
            <Link2 className="mr-2 h-4 w-4" />
            URL Categories
          </Button>
          <Button 
            variant={sidebarTab === "users" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => { setSidebarTab("users"); setActiveTab("users"); }}
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
          <Button 
            variant={sidebarTab === "groups" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => { setSidebarTab("groups"); setActiveTab("groups"); }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Groups
          </Button>
          <Button 
            variant={sidebarTab === "theme" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => { setSidebarTab("theme"); setActiveTab("theme"); }}
          >
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </Button>
        </div>

        <div className="border-t pt-4 space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => setIsHelpDialogOpen(true)}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Support
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Side Navigation */}
      <div className="hidden md:block w-64 border-r bg-card">
        <SideNavigation />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-[200px] pl-8 md:w-[300px] bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs
            value={activeTab}
            className="w-full"
            onValueChange={(val) => { setActiveTab(val); setSidebarTab(val); }}
          >
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="news">News Articles</TabsTrigger>
                <TabsTrigger value="urls">URL Categories</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
              </TabsList>
              {activeTab === "news" && (
                <Button onClick={() => { setEditingArticle(null); setIsNewsDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Article
                </Button>
              )}
              {activeTab === "urls" && (
                <Button onClick={() => { setEditingCategory(null); setIsCategoryDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              )}
              {activeTab === "users" && (
                <Button onClick={() => { setEditingUser(null); setIsUserDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              )}
              {activeTab === "groups" && (
                <Button onClick={() => { setEditingGroup(null); setIsGroupDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              )}
            </div>

            {/* News Articles Tab */}
            <TabsContent value="news" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage News Articles</CardTitle>
                  <CardDescription>
                    Create, edit, and delete news articles that will appear on
                    the company dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredArticles.map((article) => (
                            <TableRow key={article.id}>
                              <TableCell className="font-medium">{article.title}</TableCell>
                              <TableCell>{article.author}</TableCell>
                              <TableCell>{article.category}</TableCell>
                              <TableCell>{article.date}</TableCell>
                              <TableCell>
                                <Badge variant={article.published ? "default" : "secondary"}>
                                  {article.published ? "Published" : "Draft"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingArticle(article);
                                    setIsNewsDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL Categories Tab */}
            <TabsContent value="urls" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage URL Categories</CardTitle>
                  <CardDescription>
                    Organize internal links into categories and manage the URLs
                    within each category.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {urlCategories.map((category) => (
                      <div key={category.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-lg font-medium">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCategory(category);
                                setIsCategoryDialogOpen(true);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewUrl({ ...newUrl, categoryId: category.id });
                                setEditingUrl(null);
                                setIsUrlDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add URL
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {category.urls.map((url) => (
                                <TableRow key={url.id}>
                                  <TableCell>{url.title}</TableCell>
                                  <TableCell>
                                    <a
                                      href={url.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline truncate block max-w-md"
                                    >
                                      {url.url}
                                    </a>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingUrl({ url, categoryId: category.id });
                                        setIsUrlDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => handleDeleteUrl(category.id, url.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>
                    Add, edit, and delete users. Assign permissions including News Articles access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.permissions.length > 0 ? (
                                  user.permissions.slice(0, 3).map(p => (
                                    <Badge key={p} variant="secondary" className="text-xs">
                                      {availablePermissions.find(ap => ap.id === p)?.name || p}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No permissions</span>
                                )}
                                {user.permissions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{user.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsUserDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Groups</CardTitle>
                  <CardDescription>
                    Create and manage user groups with shared permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{group.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{group.members.length} members</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {group.permissions.length > 0 ? (
                                  group.permissions.slice(0, 2).map(p => (
                                    <Badge key={p} variant="secondary" className="text-xs">
                                      {availablePermissions.find(ap => ap.id === p)?.name || p}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No permissions</span>
                                )}
                                {group.permissions.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{group.permissions.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingGroup(group);
                                  setIsGroupDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme">
              <ThemeCustomizer />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* News Article Dialog */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit Article" : "Add New Article"}</DialogTitle>
            <DialogDescription>
              {editingArticle ? "Update the article details below." : "Fill in the details for the new article."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editingArticle?.title || newArticle.title}
                onChange={(e) => editingArticle 
                  ? setEditingArticle({ ...editingArticle, title: e.target.value })
                  : setNewArticle({ ...newArticle, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={editingArticle?.author || newArticle.author}
                  onChange={(e) => editingArticle 
                    ? setEditingArticle({ ...editingArticle, author: e.target.value })
                    : setNewArticle({ ...newArticle, author: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingArticle?.category || newArticle.category}
                  onValueChange={(value) => editingArticle 
                    ? setEditingArticle({ ...editingArticle, category: value })
                    : setNewArticle({ ...newArticle, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Announcements">Announcements</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Products">Products</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                rows={5}
                value={editingArticle?.content || newArticle.content}
                onChange={(e) => editingArticle 
                  ? setEditingArticle({ ...editingArticle, content: e.target.value })
                  : setNewArticle({ ...newArticle, content: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={editingArticle?.published || newArticle.published}
                onCheckedChange={(checked) => editingArticle 
                  ? setEditingArticle({ ...editingArticle, published: !!checked })
                  : setNewArticle({ ...newArticle, published: !!checked })
                }
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingArticle ? handleEditArticle : handleAddArticle}>
              {editingArticle ? "Save Changes" : "Add Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category details." : "Create a new URL category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="catName">Name</Label>
              <Input
                id="catName"
                value={editingCategory?.name || newCategory.name}
                onChange={(e) => editingCategory 
                  ? setEditingCategory({ ...editingCategory, name: e.target.value })
                  : setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catDesc">Description</Label>
              <Input
                id="catDesc"
                value={editingCategory?.description || newCategory.description}
                onChange={(e) => editingCategory 
                  ? setEditingCategory({ ...editingCategory, description: e.target.value })
                  : setNewCategory({ ...newCategory, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleEditCategory : handleAddCategory}>
              {editingCategory ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUrl ? "Edit URL" : "Add New URL"}</DialogTitle>
            <DialogDescription>
              {editingUrl ? "Update the URL details." : "Add a new URL to this category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="urlTitle">Title</Label>
              <Input
                id="urlTitle"
                value={editingUrl?.url.title || newUrl.title}
                onChange={(e) => editingUrl 
                  ? setEditingUrl({ ...editingUrl, url: { ...editingUrl.url, title: e.target.value } })
                  : setNewUrl({ ...newUrl, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="urlAddress">URL</Label>
              <Input
                id="urlAddress"
                value={editingUrl?.url.url || newUrl.url}
                onChange={(e) => editingUrl 
                  ? setEditingUrl({ ...editingUrl, url: { ...editingUrl.url, url: e.target.value } })
                  : setNewUrl({ ...newUrl, url: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingUrl ? handleEditUrl : handleAddUrl}>
              {editingUrl ? "Save Changes" : "Add URL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user details and permissions." : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={editingUser?.name || newUser.name}
                  onChange={(e) => editingUser 
                    ? setEditingUser({ ...editingUser, name: e.target.value })
                    : setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={editingUser?.email || newUser.email}
                  onChange={(e) => editingUser 
                    ? setEditingUser({ ...editingUser, email: e.target.value })
                    : setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userRole">Role</Label>
              <Select
                value={editingUser?.role || newUser.role}
                onValueChange={(value) => editingUser 
                  ? setEditingUser({ ...editingUser, role: value })
                  : setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select which resources this user can access (including News Articles):
              </p>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={(editingUser?.permissions || newUser.permissions).includes(perm.id)}
                        onCheckedChange={(checked) => {
                          const currentPerms = editingUser?.permissions || newUser.permissions;
                          const updatedPerms = checked 
                            ? [...currentPerms, perm.id]
                            : currentPerms.filter(p => p !== perm.id);
                          if (editingUser) {
                            setEditingUser({ ...editingUser, permissions: updatedPerms });
                          } else {
                            setNewUser({ ...newUser, permissions: updatedPerms });
                          }
                        }}
                      />
                      <Label htmlFor={`perm-${perm.id}`} className="cursor-pointer">
                        {perm.name}
                        {perm.id === "news" && (
                          <Badge variant="outline" className="ml-2 text-xs">News</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingUser ? handleEditUser : handleAddUser}>
              {editingUser ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Add New Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup ? "Update group details and members." : "Create a new user group."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="groupName">Name</Label>
                <Input
                  id="groupName"
                  value={editingGroup?.name || newGroup.name}
                  onChange={(e) => editingGroup 
                    ? setEditingGroup({ ...editingGroup, name: e.target.value })
                    : setNewGroup({ ...newGroup, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="groupDesc">Description</Label>
                <Input
                  id="groupDesc"
                  value={editingGroup?.description || newGroup.description}
                  onChange={(e) => editingGroup 
                    ? setEditingGroup({ ...editingGroup, description: e.target.value })
                    : setNewGroup({ ...newGroup, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Members</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select users to add to this group:
              </p>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${user.id}`}
                        checked={(editingGroup?.members || newGroup.members).includes(user.id)}
                        onCheckedChange={(checked) => {
                          const currentMembers = editingGroup?.members || newGroup.members;
                          const updatedMembers = checked 
                            ? [...currentMembers, user.id]
                            : currentMembers.filter(m => m !== user.id);
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, members: updatedMembers });
                          } else {
                            setNewGroup({ ...newGroup, members: updatedMembers });
                          }
                        }}
                      />
                      <Label htmlFor={`member-${user.id}`} className="cursor-pointer">
                        {user.name} ({user.email})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select which resources this group can access:
              </p>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-perm-${perm.id}`}
                        checked={(editingGroup?.permissions || newGroup.permissions).includes(perm.id)}
                        onCheckedChange={(checked) => {
                          const currentPerms = editingGroup?.permissions || newGroup.permissions;
                          const updatedPerms = checked 
                            ? [...currentPerms, perm.id]
                            : currentPerms.filter(p => p !== perm.id);
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, permissions: updatedPerms });
                          } else {
                            setNewGroup({ ...newGroup, permissions: updatedPerms });
                          }
                        }}
                      />
                      <Label htmlFor={`group-perm-${perm.id}`} className="cursor-pointer">
                        {perm.name}
                        {perm.id === "news" && (
                          <Badge variant="outline" className="ml-2 text-xs">News</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingGroup ? handleEditGroup : handleAddGroup}>
              {editingGroup ? "Save Changes" : "Add Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your portal settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label>Portal Name</Label>
              <Input defaultValue="Company Portal" />
            </div>
            <div className="grid gap-2">
              <Label>Admin Email</Label>
              <Input type="email" defaultValue="admin@company.com" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="notifications" defaultChecked />
              <Label htmlFor="notifications">Enable email notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="analytics" defaultChecked />
              <Label htmlFor="analytics">Enable analytics tracking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSettingsDialogOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get help with using the Company Portal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access the full documentation for the Company Portal admin features.
                </p>
                <Button variant="link" className="px-0 mt-2">
                  View Documentation →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Need help? Reach out to our support team.
                </p>
                <p className="text-sm mt-2">
                  Email: <a href="mailto:support@company.com" className="text-blue-600">support@company.com</a>
                </p>
                <p className="text-sm">
                  Phone: <a href="tel:+1234567890" className="text-blue-600">+1 (234) 567-890</a>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">How do I add a new user?</p>
                    <p className="text-muted-foreground">Go to Users tab and click "Add User".</p>
                  </div>
                  <div>
                    <p className="font-medium">How do I manage permissions?</p>
                    <p className="text-muted-foreground">Edit a user or group to assign permissions including News Articles access.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
