import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Book, Users, Heart, Sparkles, Coffee, Globe, Cookie } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-black">
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
                  ✨ Inspired by Writers' Literary Universe
                </p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="theme-toggle">
                <ThemeToggle />
              </div>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white btn-animate shadow-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
            ✨ Inspired by Writers' Literary Universe
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Where Stories Come Alive
            <br />
            <span className="text-orange-600 dark:text-orange-400">Together</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Join a global community of storytellers creating beautiful, collaborative narratives. 
            Each story builds upon the last, creating magical tales that evolve through shared imagination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/auth')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg btn-animate"
            >
              Start Your Story Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation('/community')}
              className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-8 py-4 text-lg btn-animate"
            >
              Explore Community Stories
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-200 dark:border-orange-800 card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 icon-animate">
                  <Book className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Join a Story Chain</CardTitle>
                <CardDescription>
                  Pick up where someone else left off and add your unique voice to ongoing narratives.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 icon-animate">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Connect with Writers</CardTitle>
                <CardDescription>
                  Share hearts, comments, and build lasting connections through collaborative storytelling.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 icon-animate">
                  <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Get Featured</CardTitle>
                <CardDescription>
                  Outstanding contributions get featured in "Echoes Picks" and community highlights.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Stats Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Join Our Growing Community
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">1,500+</div>
              <div className="text-gray-600 dark:text-gray-300">Stories Written</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">350+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Writers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">25+</div>
              <div className="text-gray-600 dark:text-gray-300">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">5,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Hearts Given</div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Thanks Section */}
      <section className="py-16 bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-orange-200/30 dark:border-gray-600/30">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-orange-500 mr-3 animate-pulse" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Special Thanks
                </h2>
                <Sparkles className="h-8 w-8 text-orange-500 ml-3 animate-pulse" />
              </div>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-lg leading-relaxed">
                  This app is inspired by the creativity of <span className="font-semibold text-orange-600 dark:text-orange-400">Nemrah Ahmad and countless other writers</span>, 
                  who gave us endless stories and ideas to imagine beyond boundaries.
                </p>
                <p className="text-lg leading-relaxed">
                  Thank you for inspiring us, readers, and dreamers. This community is built out of 
                  <span className="text-pink-600 dark:text-pink-400 font-medium"> love</span>, 
                  <span className="text-purple-600 dark:text-purple-400 font-medium"> fun</span>, and 
                  <span className="text-orange-600 dark:text-orange-400 font-medium"> cookies</span>.
                </p>
              </div>
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                  <Coffee className="h-5 w-5 text-orange-500 animate-bounce" />
                  <Cookie className="h-5 w-5 text-yellow-600 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-warm-orange/20 dark:border-warm-orange/30">
              <div className="text-center space-y-8">
                {/* Logo Section */}
                <div className="flex justify-center items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-warm-orange to-warm-brown rounded-full flex items-center justify-center text-white text-2xl float-animation shadow-xl">
                    <Coffee className="w-8 h-8 icon-animate" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2 heading-glow">
                      Echoes Cafe
                    </h3>
                    <p className="font-signature text-lg bg-gradient-to-r from-warm-orange via-pink-400 to-purple-400 bg-clip-text text-transparent signature-glow">
                      ✨ Inspired by Writers' Literary Universe
                    </p>
                  </div>
                </div>

                {/* Tagline */}
                <div className="max-w-2xl mx-auto">
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Where stories come alive through collective imagination and every voice matters in the grand narrative of human creativity.
                  </p>
                  <div className="flex justify-center items-center space-x-6 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-warm-orange" />
                      <span>Global Community</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-5 w-5 text-pink-400 animate-pulse" />
                      <span>Made with Love</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Cookie className="h-5 w-5 text-yellow-400" />
                      <span>Storytellers Welcome</span>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-warm-orange/20 dark:border-warm-orange/30 pt-8">
                  <div className="flex justify-center items-center">
                    <p className="text-warm-brown dark:text-warm-orange text-center">
                      © 2025 Echoes Cafe. Made with ❤️ for storytellers everywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}