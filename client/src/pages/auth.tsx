import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { Coffee, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export default function Auth() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    nickname: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      // Store token and redirect to community page
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation("/community");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/\d/.test(password)) errors.push("one number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("one special character");
    
    if (errors.length > 0) {
      return `Password must contain ${errors.join(", ")}`;
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    // Validation
    const passwordError = validatePassword(registerData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }
    
    if (!registerData.email.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    
    if (registerData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      // Show success message instead of auto-login
      setSuccess(data.message || "Account created successfully! Please wait for admin approval.");
      setRegisterData({ username: "", nickname: "", email: "", password: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-orange-200/50 dark:border-gray-700/50 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl float-animation shadow-lg">
                <Coffee className="w-6 h-6 icon-animate" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-2xl text-gray-800 dark:text-white">
                  Echoes Cafe
                </h1>
                <p className="font-signature text-sm bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse font-medium">
                  by Cookie
                </p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white btn-animate"
              >
                <ArrowLeft className="h-4 w-4 mr-2 icon-animate" />
                Back to Home
              </Button>
              <div className="theme-toggle">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md card-hover">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Join the Story
            </CardTitle>
            <CardDescription>
              Create an account or sign in to start collaborative storytelling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="btn-animate">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="btn-animate">Register</TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white btn-animate"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="storyteller123"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Display Name / Nickname</Label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="Cookie Writer"
                      value={registerData.nickname}
                      onChange={(e) => setRegisterData({ ...registerData, nickname: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This is how others will see your name in stories
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>Password must contain:</p>
                      <ul className="ml-2 space-y-0.5">
                        <li className={`flex items-center space-x-1 ${registerData.password.length >= 8 ? 'text-green-600' : ''}`}>
                          <span>•</span><span>At least 8 characters</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/[a-z]/.test(registerData.password) ? 'text-green-600' : ''}`}>
                          <span>•</span><span>One lowercase letter</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/[A-Z]/.test(registerData.password) ? 'text-green-600' : ''}`}>
                          <span>•</span><span>One uppercase letter</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/\d/.test(registerData.password) ? 'text-green-600' : ''}`}>
                          <span>•</span><span>One number</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(registerData.password) ? 'text-green-600' : ''}`}>
                          <span>•</span><span>One special character</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white btn-animate"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
