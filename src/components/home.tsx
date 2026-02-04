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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-xl opacity-30"></div>
              <img
                src="/logo.png"
                alt="Company Logo"
                className="h-24 w-auto relative"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Welcome to Company Portal
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Your centralized hub for company news, resources, and internal tools
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
          >
            Enter Portal <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-xl transition-all border-blue-200 hover:border-blue-400 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Company News</CardTitle>
              <CardDescription>
                Stay updated with the latest announcements and company updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all border-green-200 hover:border-green-400 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Resource Access</CardTitle>
              <CardDescription>
                Quick access to role-specific internal resources and tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all border-blue-200 hover:border-blue-400 hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Admin Controls</CardTitle>
              <CardDescription>
                Manage permissions, content, and user access controls
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                View Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin")}
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
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
