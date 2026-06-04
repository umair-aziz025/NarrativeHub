import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ArrowLeft, Plus, Heart, MessageCircle, Users, Clock, 
  Coffee, PenTool, BookOpen, Star, Share, Bookmark, Edit, Trash2, 
  MoreVertical, UserX, Shield, ChevronDown, Trophy, Award, X, UserPlus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/loading-spinner";
import type { Room, Story } from "@shared/schema";

const createStorySchema = z.object({
  title: z.string().min(1, "Story title is required and cannot be empty").max(100, "Title is too long (max 100 characters)"),
  description: z.string().max(200, "Description is too long (max 200 characters)").optional(),
  content: z.string().min(10, "Story content must be at least 10 characters").max(1000, "Story content is too long (max 1000 characters)"),
  chainId: z.number().optional(),
});

const editStorySchema = z.object({
  title: z.string().min(1, "Story title is required and cannot be empty").max(100, "Title is too long (max 100 characters)"),
  description: z.string().max(200, "Description is too long (max 200 characters)").optional(),
  content: z.string().min(10, "Story content must be at least 10 characters").max(1000, "Story content is too long (max 1000 characters)"),
});

type CreateStoryForm = z.infer<typeof createStorySchema>;
type EditStoryForm = z.infer<typeof editStorySchema>;

