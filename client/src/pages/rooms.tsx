import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Lock, Globe, Search, Coffee, DoorOpen, Heart, MessageCircle, Clock, Eye, UserPlus, Edit, Trash2, Share, Book, UserCheck, UserX, Shield, Crown, MoreVertical, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/loading-spinner";
import type { Room } from "@shared/schema";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(50, "Room name too long"),
  description: z.string().max(200, "Description too long").optional(),
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(500, "Prompt too long"),
  category: z.string().default("general"),
  isPrivate: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  allowInvites: z.boolean().default(true),
  allowComments: z.boolean().default(true),
  allowHearts: z.boolean().default(true),
  maxMembers: z.number().min(2).max(200).default(50),
  isThemed: z.boolean().default(false),
  theme: z.string().optional(),
  rules: z.string().max(1000, "Rules too long").optional(),
  tags: z.array(z.string()).default([]),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

const categories = [
  { value: "general", label: "General", icon: "📚" },
  { value: "fantasy", label: "Fantasy", icon: "🧙‍♂️" },
  { value: "sci-fi", label: "Science Fiction", icon: "🚀" },
  { value: "romance", label: "Romance", icon: "💕" },
  { value: "mystery", label: "Mystery", icon: "🔍" },
  { value: "horror", label: "Horror", icon: "👻" },
  { value: "adventure", label: "Adventure", icon: "⚔️" },
  { value: "drama", label: "Drama", icon: "🎭" },
  { value: "comedy", label: "Comedy", icon: "😄" },
  { value: "historical", label: "Historical", icon: "🏛️" },
];

