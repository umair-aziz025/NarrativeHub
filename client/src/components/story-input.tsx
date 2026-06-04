import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cookie, Plus } from "lucide-react";
import { VoiceInput } from "@/components/voice-input";
import { AIAssist } from "@/components/ai-assist";
import type { User } from "@shared/schema";

interface StoryInputProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
  user: User & { hearts?: number; contributions?: number; experience?: number };
  placeholder?: string;
  currentStory?: string;
}

export default function StoryInput({ 
  onSubmit, 
  isSubmitting, 
  user, 
  placeholder = "Continue the story... 'Someone somewhere is dancing in the rain because...'",
  currentStory = ""
}: StoryInputProps) {
  const [content, setContent] = useState("");
  
  const handleSubmit = () => {
    if (!content.trim() || isSubmitting) return;
    
    onSubmit(content);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setContent(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleAISuggestion = (suggestion: string) => {
    setContent(suggestion);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-story">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-warm-teal rounded-full flex items-center justify-center text-white flex-shrink-0">
            <Cookie className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <Textarea 
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 border border-light-beige dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-warm-teal focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              maxLength={280}
            />
            
            {/* Advanced Features */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <VoiceInput 
                  onTranscription={handleVoiceTranscription}
                  isDisabled={isSubmitting}
                />
                <Separator orientation="vertical" className="h-6" />
                <AIAssist 
                  currentStory={currentStory}
                  onSuggestion={handleAISuggestion}
                  isDisabled={isSubmitting}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {280 - content.length} characters left
              </span>
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Tip: Press Ctrl+Enter (or Cmd+Enter) to submit quickly
              </p>
              <Button 
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-warm-teal text-white hover:bg-warm-teal/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    Add to Story
                    <Plus className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
