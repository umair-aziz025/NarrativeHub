import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee, Play, Users, Pen, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                <h1 className="font-serif font-bold text-2xl text-gray-800 dark:text-white signature-glow">
                  Echoes Cafe
                </h1>
                <p className="font-signature text-sm bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse font-medium">
                  by Cookie
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" className="btn-animate">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Play className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white signature-glow">
              How to Play
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Join the collaborative storytelling adventure at Echoes Cafe
          </p>
        </div>

        <div className="grid gap-8">
          {/* Getting Started */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Users className="h-6 w-6 mr-2" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Create Your Account</h4>
                    <p className="text-gray-600 dark:text-gray-400">Sign up with your email and choose a creative nickname that will appear when you contribute to stories.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Explore Story Chains</h4>
                    <p className="text-gray-600 dark:text-gray-400">Browse existing story chains to understand how collaborative storytelling works. Read the flow and style.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Choose Your Room</h4>
                    <p className="text-gray-600 dark:text-gray-400">Join the global community or enter a themed room that matches your creative interests.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Add Your Line</h4>
                    <p className="text-gray-600 dark:text-gray-400">Contribute your creative line to continue the story. Build upon what others have written!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Story Rules */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Pen className="h-6 w-6 mr-2" />
                Story Contribution Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Length Guidelines</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Keep contributions between 10-200 characters</li>
                    <li>• Aim for one complete thought or sentence</li>
                    <li>• Quality over quantity - make every word count</li>
                    <li>• Leave room for others to build upon your idea</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Creative Guidelines</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Build upon the previous line meaningfully</li>
                    <li>• Maintain story coherence and flow</li>
                    <li>• Add your unique creative voice</li>
                    <li>• Keep the narrative moving forward</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips for Success */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Heart className="h-6 w-6 mr-2" />
                Tips for Great Storytelling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Be Unexpected</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add surprising twists while staying true to the story's direction.</p>
                </div>
                <div className="text-center p-4 bg-pink-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Show Emotion</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use vivid descriptions and emotional depth to engage readers.</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Collaborate Well</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Respect other writers and build upon their creative contributions.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
