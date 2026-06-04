import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share, Bookmark, User } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExportStory } from "@/components/export-story";
import type { StoryChain as StoryChainType, User as UserType } from "@shared/schema";

interface StoryChainProps {
  chain: StoryChainType;
  currentUser: UserType & { hearts?: number; contributions?: number; experience?: number };
  onContinue: (content: string, chainId: number) => void;
}

const avatarColors = [
  "from-purple-400 to-pink-400",
  "from-blue-400 to-teal-400", 
  "from-green-400 to-emerald-400",
  "from-orange-400 to-red-400",
  "from-indigo-400 to-purple-400",
  "from-rose-400 to-pink-400",
];

export default function StoryChain({ chain, currentUser, onContinue }: StoryChainProps) {
  const [showContinueInput, setShowContinueInput] = useState(false);
  const [continueText, setContinueText] = useState("");
  const { toast } = useToast();

  const heartMutation = useMutation({
    mutationFn: (storyId: string) => api.toggleHeart(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update heart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (!continueText.trim()) return;
    
    onContinue(continueText, chain.chainId);
    setContinueText("");
    setShowContinueInput(false);
  };

  const handleHeart = (storyId: string) => {
    heartMutation.mutate(storyId);
  };

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-story border border-light-beige/30 dark:border-gray-700/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge className="bg-warm-teal/20 text-warm-teal hover:bg-warm-teal/30">
              Chain #{chain.chainId}
            </Badge>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Started {new Date(chain.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ExportStory chainId={chain.chainId.toString()} storyTitle={`Story Chain #${chain.chainId}`} />
            <Button variant="ghost" size="icon">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Story Chain Lines */}
        <div className="space-y-3">
          {chain.stories.map((story, index) => (
            <div 
              key={story.id} 
              className={`flex items-start space-x-3 p-3 rounded-xl transition-colors ${
                index === 0 ? 'bg-story-gradient-start/30' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                {story.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-gray-800 leading-relaxed">{story.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">by {story.authorName}</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHeart(story.id)}
                      disabled={heartMutation.isPending}
                      className="text-gray-500 hover:text-red-500 transition-colors h-6 px-2"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      <span className="text-xs">{story.hearts}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Story Input */}
        {showContinueInput && (
          <div className="mt-4 p-4 bg-accent rounded-xl">
            <Textarea
              placeholder="Continue the story..."
              value={continueText}
              onChange={(e) => setContinueText(e.target.value)}
              className="mb-3 resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {280 - continueText.length} characters left
              </span>
              <div className="space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowContinueInput(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleContinue}
                  disabled={!continueText.trim()}
                  className="bg-warm-teal text-white hover:bg-warm-teal/90"
                >
                  Add to Story
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-sm">{chain.totalHearts}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{chain.totalComments}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-green-500 transition-colors"
            >
              <Share className="w-4 h-4 mr-1" />
              <span className="text-sm">Share</span>
            </Button>
            {!showContinueInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContinueInput(true)}
                className="text-warm-teal hover:text-warm-teal/80"
              >
                Continue Story
              </Button>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {chain.contributorCount} contributor{chain.contributorCount !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
