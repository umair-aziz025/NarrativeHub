import { useState } from "react";
import { Download, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ExportStoryProps {
  chainId: string;
  storyTitle: string;
}

export function ExportStory({ chainId, storyTitle }: ExportStoryProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportStory = async (format: 'pdf' | 'image') => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chainId, title: storyTitle }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format === 'pdf' ? 'pdf' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Story exported",
        description: `Your story has been saved as a ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isExporting}>
          <Download className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportStory('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportStory('image')}>
          <Image className="w-4 h-4 mr-2" />
          Export as Image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}