import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StoryChain from "@/components/story-chain";
import StoryInput from "@/components/story-input";
import CommunityStats from "@/components/community-stats";
import { Cookie, Calendar, Users, Plus, Menu, User, Bookmark, Heart, MessageCircle, Share, Book, Sparkles, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { PageLoader } from "@/components/loading-spinner";
import TypeWriter from "@/components/typewriter";
import type { StoryChain as StoryChainType, Theme, CommunityStats as CommunityStatsType } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"global" | "themed">("global");

  // Initialize WebSocket connection (conditional hook usage)
  const webSocketData = useWebSocket(currentUser?.id || "", "global");

  // Fetch story chains
  const { data: storyChains = [], isLoading: chainsLoading } = useQuery<StoryChainType[]>({
    queryKey: ["/api/stories/chains"],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!currentUser, // Only run if user is authenticated
  });

  // Fetch daily theme
  const { data: dailyTheme } = useQuery<Theme>({
    queryKey: ["/api/themes/daily"],
    enabled: !!currentUser, // Only run if user is authenticated
  });

  // Fetch community stats
  const { data: communityStats } = useQuery<CommunityStatsType>({
    queryKey: ["/api/community/stats"],
    refetchInterval: 60000, // Refetch every minute
    enabled: !!currentUser, // Only run if user is authenticated
  });

  // Submit story mutation
  const submitStoryMutation = useMutation({
    mutationFn: api.submitStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Refresh user stories
      toast({
        title: "Story added!",
        description: "Your contribution has been added to the chain.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add your story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStorySubmit = async (content: string, chainId?: number) => {
    if (!content.trim()) return;

    try {
      // Get next chain ID if starting a new chain
      const finalChainId = chainId || (await api.getNextChainId());
      
      // Determine sequence number
      const existingChain = chainId ? storyChains.find(c => c.chainId === chainId) : null;
      const sequence = existingChain ? existingChain.stories.length + 1 : 1;

      await submitStoryMutation.mutateAsync({
        chainId: finalChainId,
        content,
        roomId: null, // Global room
        authorId: currentUser?.id || "",
        authorName: currentUser?.username || "Anonymous",
      });
    } catch (error) {
      console.error("Failed to submit story:", error);
    }
  };

  // Show loading while authentication is being determined
  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream dark:bg-gray-900 transition-colors duration-300">
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

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="theme-toggle">
                <ThemeToggle />
              </div>
              <div className="flex items-center space-x-3">
                {currentUser && <UserProfile user={currentUser} compact />}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="bg-story-gradient rounded-3xl p-8 mb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <TypeWriter 
              text="Welcome to Echoes Cafe..."
              className="font-serif text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-4 hero-glow"
              delay={120}
            />
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Join our storytelling community and continue the endless chain of imagination. 
              Every line builds upon another, creating beautiful stories together.
            </p>
            
            {/* Story Input */}
            <StoryInput 
              onSubmit={handleStorySubmit}
              isSubmitting={submitStoryMutation.isPending}
              user={currentUser! as any}
              currentStory={storyChains.length > 0 ? storyChains[0].stories.map(s => s.content).join(' ') : ''}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Button 
                variant="outline" 
                className="border-warm-teal text-warm-teal hover:bg-warm-teal hover:text-white btn-animate"
                onClick={() => window.location.href = '/rooms'}
              >
                <Users className="w-4 h-4 mr-2 icon-animate" />
                Create Private Room
              </Button>
              <Button 
                className="bg-warm-brown text-white hover:bg-warm-brown/90 btn-animate"
                onClick={() => window.location.href = '/rooms'}
              >
                <Plus className="w-4 h-4 mr-2 icon-animate" />
                Join Room
              </Button>
              <Button 
                variant="outline"
                className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-white btn-animate"
                onClick={() => window.location.href = '/community'}
              >
                <Book className="w-4 h-4 mr-2 icon-animate" />
                Browse Stories
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Actions - Key Features from initial.md */}
        <section className="mb-12">
          <h3 className="font-serif text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center heading-glow">
            ☕ Echoes Cafe Storytelling Hub
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Create Story Rooms */}
            <Card className="card-scale-hover cursor-pointer" onClick={() => window.location.href = '/rooms'}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-warm-teal rounded-full flex items-center justify-center mx-auto mb-4 icon-animate">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Story Rooms</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Start private rooms with friends or join public storytelling spaces
                </p>
                <Button className="w-full bg-warm-teal text-white hover:bg-warm-teal/90 btn-animate">
                  <Plus className="w-4 h-4 mr-2 icon-animate" />
                  Create Room
                </Button>
              </CardContent>
            </Card>

            {/* Join Collaborative Storytelling */}
            <Card className="card-scale-hover cursor-pointer" onClick={() => window.location.href = '/community'}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-warm-brown rounded-full flex items-center justify-center mx-auto mb-4 icon-animate">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-gray-800 dark:text-white mb-2">Collaborative Stories</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Continue where others left off and build amazing stories together
                </p>
                <Button className="w-full bg-warm-brown text-white hover:bg-warm-brown/90 btn-animate">
                  <Heart className="w-4 h-4 mr-2 icon-animate" />
                  Join Stories
                </Button>
              </CardContent>
            </Card>

            {/* Manage Profile */}
            <Card className="card-scale-hover cursor-pointer" onClick={() => window.location.href = '/profile'}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center mx-auto mb-4 icon-animate">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-gray-800 dark:text-white mb-2">Your Profile</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Track contributions, earn badges, and see your storytelling journey
                </p>
                <Button className="w-full bg-gradient-to-r from-warm-teal to-warm-brown text-white btn-animate">
                  <Bookmark className="w-4 h-4 mr-2 icon-animate" />
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Active Story Chains */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-2xl font-semibold text-gray-800 dark:text-white heading-glow">Active Story Chains</h3>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "global" ? "default" : "ghost"}
                onClick={() => setActiveTab("global")}
                className={activeTab === "global" ? "bg-warm-teal text-white" : "text-gray-600"}
              >
                Global Room
              </Button>
              <Button
                variant={activeTab === "themed" ? "default" : "ghost"}
                onClick={() => setActiveTab("themed")}
                className={activeTab === "themed" ? "bg-warm-teal text-white" : "text-gray-600"}
              >
                Themed
              </Button>
            </div>
          </div>

          {/* Story Chain Display */}
          <div className="space-y-4">
            {chainsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-teal mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading stories...</p>
              </div>
            ) : storyChains.length > 0 ? (
              storyChains.map((chain) => (
                <StoryChain 
                  key={chain.chainId} 
                  chain={chain} 
                  currentUser={currentUser as any}
                  onContinue={handleStorySubmit}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Cookie className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No story chains yet. Be the first to start one!</p>
                  <Button 
                    onClick={() => handleStorySubmit("Someone somewhere is beginning a new adventure...")}
                    className="bg-warm-teal text-white hover:bg-warm-teal/90"
                  >
                    Start First Story
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Load More */}
          {storyChains.length > 0 && (
            <div className="text-center mt-6">
              <Button variant="ghost" className="text-warm-teal hover:text-warm-brown">
                Load more stories
              </Button>
            </div>
          )}
        </section>

        {/* Community Features Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Cookie's Picks */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-orange-100 dark:border-orange-800/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white">
                  <Cookie className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-lg text-gray-800 dark:text-gray-200">Echoes Picks</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This week's favorites</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/80 dark:bg-gray-700/80 rounded-lg p-3 border border-orange-100 dark:border-gray-600">
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                    "Someone somewhere is reading this and smiling, not knowing they're exactly where they need to be."
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">by Mahnoor_philosopher</span>
                    <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                      <Cookie className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                View all picks
              </Button>
            </CardContent>
          </Card>

          {/* Daily Theme */}
          <Card className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-teal-100 dark:border-teal-800/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-400 rounded-full flex items-center justify-center text-white">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-lg text-gray-800 dark:text-gray-200">Today's Theme</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nemrah Ahmed Inspired</p>
                </div>
              </div>
              {dailyTheme && (
                <div className="bg-white/80 dark:bg-gray-700/80 rounded-lg p-4 mb-4 border border-teal-100 dark:border-gray-600">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-2">
                    "{dailyTheme?.title}"
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {dailyTheme?.prompt}
                  </p>
                </div>
              )}
              <Button className="w-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/50">
                Join themed stories
              </Button>
            </CardContent>
          </Card>

          {/* Community Stats */}
          <CommunityStats stats={communityStats} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-light-beige/50 dark:border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Section - About */}
            <div className="lg:flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white">
                  <Cookie className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-gray-800 dark:text-gray-200">Echoes Cafe</h3>
              </div>
              <Card className="bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-orange-200/30 dark:border-gray-600/30">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-orange-500 mr-2 animate-pulse" />
                      <h4 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        Special Thanks
                      </h4>
                      <Sparkles className="h-6 w-6 text-orange-500 ml-2 animate-pulse" />
                    </div>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <p className="leading-relaxed">
                        This app is inspired by the creativity of <span className="font-semibold text-orange-600 dark:text-orange-400">Nemrah Ahmad and countless other writers</span>, 
                        who gave us endless stories and ideas to imagine beyond boundaries.
                      </p>
                      <p className="leading-relaxed">
                        Thank you for inspiring us, readers, and dreamers. This community is built out of 
                        <span className="text-pink-600 dark:text-pink-400 font-medium"> love</span>, 
                        <span className="text-purple-600 dark:text-purple-400 font-medium"> fun</span>, and 
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> cookies</span>.
                      </p>
                    </div>
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                        <Coffee className="h-4 w-4 text-orange-500 animate-bounce" />
                        <Cookie className="h-4 w-4 text-yellow-600 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Section - Community and Support Links */}
            <div className="lg:w-80 flex flex-col justify-end">
              <div className="grid grid-cols-2 gap-8">
                {/* Community Links */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">Community</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/community" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Community</Link></li>
                    <li><Link href="/how-to-play" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">How to Play</Link></li>
                    <li><Link href="/community-guidelines" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Community Guidelines</Link></li>
                    <li><Link href="/community" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Echoes Picks Archive</Link></li>
                    <li><Link href="/featured-stories" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Featured Stories</Link></li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/help-center" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Help Center</Link></li>
                    <li><Link href="/report-content" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Report Content</Link></li>
                    <li><a href="mailto:justufor11@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Contact Us</a></li>
                    <li><a href="tel:+923340784840" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Support: +92 3340784840</a></li>
                    <li><Link href="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-warm-teal transition-colors">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 text-center font-signature signature-glow mx-auto">
              © 2025 Echoes Cafe. Made with ❤️ for storytellers everywhere.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-warm-teal">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden Content Sections for Footer Links */}
      <div className="hidden">
        {/* How to Play Section */}
        <section id="how-to-play" className="py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">How to Play</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-orange-600">Getting Started</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Create your account and complete your profile</li>
                    <li>• Read existing story chains to understand the flow</li>
                    <li>• Join a themed room or start in the global community</li>
                    <li>• Add your creative line to continue the story</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-orange-600">Story Rules</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Keep contributions between 10-200 characters</li>
                    <li>• Build upon the previous line meaningfully</li>
                    <li>• Maintain story coherence and flow</li>
                    <li>• Be respectful and inclusive in your writing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Guidelines */}
        <section id="guidelines" className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Community Guidelines</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Respect & Inclusivity</h3>
                <p className="text-gray-600">Create a welcoming environment for storytellers from all backgrounds. No discrimination, harassment, or hate speech.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Content Standards</h3>
                <p className="text-gray-600">Keep content appropriate for all ages. No explicit violence, sexual content, or inappropriate material.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Creative Collaboration</h3>
                <p className="text-gray-600">Build upon others' ideas respectfully. Avoid derailing stories or posting unrelated content.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Help Center */}
        <section id="help" className="py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Help Center</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-orange-600">Common Issues</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Can't submit a story? Check your internet connection</li>
                    <li>• Story not appearing? Wait a few seconds for sync</li>
                    <li>• Account issues? Contact support below</li>
                    <li>• Forgot password? Use the reset option on login</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-orange-600">Contact Support</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>📞 Phone: <a href="tel:+923340784840" className="text-orange-600 hover:underline">+92 3340784840</a></p>
                    <p>📧 Email: <a href="mailto:justufor11@gmail.com" className="text-orange-600 hover:underline">justufor11@gmail.com</a></p>
                    <p>🕒 Support Hours: 9 AM - 6 PM PKT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Privacy Policy</h2>
            <div className="max-w-4xl mx-auto space-y-6 text-gray-600">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Data Collection</h3>
                <p>We collect only essential information needed to provide our storytelling service: username, email, and your story contributions.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Data Usage</h3>
                <p>Your data is used to maintain your account, display your contributions, and improve our service. We never sell or share personal information.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Contact for Privacy</h3>
                <p>Questions about privacy? Email us at <a href="mailto:justufor11@gmail.com" className="text-orange-600 hover:underline">justufor11@gmail.com</a></p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <Button 
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-warm-teal text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        onClick={() => handleStorySubmit("Someone somewhere is about to share something beautiful...")}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
