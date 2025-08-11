import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Users, FileText, Shield } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Company Logo"
              className="h-20 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Company Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your centralized hub for company news, resources, and internal tools
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Enter Portal <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Company News</CardTitle>
              <CardDescription>
                Stay updated with the latest announcements and company updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Resource Access</CardTitle>
              <CardDescription>
                Quick access to role-specific internal resources and tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Admin Controls</CardTitle>
              <CardDescription>
                Manage permissions, content, and user access controls
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                View Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
