import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export function VoiceInput({ onTranscription, isDisabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    if (isDisabled || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        try {
          const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription failed');

          const { text } = await response.json();
          onTranscription(text);
          
          toast({
            title: "Voice recorded",
            description: "Your speech has been converted to text.",
          });
        } catch (error) {
          toast({
            title: "Transcription failed",
            description: "Unable to convert speech to text. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);

    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  if (isProcessing) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Processing...
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isDisabled}
      className={isRecording ? "text-red-500" : ""}
    >
      {isRecording ? (
        <>
          <MicOff className="w-4 h-4 mr-2" />
          Stop
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-2" />
          Voice
        </>
      )}
    </Button>
  );
}