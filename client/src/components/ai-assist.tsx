import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AIAssistProps {
  currentStory: string;
  onSuggestion: (suggestion: string) => void;
  isDisabled?: boolean;
}

export function AIAssist({ currentStory, onSuggestion, isDisabled }: AIAssistProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSuggestion = async () => {
    if (isDisabled || isGenerating || !currentStory.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/continue-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyContext: currentStory }),
      });

      if (!response.ok) throw new Error('AI suggestion failed');

      const { continuation } = await response.json();
      onSuggestion(continuation);
      
      toast({
        title: "AI suggestion generated",
        description: "A creative continuation has been suggested for your story.",
      });
    } catch (error) {
      toast({
        title: "AI suggestion failed",
        description: "Unable to generate story continuation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generateSuggestion}
      disabled={isDisabled || isGenerating || !currentStory.trim()}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Thinking...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assist
        </>
      )}
    </Button>
  );
}