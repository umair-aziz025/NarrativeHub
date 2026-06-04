import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, MessageCircle, BookOpen, Trophy, Crown, Sparkles } from "lucide-react";

export default function FeaturedStories() {
  const featuredStories = [
    {
      id: 1,
      title: "The Midnight Library Chronicles",
      author: "Sarah_Storyteller",
      contributors: 15,
      likes: 342,
      comments: 89,
      excerpt: "In a library that exists between dreams and reality, every book holds a different life you could have lived...",
      tags: ["Fantasy", "Philosophy", "Award Winner"],
      badge: "Editors' Choice",
      difficulty: "Intermediate",
      status: "Complete"
    },
    {
      id: 2,
      title: "Echoes of Tomorrow",
      author: "FutureVisionary",
      contributors: 23,
      likes: 567,
      comments: 134,
      excerpt: "A scientist discovers that their morning coffee shop exists simultaneously in three different timelines...",
      tags: ["Sci-Fi", "Time Travel", "Community Favorite"],
      badge: "Most Popular",
      difficulty: "Advanced",
      status: "Ongoing"
    },
    {
      id: 3,
      title: "The Cookie Crumb Trail",
      author: "CafeWriter_99",
      contributors: 8,
      likes: 198,
      comments: 45,
      excerpt: "Follow the mysterious trail of cookie crumbs that leads to unexpected friendships and magical discoveries...",
      tags: ["Adventure", "Friendship", "Cozy"],
      badge: "Hidden Gem",
      difficulty: "Beginner",
      status: "Complete"
    },
    {
      id: 4,
      title: "Symphony of Souls",
      author: "MelodyMaker",
      contributors: 19,
      likes: 423,
      comments: 97,
      excerpt: "Each person carries a unique melody, but what happens when all these songs come together in harmony?",
      tags: ["Music", "Drama", "Emotional"],
      badge: "Critics' Pick",
      difficulty: "Intermediate",
      status: "Ongoing"
    },
    {
      id: 5,
      title: "The Last Bookstore on Earth",
      author: "LiterateDreamer",
      contributors: 31,
      likes: 789,
      comments: 156,
      excerpt: "After digital books take over, one physical bookstore becomes a sanctuary for stories and human connection...",
      tags: ["Dystopian", "Hope", "Books"],
      badge: "Epic Length",
      difficulty: "Advanced",
      status: "Complete"
    },
    {
      id: 6,
      title: "Coffee Shop Confessions",
      author: "EspressoExplorer",
      contributors: 12,
      likes: 267,
      comments: 63,
      excerpt: "Every day at 3 PM, strangers share their deepest secrets with the barista who never judges...",
      tags: ["Slice of Life", "Human Stories", "Heartwarming"],
      badge: "Feel Good",
      difficulty: "Beginner",
      status: "Ongoing"
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Editors' Choice": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Most Popular": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Hidden Gem": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Critics' Pick": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Epic Length": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Feel Good": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return <Star className="h-4 w-4 text-green-500" />;
      case "Intermediate": return <Star className="h-4 w-4 text-yellow-500" />;
      case "Advanced": return <Star className="h-4 w-4 text-red-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 dark:text-gray-200 heading-glow">
              Featured Stories
            </h1>
            <Trophy className="h-8 w-8 text-orange-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the most beloved stories created by our community. These tales showcase the magic 
            that happens when creative minds come together to build something extraordinary.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">156</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Featured Stories</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-red-500 mr-2" />
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">12.4K</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">3.8K</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">
            All Stories
          </Button>
          <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-800">
            Editors' Choice
          </Button>
          <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-800">
            Most Popular
          </Button>
          <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-800">
            Recently Featured
          </Button>
          <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-800">
            Award Winners
          </Button>
        </div>

        {/* Featured Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredStories.map((story) => (
            <Card key={story.id} className="card-scale-hover cursor-pointer bg-white dark:bg-gray-800 border-orange-200/30 dark:border-gray-600/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Badge */}
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className={getBadgeColor(story.badge)}>
                      {story.badge}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center space-x-1">
                      {getDifficultyIcon(story.difficulty)}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                        {story.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  {/* Gradient Background */}
                  <div className="h-24 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"></div>
                </div>

                <div className="p-6">
                  {/* Title and Author */}
                  <div className="mb-4">
                    <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by <span className="font-medium text-orange-600 dark:text-orange-400">@{story.author}</span>
                    </p>
                  </div>

                  {/* Excerpt */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {story.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {story.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {story.contributors} writers
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {story.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {story.comments}
                      </span>
                    </div>
                    <Badge variant="outline" className={story.status === 'Complete' ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-300'}>
                      {story.status}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Story
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 dark:hover:bg-gray-700">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="border-orange-300 hover:bg-orange-50 dark:hover:bg-gray-800">
            <Sparkles className="h-5 w-5 mr-2" />
            Load More Featured Stories
          </Button>
        </div>

        {/* Submit Story for Feature */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-orange-200/30 dark:border-gray-600/30">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Submit Your Story for Featuring
                </h3>
                <Star className="h-6 w-6 text-orange-500 ml-2" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Have you created an amazing collaborative story? Submit it for consideration to be featured 
                and inspire other storytellers in our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Crown className="h-5 w-5 mr-2" />
                  Submit for Featuring
                </Button>
                <Button size="lg" variant="outline" className="border-orange-300 hover:bg-orange-50 dark:hover:bg-gray-800">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Feature Guidelines
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
