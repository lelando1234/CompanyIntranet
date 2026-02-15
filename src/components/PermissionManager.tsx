import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Link,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface URL {
  id: string;
  title: string;
  url: string;
  category: string;
  accessType: "public" | "restricted";
}

interface Permission {
  id: string;
  urlId: string;
  entityType: "user" | "group";
  entityId: string;
  entityName: string;
}

const PermissionManager = () => {
  // Mock data - would be fetched from API in real implementation
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User" },
    {
      id: "4",
      name: "Alice Williams",
      email: "alice@example.com",
      role: "User",
    },
  ]);

  const [groups, setGroups] = useState<Group[]>([
    { id: "1", name: "Marketing", memberCount: 8 },
    { id: "2", name: "Engineering", memberCount: 12 },
    { id: "3", name: "HR", memberCount: 5 },
    { id: "4", name: "Executive", memberCount: 4 },
  ]);

  const [urls, setUrls] = useState<URL[]>([
    {
      id: "1",
      title: "Company Wiki",
      url: "https://wiki.internal.company.com",
      category: "Documentation",
      accessType: "public",
    },
    {
      id: "2",
      title: "HR Portal",
      url: "https://hr.internal.company.com",
      category: "HR",
      accessType: "restricted",
    },
    {
      id: "3",
      title: "Engineering Docs",
      url: "https://engineering.internal.company.com",
      category: "Documentation",
      accessType: "restricted",
    },
    {
      id: "4",
      title: "Marketing Assets",
      url: "https://assets.internal.company.com",
      category: "Marketing",
      accessType: "restricted",
    },
  ]);

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "1",
      urlId: "2",
      entityType: "group",
      entityId: "3",
      entityName: "HR",
    },
    {
      id: "2",
      urlId: "3",
      entityType: "group",
      entityId: "2",
      entityName: "Engineering",
    },
    {
      id: "3",
      urlId: "4",
      entityType: "group",
      entityId: "1",
      entityName: "Marketing",
    },
    {
      id: "4",
      urlId: "3",
      entityType: "user",
      entityId: "1",
      entityName: "John Doe",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<URL | null>(null);
  const [isAddPermissionDialogOpen, setIsAddPermissionDialogOpen] =
    useState(false);
  const [isAddUrlDialogOpen, setIsAddUrlDialogOpen] = useState(false);
  const [newUrlData, setNewUrlData] = useState({
    title: "",
    url: "",
    category: "",
    accessType: "public" as "public" | "restricted",
  });
  const [permissionType, setPermissionType] = useState<"user" | "group">(
    "user",
  );
  const [selectedEntity, setSelectedEntity] = useState("");

  // Filter URLs based on search term
  const filteredUrls = urls.filter(
    (url) =>
      url.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get permissions for selected URL
  const urlPermissions = selectedUrl
    ? permissions.filter((permission) => permission.urlId === selectedUrl.id)
    : [];

  // Add new URL
  const handleAddUrl = () => {
    const newUrl: URL = {
      id: (urls.length + 1).toString(),
      ...newUrlData,
    };
    setUrls([...urls, newUrl]);
    setNewUrlData({ title: "", url: "", category: "", accessType: "public" });
    setIsAddUrlDialogOpen(false);
  };

  // Delete URL
  const handleDeleteUrl = (urlId: string) => {
    setUrls(urls.filter((url) => url.id !== urlId));
    setPermissions(
      permissions.filter((permission) => permission.urlId !== urlId),
    );
    if (selectedUrl?.id === urlId) {
      setSelectedUrl(null);
    }
  };

  // Add permission
  const handleAddPermission = () => {
    if (!selectedUrl || !selectedEntity) return;

    const entityName =
      permissionType === "user"
        ? users.find((user) => user.id === selectedEntity)?.name || ""
        : groups.find((group) => group.id === selectedEntity)?.name || "";

    const newPermission: Permission = {
      id: (permissions.length + 1).toString(),
      urlId: selectedUrl.id,
      entityType: permissionType,
      entityId: selectedEntity,
      entityName,
    };

    setPermissions([...permissions, newPermission]);
    setIsAddPermissionDialogOpen(false);
    setSelectedEntity("");
  };

  // Remove permission
  const handleRemovePermission = (permissionId: string) => {
    setPermissions(
      permissions.filter((permission) => permission.id !== permissionId),
    );
  };

  return (
    <div className="bg-background p-6 rounded-lg w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Permission Manager</CardTitle>
          <CardDescription>
            Manage access permissions for internal URLs. Assign URLs to specific
            users or groups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="urls" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="urls">URLs</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="urls" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search URLs..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog
                  open={isAddUrlDialogOpen}
                  onOpenChange={setIsAddUrlDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add URL
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New URL</DialogTitle>
                      <DialogDescription>
                        Add a new internal URL to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="title" className="text-right">
                          Title
                        </label>
                        <Input
                          id="title"
                          className="col-span-3"
                          value={newUrlData.title}
                          onChange={(e) =>
                            setNewUrlData({
                              ...newUrlData,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="url" className="text-right">
                          URL
                        </label>
                        <Input
                          id="url"
                          className="col-span-3"
                          value={newUrlData.url}
                          onChange={(e) =>
                            setNewUrlData({
                              ...newUrlData,
                              url: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="category" className="text-right">
                          Category
                        </label>
                        <Input
                          id="category"
                          className="col-span-3"
                          value={newUrlData.category}
                          onChange={(e) =>
                            setNewUrlData({
                              ...newUrlData,
                              category: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="accessType" className="text-right">
                          Access Type
                        </label>
                        <Select
                          value={newUrlData.accessType}
                          onValueChange={(value: "public" | "restricted") =>
                            setNewUrlData({ ...newUrlData, accessType: value })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              Public (All employees)
                            </SelectItem>
                            <SelectItem value="restricted">
                              Restricted (Specific users/groups)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddUrlDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddUrl}>Add URL</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">URL List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Access</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUrls.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No URLs found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUrls.map((url) => (
                              <TableRow
                                key={url.id}
                                className={
                                  selectedUrl?.id === url.id ? "bg-muted" : ""
                                }
                              >
                                <TableCell className="font-medium">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => setSelectedUrl(url)}
                                  >
                                    {url.title}
                                  </div>
                                </TableCell>
                                <TableCell>{url.category}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      url.accessType === "public"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {url.accessType === "public"
                                      ? "Public"
                                      : "Restricted"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUrl(url.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {selectedUrl
                          ? `Permissions: ${selectedUrl.title}`
                          : "Select a URL to manage permissions"}
                      </CardTitle>
                      {selectedUrl && (
                        <Dialog
                          open={isAddPermissionDialogOpen}
                          onOpenChange={setIsAddPermissionDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Permission
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Permission</DialogTitle>
                              <DialogDescription>
                                Grant access to {selectedUrl.title} for a user
                                or group.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label
                                  htmlFor="permissionType"
                                  className="text-right"
                                >
                                  Type
                                </label>
                                <Select
                                  value={permissionType}
                                  onValueChange={(value: "user" | "group") =>
                                    setPermissionType(value)
                                  }
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="group">Group</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="entity" className="text-right">
                                  {permissionType === "user" ? "User" : "Group"}
                                </label>
                                <Select
                                  value={selectedEntity}
                                  onValueChange={setSelectedEntity}
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue
                                      placeholder={`Select ${permissionType}`}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {permissionType === "user"
                                      ? users.map((user) => (
                                          <SelectItem
                                            key={user.id}
                                            value={user.id}
                                          >
                                            {user.name}
                                          </SelectItem>
                                        ))
                                      : groups.map((group) => (
                                          <SelectItem
                                            key={group.id}
                                            value={group.id}
                                          >
                                            {group.name}
                                          </SelectItem>
                                        ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setIsAddPermissionDialogOpen(false)
                                }
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleAddPermission}>
                                Add Permission
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {!selectedUrl ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                          <Link className="h-12 w-12 mb-2" />
                          <p>
                            Select a URL from the list to manage permissions
                          </p>
                        </div>
                      ) : urlPermissions.length === 0 ? (
                        selectedUrl.accessType === "public" ? (
                          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                            <Check className="h-12 w-12 mb-2" />
                            <p>
                              This URL is public and accessible to all employees
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                            <X className="h-12 w-12 mb-2" />
                            <p>No permissions assigned yet</p>
                            <p className="text-sm">
                              This URL is not accessible to anyone
                            </p>
                          </div>
                        )
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {urlPermissions.map((permission) => (
                              <TableRow key={permission.id}>
                                <TableCell>
                                  {permission.entityType === "user" ? (
                                    <div className="flex items-center">
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      User
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-2" />
                                      Group
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{permission.entityName}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemovePermission(permission.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8" />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search groups..." className="pl-8" />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Group
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        {group.name}
                      </TableCell>
                      <TableCell>{group.memberCount} members</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Manage permissions for {urls.length} URLs, {users.length} users, and{" "}
            {groups.length} groups.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermissionManager;
