import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, DoorOpen, ChevronRight, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Room } from "@shared/schema";

interface RoomManagerProps {
  currentUser: User;
}

export default function RoomManager({ currentUser }: RoomManagerProps) {
  const [roomName, setRoomName] = useState("");
  const [roomPrompt, setRoomPrompt] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isThemed, setIsThemed] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const { toast } = useToast();

  // Fetch public rooms
  const { data: publicRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms/public"],
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: api.createRoom,
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      toast({
        title: "Room Created!",
        description: `Room "${room.name}" created with code: ${room.code}`,
      });
      // Reset form
      setRoomName("");
      setRoomPrompt("");
      setIsPrivate(false);
      setIsThemed(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: api.joinRoom,
    onSuccess: (room) => {
      toast({
        title: "Joined Room!",
        description: `Welcome to "${room.name}"`,
      });
      setRoomCode("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Room not found or unable to join.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!roomName.trim() || !roomPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in room name and starting prompt.",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate({
      name: roomName,
      prompt: roomPrompt,
      isPrivate,
      isThemed,
      theme: isThemed ? "Custom Theme" : "",
      creatorId: currentUser.id,
    });
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim() || roomCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-character room code.",
        variant: "destructive",
      });
      return;
    }

    joinRoomMutation.mutate(roomCode.toUpperCase());
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-story border border-light-beige/30 dark:border-gray-700/50">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h3 className="font-serif text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Create Your Story Circle</h3>
          <p className="text-gray-600 dark:text-gray-400">Start a private room with friends or join existing story circles</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <PlusCircle className="text-warm-teal mr-2 w-5 h-5" />
              Create New Room
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="roomName" className="text-sm text-gray-600 dark:text-gray-400">Room Name</Label>
                <Input 
                  id="roomName"
                  type="text" 
                  placeholder="e.g., Midnight Storytellers" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="roomPrompt" className="text-sm text-gray-600 dark:text-gray-400">Starting Prompt</Label>
                <Textarea 
                  id="roomPrompt"
                  placeholder="Someone somewhere is..." 
                  value={roomPrompt}
                  onChange={(e) => setRoomPrompt(e.target.value)}
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                  />
                  <Label htmlFor="private" className="text-sm text-gray-600 dark:text-gray-400">Private (invite only)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="themed"
                    checked={isThemed}
                    onCheckedChange={(checked) => setIsThemed(checked === true)}
                  />
                  <Label htmlFor="themed" className="text-sm text-gray-600 dark:text-gray-400">Themed</Label>
                </div>
              </div>

              <Button 
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="w-full bg-warm-teal text-white hover:bg-warm-teal/90"
              >
                {createRoomMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Room
                    <DoorOpen className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Join Room */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <DoorOpen className="text-warm-brown mr-2 w-5 h-5" />
              Join Existing Room
            </h4>

            <div className="space-y-4">
              <div>
                <Label htmlFor="roomCode" className="text-sm text-gray-600 dark:text-gray-400">Room Code</Label>
                <Input 
                  id="roomCode"
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="mt-1 uppercase tracking-widest text-center"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleJoinRoom}
                disabled={joinRoomMutation.isPending || roomCode.length !== 6}
                className="w-full bg-warm-brown text-white hover:bg-warm-brown/90"
              >
                {joinRoomMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    Join Room
                    <LogIn className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Active Rooms Preview */}
            {publicRooms.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Popular Public Rooms</h5>
                  <div className="space-y-2">
                    {publicRooms.slice(0, 3).map((room) => (
                      <Button
                        key={room.id}
                        variant="ghost"
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 h-auto"
                      >
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-500">
                              {room.memberCount} active writer{room.memberCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
