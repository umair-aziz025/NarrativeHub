import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Crown, Trophy, Users, Coffee, Home, ArrowLeft, Book, Menu, User, Cookie } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { PageLoader } from "@/components/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import type { CookiesPick, CommunityStats } from "@shared/schema";

export default function Community() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("picks");

  // All hooks must be called before any conditional returns
  const { data: cookiesPicks = [] } = useQuery<CookiesPick[]>({
    queryKey: ["/api/community/cookies-picks"],
  });

  const { data: communityStats } = useQuery<CommunityStats>({
    queryKey: ["/api/community/stats"],
  });

  // Show loading while authentication is being determined
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-black flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-light-beige/50 dark:border-gray-700/50 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white text-xl float-animation">
                <Coffee className="w-5 h-5 icon-animate" />
              </div>
              <div>
                <h1 className="font-serif font-semibold text-xl text-gray-800 dark:text-white">
                  Echoes Cafe
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic font-signature signature-glow">
                  by Cookie
                </p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="theme-toggle">
                <ThemeToggle />
              </div>
              {isAuthenticated && currentUser ? (
                <div className="flex items-center space-x-3">
                  <UserProfile user={currentUser} compact />
                </div>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-orange-600 text-white hover:bg-orange-700 btn-animate"
                >
                  Sign In to Join
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          <Button
            variant={activeTab === "picks" ? "default" : "outline"}
            onClick={() => setActiveTab("picks")}
            className={`flex items-center gap-2 btn-animate ${activeTab === "picks" ? "bg-warm-teal text-white" : "border-warm-teal text-warm-teal hover:bg-warm-teal hover:text-white"}`}
          >
            <Crown className="w-4 h-4 icon-animate" />
            Cookie's Picks
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 btn-animate ${activeTab === "stats" ? "bg-warm-brown text-white" : "border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-white"}`}
          >
            <Trophy className="w-4 h-4 icon-animate" />
            Community Stats
          </Button>
          <Button
            variant={activeTab === "themes" ? "default" : "outline"}
            onClick={() => setActiveTab("themes")}
            className={`flex items-center gap-2 btn-animate ${activeTab === "themes" ? "bg-gradient-to-r from-warm-teal to-warm-brown text-white" : "border-warm-teal text-warm-teal hover:bg-warm-teal hover:text-white"}`}
          >
            <Book className="w-4 h-4 icon-animate" />
            Cookie Themes
          </Button>
        </div>

        {/* Cookie's Picks Tab */}
        {activeTab === "picks" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-white mb-2">🍪 Cookie's Picks</h2>
              <p className="text-gray-600 dark:text-gray-300">Highlighting the most creative and heartwarming stories from our community</p>
            </div>

            {cookiesPicks.length === 0 ? (
              <Card className="p-8 text-center card-hover">
                <Crown className="w-16 h-16 mx-auto mb-4 text-warm-teal icon-animate" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Coming Soon!</h3>
                <p className="text-gray-600 dark:text-gray-300">Cookie's Picks will feature the best community stories each week.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Keep writing amazing stories to get featured here!</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {cookiesPicks.map((pick) => (
                  <Card key={pick.id} className="relative overflow-hidden card-hover">
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-warm-teal text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="pr-20 text-gray-800 dark:text-white">Story #{pick.storyId}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{pick.reason}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Featured on {new Date(pick.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-white mb-2">📊 Community Stats</h2>
              <p className="text-gray-600 dark:text-gray-300">See how our storytelling community is growing</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-3 text-warm-teal icon-animate" />
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{communityStats?.totalStories || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Stories</div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-3 text-warm-brown icon-animate" />
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{communityStats?.activeUsers || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Storytellers</div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-3 text-red-500 icon-animate" />
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{communityStats?.totalHearts || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hearts Given</div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-3 text-yellow-500 icon-animate" />
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{communityStats?.dailyContributions || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today's Stories</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Cookie Themes Tab */}
        {activeTab === "themes" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-800 dark:text-white mb-2">✨ Cookie Themes</h2>
              <p className="text-gray-600 dark:text-gray-300">Stories inspired by the beloved novelist's works</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Crown className="w-5 h-5 text-warm-teal icon-animate" />
                    Jannat Kay Pattay Vibes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Stories about finding home in people, not places. Explore themes of belonging, 
                    family bonds, and the journey to discover where your heart truly feels at peace.
                  </p>
                  <Badge className="bg-warm-teal text-white">Currently Active</Badge>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Crown className="w-5 h-5 text-warm-brown icon-animate" />
                    Mystery & Secrets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Inspired by the intrigue in Nemrah's novels. Create stories with hidden truths, 
                    family mysteries, and revelations that change everything the characters thought they knew.
                  </p>
                  <Badge variant="outline" className="border-warm-brown text-warm-brown">Weekly Theme</Badge>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Crown className="w-5 h-5 text-red-500 icon-animate" />
                    Love & Relationships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Explore the complexities of human connections, from first love to lasting friendships, 
                    and the beautiful mess that is caring for someone deeply.
                  </p>
                  <Badge variant="outline" className="border-red-500 text-red-500">Community Favorite</Badge>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Crown className="w-5 h-5 text-purple-500 icon-animate" />
                    Coming of Age
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Stories about growth, self-discovery, and those pivotal moments that shape who we become. 
                    Perfect for exploring character development and emotional depth.
                  </p>
                  <Badge variant="outline" className="border-purple-500 text-purple-500">Monthly Special</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
  );
}