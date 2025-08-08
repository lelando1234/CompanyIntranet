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
import { Search, Plus, Settings } from "lucide-react";
import PermissionManager from "@/components/PermissionManager";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("news");

  // Mock data for news articles
  const [newsArticles, setNewsArticles] = useState([
    {
      id: "1",
      title: "Company Quarterly Results",
      author: "John Smith",
      date: "2023-06-15",
      content:
        "Our company has exceeded quarterly expectations with a 15% growth in revenue...",
      published: true,
    },
    {
      id: "2",
      title: "New Office Opening",
      author: "Jane Doe",
      date: "2023-06-10",
      content:
        "We are excited to announce the opening of our new office in Chicago...",
      published: true,
    },
    {
      id: "3",
      title: "Product Launch Announcement",
      author: "Mike Johnson",
      date: "2023-06-05",
      content:
        "Get ready for our biggest product launch yet, coming next month...",
      published: false,
    },
  ]);

  // Mock data for URL categories
  const [urlCategories, setUrlCategories] = useState([
    {
      id: "1",
      name: "HR Resources",
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

  // Mock side navigation component since we're removing the import
  const SideNavigation = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-8 w-8 rounded-full bg-primary"></div>
          <h2 className="text-lg font-bold">Company Portal</h2>
        </div>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-accent">
            Admin Panel
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start">
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
                />
              </div>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs
            defaultValue="news"
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="news">News Articles</TabsTrigger>
                <TabsTrigger value="urls">URL Categories</TabsTrigger>
                <TabsTrigger value="permissions">User Permissions</TabsTrigger>
              </TabsList>
              {activeTab !== "permissions" && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {activeTab === "news" ? "Article" : "Category"}
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
                    <div className="flex justify-between items-center">
                      <Input
                        placeholder="Search articles..."
                        className="max-w-sm"
                      />
                      <div className="flex space-x-2">
                        <Button variant="outline">Filter</Button>
                        <Button variant="outline">Sort</Button>
                      </div>
                    </div>
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Title</th>
                            <th className="text-left p-3 font-medium">
                              Author
                            </th>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                            <th className="text-right p-3 font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {newsArticles.map((article) => (
                            <tr
                              key={article.id}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="p-3">{article.title}</td>
                              <td className="p-3">{article.author}</td>
                              <td className="p-3">{article.date}</td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${article.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                >
                                  {article.published ? "Published" : "Draft"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                          <h3 className="text-lg font-medium">
                            {category.name}
                          </h3>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Edit Category
                            </Button>
                            <Button variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Add URL
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium">
                                  Title
                                </th>
                                <th className="text-left p-3 font-medium">
                                  URL
                                </th>
                                <th className="text-right p-3 font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.urls.map((url) => (
                                <tr
                                  key={url.id}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-3">{url.title}</td>
                                  <td className="p-3">
                                    <a
                                      href={url.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline truncate block max-w-md"
                                    >
                                      {url.url}
                                    </a>
                                  </td>
                                  <td className="p-3 text-right">
                                    <Button variant="ghost" size="sm">
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Permissions Tab */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>Manage User Permissions</CardTitle>
                  <CardDescription>
                    Assign URL access permissions to individual users or groups.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
