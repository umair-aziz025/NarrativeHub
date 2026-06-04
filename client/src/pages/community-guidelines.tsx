import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee, Shield, Heart, Users, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-orange-200/50 dark:border-gray-700/50 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
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
            <Shield className="h-8 w-8 text-orange-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white signature-glow">
              Community Guidelines
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Creating a safe and creative space for all storytellers
          </p>
        </div>

        <div className="grid gap-8">
          {/* Respect & Inclusivity */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Heart className="h-6 w-6 mr-2" />
                Respect & Inclusivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Echoes Cafe is a welcoming space for storytellers from all backgrounds, cultures, and experiences. We celebrate diversity and expect all community members to treat each other with respect and kindness.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Use inclusive language that welcomes everyone</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Respect different perspectives and storytelling styles</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">No discrimination, harassment, or hate speech of any kind</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">No personal attacks or inflammatory language</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Standards */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Users className="h-6 w-6 mr-2" />
                Content Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our platform is designed to be appropriate for storytellers of all ages. We maintain high standards for content quality and appropriateness.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3">✓ Encouraged Content</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Creative, imaginative storytelling</li>
                    <li>• Family-friendly adventures and mysteries</li>
                    <li>• Positive character development</li>
                    <li>• Educational or inspiring themes</li>
                    <li>• Humor and light-hearted content</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3">✗ Prohibited Content</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Explicit violence or graphic descriptions</li>
                    <li>• Sexual content or inappropriate material</li>
                    <li>• Hate speech or discriminatory language</li>
                    <li>• Personal information or doxxing</li>
                    <li>• Spam or off-topic content</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creative Collaboration */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <Users className="h-6 w-6 mr-2" />
                Creative Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Collaborative storytelling thrives when everyone contributes positively. Build upon others' ideas respectfully and help create something beautiful together.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Build upon previous contributions meaningfully</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Respect the story's direction and tone</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Give others space to contribute</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Don't derail stories or post unrelated content</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Avoid ending stories abruptly without reason</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reporting & Enforcement */}
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Reporting & Enforcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Help us maintain a safe community by reporting inappropriate content or behavior. Our moderation team reviews all reports promptly.
              </p>
              <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">How to Report</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Use the "Report Content" feature on any story contribution</li>
                  <li>• Contact moderators directly for serious concerns</li>
                  <li>• Email us at <a href="mailto:justufor11@gmail.com" className="text-orange-600 hover:underline">justufor11@gmail.com</a></li>
                  <li>• Call our support line: <a href="tel:+923340784840" className="text-orange-600 hover:underline">+92 3340784840</a></li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Consequences</h4>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Violations may result in warnings, temporary suspension, or permanent ban depending on severity. We reserve the right to remove content and accounts that violate these guidelines.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