export default function Rooms() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showPrivate, setShowPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [leavingRoomId, setLeavingRoomId] = useState<string | null>(null);

  // Permission helper functions
  const getUserRoomRole = (room: Room) => {
    if (!currentUser) return null;
    
    // Check if user is the room creator
    if (room.creatorId === currentUser.id) return 'creator';
    
    // Global admins and moderators have their respective roles
    if (currentUser.role === 'admin') return 'admin';
    if (currentUser.role === 'moderator') return 'moderator';
    
    // Check room membership
    const membership = userMemberships.find(m => m.roomId === room.id);
    return membership?.role || null;
  };

  const hasPermission = (room: Room, permission: string) => {
    const role = getUserRoomRole(room);
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

  // All hooks must be called before conditional returns
  const { data: publicRooms = [], isLoading: isRoomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms/public"],
  });

  // Get user's room memberships
  const { data: userMemberships = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms/memberships"],
    enabled: isAuthenticated,
  });

  // Get room members for member management
  const { data: roomMembers = [] } = useQuery<any[]>({
    queryKey: [`/api/rooms/${selectedRoom?.id}/members`],
    enabled: isAuthenticated && showMemberManagement && !!selectedRoom,
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache the data
    refetchInterval: 2000, // Poll every 2s for real-time updates
  });

  // Debug logging for room members
  useEffect(() => {
    if (roomMembers && roomMembers.length > 0) {
      console.log('Room members updated:', roomMembers);
    }
  }, [roomMembers]);

  // Get contributor requests for member management
  const { data: contributorRequests = [] } = useQuery<any[]>({
    queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`],
    enabled: isAuthenticated && showMemberManagement && !!selectedRoom,
  });

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      category: "general",
      isPrivate: false,
      requiresApproval: false,
      allowInvites: true,
      allowComments: true,
      allowHearts: true,
      maxMembers: 50,
      isThemed: false,
      theme: "",
      rules: "",
      tags: [],
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest('POST', '/api/rooms', roomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Room created! 🎉",
        description: "Your storytelling room is ready for contributors.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create room",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, roomData }: { roomId: string; roomData: any }) => {
      const response = await apiRequest('PUT', `/api/rooms/${roomId}`, roomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      setShowEditDialog(false);
      setSelectedRoom(null);
      form.reset();
      toast({
        title: "Room updated! ✅",
        description: "Your room has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update room",
        description: "Please try again or check your permissions.",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiRequest('DELETE', `/api/rooms/${roomId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      setShowRoomDetails(false);
      toast({
        title: "Room deleted",
        description: "The room has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete room",
        description: "Please try again or check your permissions.",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async ({ code, roomId }: { code: string; roomId?: string }) => {
      if (roomId) setJoiningRoomId(roomId);
      const response = await apiRequest('POST', `/api/rooms/join`, { code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      setShowJoinDialog(false);
      setJoinCode("");
      setJoiningRoomId(null);
      toast({
        title: "Joined room! 🎉",
        description: "Welcome to the storytelling circle!",
      });
    },
    onError: (error: any) => {
      setJoiningRoomId(null);
      toast({
        title: "Failed to join room",
        description: error.message || "Please check the room code and try again.",
        variant: "destructive",
      });
    },
  });

  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      setLeavingRoomId(roomId);
      const response = await apiRequest('POST', `/api/rooms/${roomId}/leave`);
      return response.json();
    },
    onSuccess: () => {
      setLeavingRoomId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      toast({
        title: "Left room",
        description: "You have successfully left the room.",
      });
    },
    onError: (error: any) => {
      setLeavingRoomId(null);
      toast({
        title: "Failed to leave room",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Member management mutations
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ roomId, userId, role }: { roomId: string; userId: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/rooms/${roomId}/members/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: async () => {
      // Log for debugging
      console.log('Role update mutation success - starting cache invalidation');
      
      // Invalidate all related queries aggressively
      await queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests/my-request`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      
      // Clear all query cache for this room to force fresh data - BEFORE refetch
      queryClient.removeQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      queryClient.removeQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      
      // Force refetch ALL queries for this room immediately
      await queryClient.refetchQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      await queryClient.refetchQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      
      console.log('Role update mutation - cache invalidation complete');
      
      toast({
        title: "Member role updated",
        description: "The member's role has been successfully changed.",
      });
    },
  });

  const suspendMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const response = await apiRequest('POST', `/api/rooms/${roomId}/members/${userId}/suspend`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      toast({
        title: "Member suspended",
        description: "The member has been suspended from the room.",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const response = await apiRequest('DELETE', `/api/rooms/${roomId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/memberships"] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the room.",
      });
    },
  });

  // Contributor request mutations
  const approveContributorMutation = useMutation({
    mutationFn: async ({ roomId, requestId }: { roomId: string; requestId: string }) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}/contributor-requests/${requestId}/approve`);
      return response.json();
    },
    onSuccess: async () => {
      // Force refetch specific queries
      await queryClient.refetchQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      await queryClient.refetchQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      await queryClient.refetchQueries({ queryKey: ["/api/rooms/public"] });
      
      // Also invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
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
    mutationFn: async ({ roomId, requestId }: { roomId: string; requestId: string }) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}/contributor-requests/${requestId}/reject`);
      return response.json();
    },
    onSuccess: async () => {
      // Force refetch specific queries  
      await queryClient.refetchQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      await queryClient.refetchQueries({ queryKey: ["/api/rooms/public"] });
      
      // Also invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/contributor-requests/my-request`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${selectedRoom?.id}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/public"] });
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

  // Show loading while authentication is being determined
  if (isLoading) {
    return <PageLoader />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-black flex flex-col">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-light-beige/50 dark:border-gray-700/50 sticky top-0 z-50 h-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white text-xl float-animation">
                  <Coffee className="w-5 h-5 icon-animate" />
                </div>
                <div>
                  <h1 className="font-serif font-semibold text-xl text-gray-800 dark:text-white">
                    Echoes Cafe
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-signature signature-glow">
                    by Cookie
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-orange-600 text-white hover:bg-orange-700 btn-animate"
                >
                  Sign In to Join
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Join the Story Circle</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sign in to create and join collaborative storytelling rooms.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper functions
  const isUserMember = (roomId: string) => {
    return userMemberships.some((membership: any) => membership.roomId === roomId);
  };

  const canViewRoomCode = (room: Room) => {
    // Only room creator can see private room codes
    return !room.isPrivate || isRoomOwner(room);
  };

  const canJoinRoom = (room: Room) => {
    // Can join if not already a member and not the creator
    // Global admins/moderators can join any room
    const isGlobalModerator = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
    const isNotMemberOrCreator = !isUserMember(room.id) && !isRoomOwner(room);
    
    return isNotMemberOrCreator && (isGlobalModerator || !room.isPrivate || room.creatorId === currentUser?.id);
  };

  const canLeaveRoom = (room: Room) => {
    // Can leave if already a member but not the creator
    return isUserMember(room.id) && !isRoomOwner(room);
  };

  const canEnterRoom = (room: Room) => {
    // Can enter if the user is the creator OR is a member OR is a global admin/moderator
    const isGlobalModerator = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
    return isRoomOwner(room) || isUserMember(room.id) || isGlobalModerator;
  };

  const onSubmit = (data: CreateRoomForm) => {
    if (showEditDialog && selectedRoom) {
      // Update existing room
      updateRoomMutation.mutate({
        roomId: selectedRoom.id,
        roomData: data
      });
    } else {
      // Create new room
      createRoomMutation.mutate(data);
    }
  };

  const handleViewRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    // Populate form with room data
    form.reset({
      name: room.name,
      description: room.description || "",
      prompt: room.prompt,
      category: room.category || "general",
      isPrivate: room.isPrivate,
      requiresApproval: room.requiresApproval,
      allowInvites: room.allowInvites,
      allowComments: room.allowComments,
      allowHearts: room.allowHearts,
      maxMembers: room.maxMembers || 50,
      isThemed: room.isThemed,
      theme: room.theme || "",
      rules: room.rules || "",
      tags: room.tags || [],
    });
    setShowEditDialog(true);
  };

  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = () => {
    if (roomToDelete) {
      deleteRoomMutation.mutate(roomToDelete.id);
      setShowDeleteConfirm(false);
      setRoomToDelete(null);
    }
  };

  const handleShareRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowShareDialog(true);
  };

  const shareToSocialMedia = (platform: string, room: Room) => {
    const shareText = `Join me in this amazing storytelling room: "${room.name}" - ${room.description || room.prompt}`;
    const shareUrl = `${window.location.origin}/rooms?code=${room.code}`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\nRoom Code: ${room.code}\nJoin here: ${shareUrl}`);
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard.",
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const isRoomOwner = (room: Room) => {
    return currentUser?.id === room.creatorId || currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  };

  const handleEnterRoom = (room: Room) => {
    // Navigate to the room interior page
    window.location.href = `/rooms/${room.id}`;
  };

  const addTag = () => {
    if (currentTag.trim() && !form.getValues('tags').includes(currentTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const filteredRooms = publicRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || room.category === selectedCategory;
    const matchesPrivacy = showPrivate || !room.isPrivate;
    
    return matchesSearch && matchesCategory && matchesPrivacy;
  }).sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime();
      case "popular":
        return (b.memberCount || 0) - (a.memberCount || 0);
      case "stories":
        return (b.totalStories || 0) - (a.totalStories || 0);
      case "alphabetical":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-black flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-light-beige/50 dark:border-gray-700/50 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-warm-teal to-warm-brown rounded-full flex items-center justify-center text-white text-xl float-animation">
                <Coffee className="w-5 h-5 icon-animate" />
              </div>
              <div>
                <h1 className="font-serif font-semibold text-xl text-gray-800 dark:text-white">
                  Echoes Cafe
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic font-signature signature-glow">
                  by Cookie
                </p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {currentUser && <UserProfile user={currentUser} compact />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
            Story Rooms
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Create or join collaborative storytelling sessions where imagination knows no bounds
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Quick Join Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 shadow-story border border-orange-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center sm:justify-start mb-2 text-lg">
                    <DoorOpen className="text-orange-600 mr-3 w-6 h-6" />
                    Join Existing Room
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">Have a room code? Enter it below to join instantly and start collaborating!</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div>
                    <Label htmlFor="quickJoinCode" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Room Code</Label>
                    <Input 
                      id="quickJoinCode"
                      type="text" 
                      placeholder="Click to enter room code" 
                      value={joinCode}
                      onClick={() => setShowJoinDialog(true)}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="uppercase tracking-widest text-center w-48 font-mono text-lg font-bold border-orange-300 focus:border-orange-500 dark:border-gray-500 cursor-pointer"
                      maxLength={6}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="space-y-6 mb-8">
          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search rooms by name, prompt, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 text-lg border-gray-300 focus:border-orange-500 dark:border-gray-600 rounded-full shadow-sm"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-orange-200 focus:border-orange-500">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 border-orange-200 focus:border-orange-500">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="stories">Most Stories</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <Switch
                id="show-private"
                checked={showPrivate}
                onCheckedChange={setShowPrivate}
              />
              <Label htmlFor="show-private" className="font-medium">Include Private</Label>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {isRoomsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rooms found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm || selectedCategory !== "all" ? "Try adjusting your search or filters" : "No story rooms available at the moment"}
            </p>
            
            {/* Add Room Button */}
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const category = categories.find(c => c.value === room.category);
              return (
                <Card 
                  key={room.id} 
                  className={`hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                    canEnterRoom(room) ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => canEnterRoom(room) ? handleEnterRoom(room) : undefined}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{category?.icon || "📚"}</span>
                          <Badge variant="outline" className="text-xs">
                            {category?.label || room.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg truncate">{room.name}</CardTitle>
                        {room.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {room.isPrivate ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Globe className="h-4 w-4 text-green-500" />
                        )}
                        <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
                          {room.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {room.prompt}
                    </p>
                    
                    {/* Room Tags */}
                    {room.tags && room.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {room.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {room.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{room.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Room Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{room.memberCount || 0}/{room.maxMembers || 50}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Book className="h-4 w-4" />
                          <span>{room.totalStories || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{room.totalHearts || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(room.lastActivity || room.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {room.requiresApproval && (
                          <Badge variant="outline" className="text-xs">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Approval Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRoom(room);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Show share button only for public rooms or if user is the creator */}
                        {(!room.isPrivate || isRoomOwner(room)) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareRoom(room);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Creator actions */}
                        {isRoomOwner(room) && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRoom(room);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Join/Leave actions */}
                        {canJoinRoom(room) && (
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              joinRoomMutation.mutate({ code: room.code, roomId: room.id });
                            }}
                            disabled={joiningRoomId === room.id}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {joiningRoomId === room.id ? "Joining..." : "Join"}
                          </Button>
                        )}
                        
                        {canLeaveRoom(room) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              leaveRoomMutation.mutate(room.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                            disabled={leavingRoomId === room.id}
                          >
                            <DoorOpen className="h-4 w-4 mr-1" />
                            {leavingRoomId === room.id ? "Leaving..." : "Leave"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 text-center font-signature signature-glow mx-auto">
              © 2025 Echoes Cafe. Made with ❤️ for storytellers everywhere.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {/* Additional footer content can go here */}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="joinCode">Room Code</Label>
              <Input
                id="joinCode"
                placeholder="Enter 6-character room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="uppercase text-center text-lg tracking-wider"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => joinRoomMutation.mutate({ code: joinCode })}
                disabled={joinCode.length !== 6 || joinRoomMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Details Dialog */}
      <Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedRoom?.name}</span>
              {selectedRoom && isRoomOwner(selectedRoom) && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareRoom(selectedRoom)}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRoom(selectedRoom)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRoom(selectedRoom)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              {/* Room Code - Only visible to owner */}
              {isRoomOwner(selectedRoom) && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Room Code (Share this with others)
                      </Label>
                      <p className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                        {selectedRoom.code}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareRoom(selectedRoom)}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {/* Room Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {categories.find(c => c.value === selectedRoom.category)?.label || selectedRoom.category}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedRoom.status === 'active' ? 'default' : 'secondary'}>
                    {selectedRoom.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Privacy</Label>
                  <div className="flex items-center space-x-1">
                    {selectedRoom.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm">{selectedRoom.isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Members</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedRoom.memberCount || 0} / {selectedRoom.maxMembers || 50}
                    </p>
                    {isRoomOwner(selectedRoom) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMemberManagement(true)}
                        className="text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {selectedRoom.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {selectedRoom.description}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Story Prompt</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {selectedRoom.prompt}
                </p>
              </div>

              {selectedRoom.rules && (
                <div>
                  <Label className="text-sm font-medium">Rules</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {selectedRoom.rules}
                  </p>
                </div>
              )}

              {selectedRoom.tags && selectedRoom.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRoom.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-semibold">{selectedRoom.totalStories || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Stories</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span className="font-semibold">{selectedRoom.totalHearts || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Hearts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">
                      {new Date(selectedRoom.lastActivity || selectedRoom.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Last Activity</p>
                </div>
              </div>

              {!isRoomOwner(selectedRoom) && (
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => joinRoomMutation.mutate({ code: selectedRoom.code, roomId: selectedRoom.id })}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={joiningRoomId === selectedRoom.id}
                  >
                    {joiningRoomId === selectedRoom.id ? "Joining..." : "Join This Room"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Room Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? "Edit Room" : "Create a New Story Room"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter room name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.icon} {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your room" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Prompt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Start your story with an engaging prompt..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Members</FormLabel>
                      <FormControl>
                        <Input type="number" min="2" max="200" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Private Room</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Requires Approval</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowComments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Allow Comments</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Rules (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Set guidelines for your room..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setShowEditDialog(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {(createRoomMutation.isPending || updateRoomMutation.isPending) ? "Saving..." : (showEditDialog ? "Update Room" : "Create Room")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roomToDelete?.name}"? This action cannot be undone and will remove all stories and data associated with this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRoom}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteRoomMutation.isPending ? "Deleting..." : "Delete Room"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Room</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedRoom.name}
                </h3>
                {canViewRoomCode(selectedRoom) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Room Code: <span className="font-mono font-bold text-lg">{selectedRoom.code}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Share on social media:
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => shareToSocialMedia('twitter', selectedRoom)}
                    className="justify-start"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => shareToSocialMedia('facebook', selectedRoom)}
                    className="justify-start"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => shareToSocialMedia('whatsapp', selectedRoom)}
                    className="justify-start"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => shareToSocialMedia('telegram', selectedRoom)}
                    className="justify-start"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </Button>
                </div>
                
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    onClick={() => shareToSocialMedia('copy', selectedRoom)}
                    className="w-full justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Management Dialog */}
      <Dialog open={showMemberManagement} onOpenChange={setShowMemberManagement}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Manage Room Members</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Members */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(roomMembers as any[])
                .filter((member: any) => 
                  member.user?.username?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                  member.user?.firstName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                  member.user?.lastName?.toLowerCase().includes(memberSearchTerm.toLowerCase())
                )
                .map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.user?.firstName && member.user?.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user?.username || 'Unknown User'
                          }
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {member.role === 'creator' && <Crown className="h-3 w-3 mr-1" />}
                            {member.role === 'manager' && <Shield className="h-3 w-3 mr-1" />}
                            {member.role === 'contributor' && <UserCheck className="h-3 w-3 mr-1" />}
                            {member.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                            {member.role}
                          </Badge>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Member Actions */}
                    {member.role !== 'creator' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Role Management */}
                          {member.role !== 'viewer' && (
                            <DropdownMenuItem 
                              onClick={() => updateMemberRoleMutation.mutate({
                                roomId: selectedRoom!.id,
                                userId: member.user?.id || member.userId,
                                role: 'viewer'
                              })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                          )}
                          
                          {member.role !== 'contributor' && (
                            <DropdownMenuItem 
                              onClick={() => updateMemberRoleMutation.mutate({
                                roomId: selectedRoom!.id,
                                userId: member.user?.id || member.userId,
                                role: 'contributor'
                              })}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Make Contributor
                            </DropdownMenuItem>
                          )}
                          
                          {member.role !== 'manager' && member.role !== 'creator' && (
                            <DropdownMenuItem 
                              onClick={() => updateMemberRoleMutation.mutate({
                                roomId: selectedRoom!.id,
                                userId: member.user?.id || member.userId,
                                role: 'manager'
                              })}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Manager
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          
                          {/* Suspend/Unsuspend */}
                          {member.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => suspendMemberMutation.mutate({
                                roomId: selectedRoom!.id,
                                userId: member.user?.id || member.userId
                              })}
                              className="text-yellow-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend Member
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => updateMemberRoleMutation.mutate({
                                roomId: selectedRoom!.id,
                                userId: member.user?.id || member.userId,
                                role: 'viewer' // Reactivate suspended users as viewers
                              })}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivate Member
                            </DropdownMenuItem>
                          )}
                          
                          {/* Remove Member */}
                          <DropdownMenuItem 
                            onClick={() => removeMemberMutation.mutate({
                              roomId: selectedRoom!.id,
                              userId: member.user?.id || member.userId
                            })}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              
              {(roomMembers as any[]).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No members found</p>
                </div>
              )}
            </div>

            {/* Contributor Requests Section */}
            {contributorRequests.filter((request: any) => request.status === 'pending').length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Pending Contributor Requests ({contributorRequests.filter((request: any) => request.status === 'pending').length})
                </h4>
                <div className="space-y-2">
                  {contributorRequests
                    .filter((request: any) => request.status === 'pending')
                    .map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {request.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {request.user?.firstName && request.user?.lastName 
                                ? `${request.user.firstName} ${request.user.lastName}`
                                : request.user?.username || 'Unknown User'
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Request Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveContributorMutation.mutate({
                              roomId: selectedRoom!.id,
                              requestId: request.id
                            })}
                            disabled={approveContributorMutation.isPending}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            title="Approve Request"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectContributorMutation.mutate({
                              roomId: selectedRoom!.id,
                              requestId: request.id
                            })}
                            disabled={rejectContributorMutation.isPending}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            title="Reject Request"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Member Stats */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-orange-600">
                    {(roomMembers as any[]).filter((m: any) => m.status === 'active').length}
                  </p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {(roomMembers as any[]).filter((m: any) => m.role === 'contributor').length}
                  </p>
                  <p className="text-xs text-gray-500">Contributors</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">
                    {(roomMembers as any[]).filter((m: any) => m.role === 'manager').length}
                  </p>
                  <p className="text-xs text-gray-500">Managers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-600">
                    {(roomMembers as any[]).filter((m: any) => m.role === 'viewer').length}
                  </p>
                  <p className="text-xs text-gray-500">Viewers</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
