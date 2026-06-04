import { User, Star, Heart, TrendingUp, Settings, LogOut, Home, Users, BookOpen, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

interface UserType {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  status: string;
  contributionsCount: number;
  heartsReceived: number;
  experiencePoints: number;
  level: number;
  badges: string[] | null;
  preferences: any;
  createdAt: Date | null;
  updatedAt: Date | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  password?: string | null;
}

interface UserProfileProps {
  user: UserType;
  compact?: boolean;
}

export function UserProfile({ user, compact = false }: UserProfileProps) {
  // Calculate level and progress from experience points
  const experience = (user as any).experience || user.experiencePoints || 0;
  const level = Math.floor(experience / 100) + 1;
  const levelProgress = ((experience % 100) / 100) * 100;
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };
  
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-3 hover:bg-orange-100 dark:hover:bg-orange-900/20">
            <Avatar className="w-8 h-8 bg-orange-600">
              <AvatarFallback className="bg-orange-600 text-white text-sm">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Level {level}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/">
            <DropdownMenuItem className="cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/community">
            <DropdownMenuItem className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Community</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/rooms">
            <DropdownMenuItem className="cursor-pointer">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Rooms</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          {(user.role === "admin" || user.role === "moderator") && (
            <Link href="/admin">
              <DropdownMenuItem className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>{user.role === "admin" ? "Admin" : "Moderator"}</span>
              </DropdownMenuItem>
            </Link>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-orange-200/30 dark:border-gray-700/30">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white text-lg">
          <User className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.username}</h3>
            <Badge variant="secondary" className="bg-warm-teal/20 text-warm-teal">
              Level {level}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{(user as any).contributions || user.contributionsCount || 0} stories</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{(user as any).hearts || user.heartsReceived || 0} hearts</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>{experience} XP</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress to Level {level + 1}</span>
                <span>{experience % 100}/100 XP</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </div>
            
            {user.badges && user.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs">
                    {badge.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}