export default function RoomInterior() {
  const { roomId } = useParams<{ roomId: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [deletingStory, setDeletingStory] = useState<Story | null>(null);
  const [blockingUser, setBlockingUser] = useState<string | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [activeStoryTab, setActiveStoryTab] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Check if user is suspended globally
  const isUserSuspended = currentUser?.status === 'suspended';

  // Get user's room membership to check permissions
  const { data: userMembership } = useQuery<{role: string} | null>({
    queryKey: [`/api/rooms/${roomId}/membership`],
    enabled: !!roomId && isAuthenticated,
    refetchInterval: 2000, // Poll every 2s to catch role changes quickly
    refetchIntervalInBackground: true,
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the data (updated from cacheTime)
  });

  // Check if user is suspended from this specific room
  const isRoomSuspended = userMembership?.role === 'suspended';

  // Debug logging
  console.log('Debug - User suspension status:', {
    userMembership,
    isRoomSuspended,
    isUserSuspended,
    currentUserStatus: currentUser?.status,
    userRole: userMembership?.role
  });

  // If user is suspended (globally or from this room), show suspension message and prevent access
  if (isUserSuspended || isRoomSuspended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 opacity-50" />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mb-8 hover:bg-orange-100 dark:hover:bg-orange-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="py-12 text-center">
                <Shield className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
                  {isUserSuspended ? "Account Suspended" : "Room Suspension"}
                </h1>
                <p className="text-red-700 dark:text-red-300 text-lg mb-6">
                  {isUserSuspended 
                    ? "Your account has been suspended for policy violations. You cannot access rooms while suspended."
                    : "You have been suspended from this room for violations. You cannot view or contribute to stories while suspended."
                  }
                </p>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  If you believe this is an error, please contact the room moderators or support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Permission helper functions
  const getUserRoomRole = () => {
    if (!currentUser) return null;
    
    // Check if user is the room creator
    if (room?.creatorId === currentUser.id) return 'creator';
    
    // Global admins and moderators have their respective roles
    if (currentUser.role === 'admin') return 'admin';
    if (currentUser.role === 'moderator') return 'moderator';
    
    // Check room membership
    return userMembership?.role || null;
  };

  const hasPermission = (permission: string) => {
    const role = getUserRoomRole();
    if (!role) return false;

    // Permission matrix based on roles
    const permissions = {
      creator: ['all'], // Creator has all permissions
      admin: ['all'], // Global admin has all permissions  
      moderator: ['all'], // Global moderator has all permissions
      manager: ['approve_requests', 'reject_requests', 'delete_comments', 'delete_stories', 'suspend_users', 'update_member_roles', 'remove_members', 'view_all', 'create_stories', 'comment', 'heart'], // Manager has extended permissions
      contributor: ['create_stories', 'edit_own_stories', 'comment', 'heart', 'view_all'],
      viewer: ['view_all', 'request_contribute'], // Can only view and request to contribute
    };

    const rolePermissions = permissions[role as keyof typeof permissions] || [];
    return rolePermissions.includes('all') || rolePermissions.includes(permission);
  };

  // Get room details
  const { data: room, isLoading: isRoomLoading } = useQuery<Room>({
    queryKey: [`/api/rooms/${roomId}`],
    enabled: !!roomId,
  });

  // Get room stories - DISABLED for suspended users
  const { data: stories = [], isLoading: isStoriesLoading } = useQuery<Story[]>({
    queryKey: [`/api/rooms/${roomId}/stories`],
    enabled: !!roomId && !isRoomSuspended && !isUserSuspended, // Disable for any suspension
  });

  // Fetch comments for expanded story
  const { data: storyComments = [] } = useQuery({
    queryKey: [`/api/stories/${expandedComments}/comments`],
    queryFn: async () => {
      if (!expandedComments) return [];
      const response = await apiRequest('GET', `/api/stories/${expandedComments}/comments`);
      return response.json();
    },
    enabled: !!expandedComments,
  });

  // Group stories by chain
  const storyChains = React.useMemo(() => {
    const chains = new Map<number, Story[]>();
    stories.forEach((story) => {
      if (!chains.has(story.chainId)) {
        chains.set(story.chainId, []);
      }
      chains.get(story.chainId)!.push(story);
    });
    
    // Convert to array and sort each chain by sequence
    return Array.from(chains.entries()).map(([chainId, chainStories]) => ({
      chainId,
      stories: chainStories.sort((a, b) => a.sequence - b.sequence),
      totalHearts: chainStories.reduce((sum, story) => sum + story.hearts, 0),
      totalComments: chainStories.reduce((sum, story) => sum + story.comments, 0),
      latestActivity: new Date(Math.max(...chainStories.map(s => new Date(s.createdAt).getTime()))),
    })).sort((a, b) => b.latestActivity.getTime() - a.latestActivity.getTime());
  }, [stories]);

  // Check if user is a member
  const { data: membership } = useQuery({
    queryKey: [`/api/rooms/${roomId}/membership`],
    enabled: !!roomId && isAuthenticated,
  });

  // Get contributor requests for this room (if user has permission to view them)
  const { data: contributorRequests = [] } = useQuery({
    queryKey: [`/api/rooms/${roomId}/contributor-requests`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/rooms/${roomId}/contributor-requests`);
      return response.json();
    },
    enabled: !!roomId && hasPermission('approve_requests'),
  });

  // Check if current user has already made a contributor request
  const { data: userContributorRequest } = useQuery({
    queryKey: [`/api/rooms/${roomId}/contributor-requests/my-request`],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/rooms/${roomId}/contributor-requests/my-request`);
        return response.json();
      } catch (error) {
        // Return null if no request found (404 is expected)
        return null;
      }
    },
    enabled: !!roomId && isAuthenticated && getUserRoomRole() === 'viewer',
  });

  const form = useForm<CreateStoryForm>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  const editForm = useForm<EditStoryForm>({
    resolver: zodResolver(editStorySchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: CreateStoryForm) => {
      const response = await apiRequest('POST', `/api/rooms/${roomId}/stories`, {
        ...data,
        roomId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Refresh user stories
      setShowCreateStory(false);
      setSelectedChain(null); // Clear selected chain
      form.reset();
      toast({
        title: "Story created! ✨",
        description: "Your contribution has been added to the room.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleHeartMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest('POST', `/api/stories/${storyId}/heart`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] }); // Update room cards
      toast({
        title: data.hearted ? "❤️" : "💔",
        description: data.hearted ? "Story liked!" : "Story unliked!",
      });
    },
  });

  const editStoryMutation = useMutation({
    mutationFn: async ({ storyId, data }: { storyId: string; data: EditStoryForm }) => {
      const response = await apiRequest('PUT', `/api/stories/${storyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      setEditingStory(null);
      editForm.reset();
      toast({
        title: "Story updated! ✨",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest('DELETE', `/api/stories/${storyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      setDeletingStory(null);
      toast({
        title: "Story deleted",
        description: "The story has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await apiRequest('POST', `/api/rooms/${roomId}/block/${userId}`, { reason });
      return response.json();
    },
    onSuccess: () => {
      setBlockingUser(null);
      toast({
        title: "User blocked",
        description: "The user has been blocked from this room.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Comment mutations
  const createCommentMutation = useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/stories/${storyId}/comments`, { content });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${variables.storyId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      setCommentText("");
      setExpandedComments(null);
      toast({
        title: "Comment posted! 💬",
        description: "Your comment has been added to the story.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleCommentHeartMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('POST', `/api/comments/${commentId}/heart`);
      return response.json();
    },
    onSuccess: (result, commentId) => {
      // Invalidate comments for the current expanded story
      if (expandedComments) {
        queryClient.invalidateQueries({ queryKey: [`/api/stories/${expandedComments}/comments`] });
      }
      // Also invalidate room stories to update comment counts
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      
      // Show appropriate toast message
      toast({
        title: result.isHearted ? "Comment liked! ❤️" : "Like removed",
        description: result.isHearted ? "You showed love for this comment." : "You removed your like from this comment.",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('DELETE', `/api/comments/${commentId}`);
      return response.json();
    },
    onSuccess: (_, commentId) => {
      // Invalidate comments for the current expanded story
      if (expandedComments) {
        queryClient.invalidateQueries({ queryKey: [`/api/stories/${expandedComments}/comments`] });
      }
      // Also invalidate room stories to update comment counts
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/stories`] });
      
      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Contributor request mutations
  const requestContributorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/rooms/${roomId}/contributor-requests`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/membership`] });
      toast({
        title: "Request sent! 📨",
        description: "Your contributor request has been sent to the room managers.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveContributorMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}/contributor-requests/${requestId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] }); // Update room member counts
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      toast({
        title: "Request approved! ✅",
        description: "The contributor request has been approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectContributorMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}/contributor-requests/${requestId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] }); // Update room member counts
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      toast({
        title: "Request rejected ❌",
        description: "The contributor request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || isRoomLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-cream via-soft-beige to-gentle-tan">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="py-8 text-center">
              <Coffee className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please sign in to access this room.
              </p>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-cream via-soft-beige to-gentle-tan">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Room Not Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This room doesn't exist or you don't have access to it.
              </p>
              <Button 
                onClick={() => setLocation('/rooms')}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Back to Rooms
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = (data: CreateStoryForm) => {
    createStoryMutation.mutate(data);
  };

  const onEditSubmit = (data: EditStoryForm) => {
    if (editingStory) {
      editStoryMutation.mutate({ storyId: editingStory.id, data });
    }
  };

  const handlePostComment = (storyId: string) => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ storyId, content: commentText.trim() });
  };

  const handleCloseComments = () => {
    setExpandedComments(null);
    setCommentText("");
  };

  const handleOpenComments = (storyId: string) => {
    setExpandedComments(expandedComments === storyId ? null : storyId);
    if (expandedComments !== storyId) {
      setCommentText(""); // Clear comment text when switching to a different story
    }
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    editForm.reset({
      title: story.title || "",
      description: story.description || "",
      content: story.content,
    });
  };

  const isRoomOwner = room?.creatorId === currentUser?.id;
  const canContribute = hasPermission('create_stories');
  const isViewer = getUserRoomRole() === 'viewer';

  // Calculate user level from experience
  const getUserLevel = (experience: number) => {
    return Math.floor(experience / 100) + 1;
  };

  const getProgressPercentage = (experience: number) => {
    const currentLevelXP = experience % 100;
    return currentLevelXP;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-cream via-soft-beige to-gentle-tan">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-orange-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/rooms')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white text-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-serif font-semibold text-xl text-gray-800 dark:text-white">
                    {room.name}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {room.description || "Collaborative storytelling room"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-warm-teal text-white">
                          {currentUser.username?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{currentUser.username || 'User'}</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={currentUser.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-warm-teal text-white text-lg">
                            {currentUser.username?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{currentUser.username || 'User'}</p>
                          <p className="text-sm text-gray-500">{currentUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Hearts</span>
                          </div>
                          <span className="text-sm font-medium">
                            {(currentUser as any).hearts || currentUser.heartsReceived || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Contributions</span>
                          </div>
                          <span className="text-sm font-medium">
                            {(currentUser as any).contributions || currentUser.contributionsCount || 0}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Trophy className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                Level {getUserLevel((currentUser as any).experience || currentUser.experiencePoints || 0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {(currentUser as any).experience || currentUser.experiencePoints || 0} XP
                            </span>
                          </div>
                          <Progress 
                            value={getProgressPercentage((currentUser as any).experience || currentUser.experiencePoints || 0)} 
                            className="h-2" 
                          />
                          <p className="text-xs text-gray-500 text-center">
                            {100 - getProgressPercentage((currentUser as any).experience || currentUser.experiencePoints || 0)} XP to next level
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation('/profile')}>
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/rooms')}>
                      My Rooms
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation('/auth')}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DEBUG: Suspension Status */}
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <strong>DEBUG:</strong> 
          User Role: {userMembership?.role || 'none'} | 
          Room Suspended: {isRoomSuspended ? 'YES' : 'NO'} | 
          Globally Suspended: {isUserSuspended ? 'YES' : 'NO'} |
          Current User Status: {currentUser?.status || 'unknown'}
        </div>

        {/* Room Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{room.name}</CardTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{room.prompt}</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{room.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{stories.length} stories</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{room.totalHearts} hearts</span>
                </div>
              </div>
            </div>
            {room.tags && room.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {room.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Create Story Button */}
        {canContribute && (
          <div className="mb-8">
            <Button
              onClick={() => setShowCreateStory(true)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Write a Story
            </Button>
          </div>
        )}

        {/* Viewer Message and Request Access */}
        {isViewer && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    👀 Viewer Mode
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300 mb-4">
                    You're currently viewing this room. To contribute stories, request contributor access from the room creator or manager.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                  disabled={
                    requestContributorMutation.isPending || 
                    (userContributorRequest && userContributorRequest.status === 'pending') ||
                    (userContributorRequest && userContributorRequest.status === 'approved' && getUserRoomRole() !== 'viewer')
                  }
                  onClick={() => {
                    if (!userContributorRequest || userContributorRequest.status === 'rejected' || getUserRoomRole() === 'viewer') {
                      requestContributorMutation.mutate();
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {requestContributorMutation.isPending 
                    ? "Sending..." 
                    : userContributorRequest && userContributorRequest.status === 'pending'
                      ? "Request Pending"
                      : userContributorRequest && userContributorRequest.status === 'approved' && getUserRoomRole() !== 'viewer'
                        ? "Request Approved" 
                        : "Request Contributor Access" // Default for viewers, rejected requests, or when role doesn't match approval
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Block story access for suspended users */}
        {(isRoomSuspended || isUserSuspended) ? (
          <Card className="mb-8 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-8 text-center">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">
                Access Restricted
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {isUserSuspended 
                  ? "Your account has been suspended and you cannot view story content in any room."
                  : "You are currently suspended from this room and cannot view story content."
                } Contact the room creator or wait for your suspension to be lifted.
              </p>
              <div className="text-sm text-red-600 dark:text-red-400">
                <p>While suspended, you can still request contributor access for when your suspension is lifted.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stories */}
            <div className="space-y-6">
              {Object.entries(storyChains).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No stories yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Be the first to contribute to this storytelling room!
                    </p>
                    {canContribute && (
                      <Button
                        onClick={() => setShowCreateStory(true)}
                        className="bg-orange-600 text-white hover:bg-orange-700"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Start Writing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {storyChains.map((chain) => (
                <Card key={chain.chainId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2" onClick={() => setExpandedStory(expandedStory === `chain-${chain.chainId}` ? null : `chain-${chain.chainId}`)}>
                          {chain.stories[0]?.title || `Story Chain #${chain.chainId}`}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {chain.stories.length} part{chain.stories.length !== 1 ? 's' : ''} • Latest: {chain.latestActivity.toLocaleDateString()}
                        </p>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {chain.stories.length} part{chain.stories.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <p 
                        className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 cursor-pointer"
                        onClick={() => setExpandedStory(expandedStory === `chain-${chain.chainId}` ? null : `chain-${chain.chainId}`)}
                      >
                        {chain.stories[0]?.content || "No content available"}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span>by {chain.stories.map(s => s.authorName).join(', ')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-red-500"
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            <span className="text-xs">{chain.totalHearts}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStory(expandedStory === `chain-${chain.chainId}` ? null : `chain-${chain.chainId}`);
                            }}
                            className="h-8 px-2 text-gray-500 hover:text-blue-500"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{chain.totalComments}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Story Chain Parts */}
                    {expandedStory === `chain-${chain.chainId}` && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-800">Story Parts ({chain.stories.length})</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedStory(null)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Story Parts Navigation Tabs */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {chain.stories.map((story, index) => (
                            <Button
                              key={story.id}
                              variant={activeStoryTab === story.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveStoryTab(activeStoryTab === story.id ? null : story.id)}
                              className={`h-8 text-xs ${
                                activeStoryTab === story.id 
                                  ? "bg-blue-500 text-white" 
                                  : "text-gray-600 hover:text-blue-600"
                              }`}
                            >
                              Part {story.sequence}
                              <span className="ml-1 text-xs opacity-70">by {story.authorName}</span>
                            </Button>
                          ))}
                        </div>
                        
                        {/* Selected Story Part Display */}
                        {activeStoryTab && chain.stories.map((story) => 
                          activeStoryTab === story.id ? (
                            <div key={story.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="default" className="text-xs bg-blue-500">
                                    Part {story.sequence}
                                  </Badge>
                                  <span className="text-xs text-gray-600">by {story.authorName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(story.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                {(story.authorId === currentUser?.id || isRoomOwner) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditStory(story)}>
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => setDeletingStory(story)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-800 leading-relaxed bg-white rounded p-3 border">
                                {story.content}
                              </p>
                              
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleHeartMutation.mutate(story.id);
                                    }}
                                    className={`h-7 px-2 transition-colors ${
                                      (story as any).isHearted 
                                        ? "text-red-500 hover:text-red-600" 
                                        : "text-gray-500 hover:text-red-500"
                                    }`}
                                  >
                                    <Heart 
                                      className={`h-3 w-3 mr-1 ${
                                        (story as any).isHearted ? "fill-red-500" : ""
                                      }`} 
                                    />
                                    <span className="text-xs">{story.hearts}</span>
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenComments(story.id);
                                    }}
                                    className="h-7 px-2 text-gray-500 hover:text-blue-500"
                                    title="Click to add a comment"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    <span className="text-xs">{story.comments > 0 ? story.comments : 'Comment'}</span>
                                  </Button>
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                  👁️ Click other parts to view them
                                </div>
                              </div>
                              
                              {/* Comment Section for Individual Stories */}
                              {expandedComments === story.id && (
                                <div className="mt-3 pt-3 border-t border-blue-200 space-y-3 bg-blue-100 rounded-lg p-3">
                                  <h5 className="text-sm font-medium text-gray-700">💬 Add a Comment</h5>
                                  <div className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                                      {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <Textarea
                                        placeholder="Share your thoughts about this part of the story..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="min-h-[60px] text-sm border-blue-200 focus:border-blue-400 bg-white"
                                        rows={2}
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">
                                          {250 - commentText.length} characters left
                                        </span>
                                        <div className="flex space-x-2">
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCloseComments}
                                            className="h-7 text-xs px-3"
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            size="sm"
                                            disabled={!commentText.trim() || commentText.length > 250 || createCommentMutation.isPending}
                                            onClick={() => handlePostComment(story.id)}
                                            className="bg-blue-500 hover:bg-blue-600 h-7 text-xs px-3"
                                          >
                                            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Display existing comments */}
                                  {storyComments.length > 0 && (
                                    <div className="space-y-3">
                                      <h6 className="text-sm font-medium text-gray-700">Comments ({storyComments.length})</h6>
                                      {storyComments.map((comment: any) => (
                                        <div key={comment.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                          <div className="flex items-start space-x-2">
                                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                                              {comment.authorName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-sm font-medium text-gray-800">{comment.authorName}</span>
                                                <span className="text-xs text-gray-500">
                                                  {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                                {comment.isEdited && (
                                                  <span className="text-xs text-gray-400 italic">(edited)</span>
                                                )}
                                              </div>
                                              <p className="text-sm text-gray-700">{comment.content}</p>
                                              <div className="flex items-center space-x-2 mt-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => toggleCommentHeartMutation.mutate(comment.id)}
                                                  className="h-6 px-2 text-gray-500 hover:text-red-500"
                                                >
                                                  <Heart 
                                                    className={`h-3 w-3 mr-1 ${
                                                      comment.isHearted ? "fill-red-500 text-red-500" : ""
                                                    }`} 
                                                  />
                                                  <span className="text-xs">{comment.hearts || 0}</span>
                                                </Button>
                                                
                                                {(comment.userId === currentUser?.id || isRoomOwner) && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                                    className="h-6 px-2 text-gray-500 hover:text-red-500"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {storyComments.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : null
                        )}
                        
                        {!activeStoryTab && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📖</div>
                            <p className="text-sm">Click on a part above to read that section of the story</p>
                            <p className="text-xs text-gray-400 mt-1">Each part can be read individually without scrolling through everything</p>
                          </div>
                        )}
                        
                        {/* Continue Story Button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => {
                              if (canContribute) {
                                setSelectedChain(chain.chainId);
                                setShowCreateStory(true);
                              }
                            }}
                            className={`w-full ${canContribute 
                              ? 'bg-warm-teal hover:bg-warm-teal/90 text-white' 
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
                            }`}
                            size="sm"
                            disabled={!canContribute}
                            style={{ pointerEvents: canContribute ? 'auto' : 'none' }}
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            Continue This Story
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* Create Story Dialog */}
      {canContribute && (
        <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedChain 
                  ? `Continue "${storyChains.find(c => c.chainId === selectedChain)?.stories[0]?.title || `Story Chain #${selectedChain}`}"` 
                  : 'Write a New Story'}
              </DialogTitle>
            </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Story Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give your story a compelling title..."
                        {...field}
                        className="border-2 focus:border-warm-teal"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A short description of your story..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Story Contribution</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your part of the story here..."
                        className="min-h-[200px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedChain && (
                <input
                  type="hidden"
                  {...form.register('chainId', { value: selectedChain })}
                />
              )}
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateStory(false);
                    setSelectedChain(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStoryMutation.isPending}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  {createStoryMutation.isPending ? "Publishing..." : "Publish Story"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      )}

      {/* Edit Story Dialog */}
      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give your story a compelling title..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A short description of your story..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your story content here..."
                        className="min-h-[200px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStory(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editStoryMutation.isPending}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  {editStoryMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Story Confirmation */}
      <AlertDialog open={!!deletingStory} onOpenChange={() => setDeletingStory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingStory?.title || 'this story'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStory && deleteStoryMutation.mutate(deletingStory.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story Detail Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedStory?.title || `Story Part ${selectedStory?.sequence}`}
            </DialogTitle>
            {selectedStory?.description && (
              <p className="text-gray-600 dark:text-gray-300">{selectedStory.description}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>by {selectedStory?.authorName}</span>
                <Badge variant="outline">
                  Chain #{selectedStory?.chainId} • Part {selectedStory?.sequence}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>{selectedStory?.hearts}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span>{selectedStory?.comments}</span>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {selectedStory?.content}
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => selectedStory && toggleHeartMutation.mutate(selectedStory.id)}
                className={`flex items-center space-x-2 transition-colors ${
                  (selectedStory as any)?.isHearted 
                    ? "text-red-500 border-red-500 hover:bg-red-50" 
                    : "hover:text-red-500 hover:border-red-500"
                }`}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    (selectedStory as any)?.isHearted ? "fill-red-500" : ""
                  }`} 
                />
                <span>{(selectedStory as any)?.isHearted ? "Liked" : "Like Story"}</span>
              </Button>
              
              {canContribute && (
                <Button
                  onClick={() => {
                    if (selectedStory) {
                      setSelectedChain(selectedStory.chainId);
                      setSelectedStory(null);
                      setShowCreateStory(true);
                    }
                  }}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Continue Story
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
