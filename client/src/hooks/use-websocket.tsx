import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId: string, roomId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
        
        // Join room
        ws.send(JSON.stringify({
          type: "join-room",
          userId,
          roomId,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Lost connection to the server. Stories may not update in real-time.",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, roomId, toast]);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "new-story":
        // Invalidate story chains to refetch with new story
        queryClient.invalidateQueries({ queryKey: ["/api/stories/chains"] });
        
        toast({
          title: "New Story Added!",
          description: "Someone just continued the story chain.",
        });
        break;
        
      case "room-update":
        // Invalidate room data
        queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
        break;
        
      default:
        console.log("Unhandled WebSocket message type:", message.type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  return {
    isConnected,
    sendMessage,
  };
}
