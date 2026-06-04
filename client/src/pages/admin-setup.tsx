import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { Badge } from '../components/ui/badge';
import { Coffee, Shield } from 'lucide-react';

export default function AdminSetup() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nickname: ''
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="text-center">
            <Coffee className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Smart redirection logic
  const handleRedirect = () => {
    if (!user) {
      // User not logged in - redirect to auth/registration
      window.location.href = '/auth';
    } else if (user.role === 'moderator') {
      // Moderator - redirect to admin panel
      window.location.href = '/admin';
    } else {
      // Logged in user but not admin/moderator - redirect to home
      window.location.href = '/';
    }
  };

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardContent className="py-8 text-center">
              <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This page is only accessible to administrators.
              </p>
              <Button 
                onClick={handleRedirect}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      toast({
        title: "Success",
        description: "Admin setup configuration saved!",
      });
      setFormData({ username: '', email: '', password: '', nickname: '' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save admin setup configuration",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
            Cookie
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Configure your administrative account for Writers' Literary Universe
          </p>
        </div>

        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle>Admin Configuration</CardTitle>
            <CardDescription>
              Configure administrative settings for your Writers' Literary Universe instance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Display Name</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="Administrator"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@yoursite.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a secure password"
                />
              </div>
              
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  This configuration will set up administrative access for the system.
                </AlertDescription>
              </Alert>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={formLoading}
              >
                {formLoading ? "Saving Configuration..." : "Save Admin Configuration"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 text-center font-signature signature-glow mx-auto">
                © 2025 Echoes Cafe. Made with ❤️ for storytellers everywhere.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                {/* Additional footer content can go here */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
