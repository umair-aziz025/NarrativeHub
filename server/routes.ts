import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createStorage, storage as storageInstance } from "./storage";
import { setupAuth, authenticateToken, optionalAuth, requireAdmin, requireModerator } from "./auth";
import { insertUserSchema, insertRoomSchema, insertStorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";

// Initialize storage after dotenv is loaded
let storage = storageInstance;

interface WebSocketClient extends WebSocket {
  userId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize storage after environment variables are loaded
  storage = createStorage();
  
  // Setup authentication
  setupAuth(app);
  
  // OpenAI client setup
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  console.log('OpenAI API Key status:', apiKey && apiKey.length > 0 ? `Present (${apiKey.length} chars)` : 'Missing or empty');
  let openai: OpenAI | null = null;
  
  if (apiKey && apiKey.length > 0) {
    try {
      openai = new OpenAI({ 
        apiKey: apiKey 
      });
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  } else {
    console.log('OpenAI client not initialized - API key missing or empty');
  }
  
  // Multer setup for file uploads
  const upload = multer({ storage: multer.memoryStorage() });
  
  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocketClient>();
  const roomClients = new Map<string, Set<WebSocketClient>>();

  wss.on('connection', (ws: WebSocketClient) => {
    clients.add(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join-room':
            if (ws.roomId && roomClients.has(ws.roomId)) {
              roomClients.get(ws.roomId)!.delete(ws);
            }
            
            ws.roomId = data.roomId;
            ws.userId = data.userId;
            
            if (!roomClients.has(data.roomId)) {
              roomClients.set(data.roomId, new Set());
            }
            roomClients.get(data.roomId)!.add(ws);
            
            // Update room member count
            const roomSize = roomClients.get(data.roomId)!.size;
            await storage.updateRoomMemberCount(data.roomId, 0); // Set to actual count
            break;
            
          case 'story-added':
            // Broadcast new story to room members
            if (ws.roomId && roomClients.has(ws.roomId)) {
              const roomMembers = roomClients.get(ws.roomId)!;
              roomMembers.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'new-story',
                    story: data.story,
                    chainId: data.chainId
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      if (ws.roomId && roomClients.has(ws.roomId)) {
        roomClients.get(ws.roomId)!.delete(ws);
        if (roomClients.get(ws.roomId)!.size === 0) {
          roomClients.delete(ws.roomId);
        }
      }
    });
  });

  // Auth routes
  app.get('/api/auth/user', authenticateToken as any, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin user actions
  app.post('/api/admin/users/:id/approve', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      console.log('Trying to approve user with ID:', req.params.id);
      const user = await storage.getUser(req.params.id);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found in storage');
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'approved'
      });
      console.log('User approved successfully:', updatedUser);
      res.json({ message: 'User approved successfully', user: updatedUser });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/admin/users/:id/reject', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      console.log('Trying to reject user with ID:', req.params.id);
      const user = await storage.getUser(req.params.id);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found in storage');
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'rejected'
      });
      console.log('User rejected successfully:', updatedUser);
      res.json({ message: 'User rejected successfully', user: updatedUser });
    } catch (error) {
      console.error('Error rejecting user:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/admin/users/:id/suspend', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'suspended'
      });
      res.json({ message: 'User suspended successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/admin/users/:id/delete', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Actually delete the user
      await storage.deleteUser(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Admin user activities endpoint
  app.get('/api/admin/users/:id/activities', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      // For now, return mock activities - this would be connected to actual activity logging
      const activities = [
        {
          id: '1',
          userId: req.params.id,
          type: 'login',
          description: 'User logged in',
          timestamp: new Date().toISOString(),
          metadata: { ip: '192.168.1.1' }
        },
        {
          id: '2',
          userId: req.params.id,
          type: 'story_submit',
          description: 'Submitted a story contribution',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          metadata: { storyId: 'story-123' }
        }
      ];
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateToken as any, requireAdmin as any, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['community', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('Updating user role from', user.role, 'to', role);
      
      // Update user role
      const updatedUser = await storage.upsertUser({ 
        ...user,
        role 
      });
      
      console.log('Role updated successfully:', updatedUser.role);
      res.json({ message: 'Role updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Moderator endpoints - can approve, reject, suspend but not delete or change roles
  app.get('/api/moderator/users', authenticateToken as any, requireModerator as any, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users for moderator:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/moderator/users/:id/approve', authenticateToken as any, requireModerator as any, async (req, res) => {
    try {
      console.log('Moderator trying to approve user with ID:', req.params.id);
      const user = await storage.getUser(req.params.id);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found in storage');
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'approved'
      });
      console.log('User approved by moderator successfully:', updatedUser);
      res.json({ message: 'User approved successfully', user: updatedUser });
    } catch (error) {
      console.error('Error approving user by moderator:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/moderator/users/:id/reject', authenticateToken as any, requireModerator as any, async (req, res) => {
    try {
      console.log('Moderator trying to reject user with ID:', req.params.id);
      const user = await storage.getUser(req.params.id);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found in storage');
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'rejected'
      });
      console.log('User rejected by moderator successfully:', updatedUser);
      res.json({ message: 'User rejected successfully', user: updatedUser });
    } catch (error) {
      console.error('Error rejecting user by moderator:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/moderator/users/:id/suspend', authenticateToken as any, requireModerator as any, async (req, res) => {
    try {
      console.log('Moderator trying to suspend user with ID:', req.params.id);
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.upsertUser({ 
        ...user,
        status: 'suspended'
      });
      console.log('User suspended by moderator successfully:', updatedUser);
      res.json({ message: 'User suspended successfully', user: updatedUser });
    } catch (error) {
      console.error('Error suspending user by moderator:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/moderator/users/:id/activities', authenticateToken as any, requireModerator as any, async (req, res) => {
    try {
      // For now, return mock activities - this would be connected to actual activity logging
      const activities = [
        {
          id: '1',
          type: 'story_contribution',
          description: 'Added a story to chain #123',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: '2', 
          type: 'heart_received',
          description: 'Received a heart on story "The Beginning"',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        },
        {
          id: '3',
          type: 'room_created',
          description: 'Created room "Mystery Writers"',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        }
      ];
      res.json(activities);
    } catch (error) {
      console.error('Error fetching user activities for moderator:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Users
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data', error });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Rooms
  app.post('/api/rooms', authenticateToken as any, async (req: any, res) => {
    try {
      console.log('Creating room - Request body:', JSON.stringify(req.body, null, 2));
      console.log('Creating room - User ID:', req.user?.id);
      
      const roomData = insertRoomSchema.parse({
        ...req.body,
        creatorId: req.user?.id || "",
      });
      
      console.log('Creating room - Parsed data:', JSON.stringify(roomData, null, 2));
      
      const room = await storage.createRoom(roomData);
      console.log('Creating room - Success:', JSON.stringify(room, null, 2));
      res.json(room);
    } catch (error) {
      console.error('Creating room - Error:', error);
      res.status(400).json({ message: 'Invalid room data', error });
    }
  });

  app.get('/api/rooms/public', async (req, res) => {
    try {
      console.log('Route: Getting public rooms...');
      const rooms = await storage.getPublicRooms();
      console.log('Route: Successfully got', rooms.length, 'rooms');
      res.json(rooms);
    } catch (error) {
      console.error('Route: Error getting public rooms:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: { 
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error)
        } 
      });
    }
  });

  app.get('/api/rooms/code/:code', async (req, res) => {
    try {
      const room = await storage.getRoomByCode(req.params.code);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.put('/api/rooms/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const roomId = req.params.id;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is the room creator
      if (room.creatorId !== req.user?.id) {
        return res.status(403).json({ message: 'Not authorized to edit this room' });
      }
      
      const roomData = insertRoomSchema.parse({
        ...req.body,
        creatorId: req.user.id,
      });
      
      const updatedRoom = await storage.updateRoom(roomId, roomData);
      res.json(updatedRoom);
    } catch (error) {
      res.status(400).json({ message: 'Invalid room data', error });
    }
  });

  app.delete('/api/rooms/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const roomId = req.params.id;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is the room creator or global admin
      const isCreator = room.creatorId === req.user?.id;
      const isGlobalAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
      
      if (!isCreator && !isGlobalAdmin) {
        return res.status(403).json({ message: 'Not authorized to delete this room' });
      }
      
      await storage.deleteRoom(roomId);
      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/rooms/join', authenticateToken as any, async (req: any, res) => {
    try {
      console.log('Join room request:', { body: req.body, user: req.user });
      const { code } = req.body;
      
      if (!code || code.length !== 6) {
        console.log('Invalid room code:', code);
        return res.status(400).json({ message: 'Invalid room code' });
      }
      
      console.log('Looking for room with code:', code);
      const room = await storage.getRoomByCode(code);
      console.log('Found room:', room);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is already a member
      console.log('Checking if user is already a member:', { roomId: room.id, userId: req.user?.id });
      const existingMember = await storage.getRoomMember(room.id, req.user?.id);
      console.log('Existing member:', existingMember);
      if (existingMember) {
        return res.status(400).json({ message: 'You are already a member of this room' });
      }
      
      // Join the room
      console.log('Joining room:', { roomId: room.id, userId: req.user?.id });
      const member = await storage.joinRoom(room.id, req.user?.id);
      console.log('Successfully joined room, member:', member);
      res.json({ message: 'Successfully joined room', room, member });
    } catch (error) {
      console.error('Join room error:', error);
      res.status(500).json({ message: 'Failed to join room', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Leave room endpoint
  app.post('/api/rooms/:id/leave', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if user is a member
      const member = await storage.getRoomMember(id, req.user?.id);
      if (!member) {
        return res.status(400).json({ message: 'You are not a member of this room' });
      }
      
      // Don't allow room creator to leave
      const room = await storage.getRoom(id);
      if (room?.creatorId === req.user?.id) {
        return res.status(400).json({ message: 'Room creator cannot leave the room. Delete the room instead.' });
      }
      
      await storage.leaveRoom(id, req.user?.id);
      res.json({ message: 'Successfully left room' });
    } catch (error) {
      console.error('Leave room error:', error);
      res.status(500).json({ message: 'Failed to leave room', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get user's room memberships
  app.get('/api/rooms/memberships', authenticateToken as any, async (req: any, res) => {
    try {
      const memberships = await storage.getUserRoomMemberships(req.user?.id);
      res.json(memberships);
    } catch (error) {
      console.error('Get memberships error:', error);
      res.status(500).json({ message: 'Failed to get memberships', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get single room
  app.get('/api/rooms/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is globally suspended
      if (req.user?.status === 'suspended') {
        return res.status(403).json({ message: 'Your account is suspended' });
      }
      
      // Check if user has access to this room
      const member = await storage.getRoomMember(id, req.user?.id);
      const isCreator = room.creatorId === req.user?.id;
      const isGlobalAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
      
      // Check if user is suspended from this room
      if (member && member.role === 'suspended') {
        return res.status(403).json({ message: 'You are suspended from this room' });
      }
      
      if (room.isPrivate && !member && !isCreator && !isGlobalAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ message: 'Failed to get room', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get room membership for current user
  app.get('/api/rooms/:id/membership', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const member = await storage.getRoomMember(id, req.user?.id);
      
      // If user has explicit membership, return it
      if (member) {
        return res.json(member);
      }
      
      // Check if user is global admin or moderator
      if (req.user?.role === 'admin' || req.user?.role === 'moderator') {
        // Global admins and moderators have automatic access with admin-level permissions
        const virtualMembership = {
          id: `virtual-${req.user.id}`,
          roomId: id,
          userId: req.user.id,
          role: 'admin', // Give them admin role in the room
          status: 'active',
          permissions: {},
          joinedAt: new Date(),
          lastActive: new Date(),
        };
        return res.json(virtualMembership);
      }
      
      res.status(404).json({ message: 'Not a member of this room' });
    } catch (error) {
      console.error('Get room membership error:', error);
      res.status(500).json({ message: 'Failed to get membership', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get room stories
  app.get('/api/rooms/:id/stories', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if user has access to this room
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is globally suspended
      if (req.user?.status === 'suspended') {
        return res.status(403).json({ message: 'Your account is suspended' });
      }
      
      const member = await storage.getRoomMember(id, req.user?.id);
      const isCreator = room.creatorId === req.user?.id;
      const isGlobalAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
      
      // Check if user is suspended from this room
      if (member && member.role === 'suspended') {
        return res.status(403).json({ message: 'You are suspended from this room' });
      }
      
      if (room.isPrivate && !member && !isCreator && !isGlobalAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const stories = await storage.getStoriesByRoomWithHeartState(id, req.user?.id);
      res.json(stories);
    } catch (error) {
      console.error('Get room stories error:', error);
      res.status(500).json({ message: 'Failed to get stories', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create story in room
  app.post('/api/rooms/:id/stories', authenticateToken as any, async (req: any, res) => {
    try {
      const { id: roomId } = req.params;
      const { title, description, content, chainId } = req.body;
      
      // Check if user has access to this room
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      const member = await storage.getRoomMember(roomId, req.user?.id);
      const isCreator = room.creatorId === req.user?.id;
      const isGlobalAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
      
      if (!member && !isCreator && !isGlobalAdmin) {
        return res.status(403).json({ message: 'You must be a member to contribute stories' });
      }
      
      // Get or create chain ID
      let storyChainId = chainId;
      if (!storyChainId) {
        storyChainId = await storage.getNextChainId();
      }
      
      const story = await storage.createStory({
        title: title || '',
        description: description || '',
        content,
        chainId: storyChainId,
        roomId,
        authorId: req.user.id,
        authorName: req.user.username || req.user.nickname || 'Anonymous',
      });
      
      res.json(story);
    } catch (error) {
      console.error('Create room story error:', error);
      res.status(500).json({ message: 'Failed to create story', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Stories
  app.post('/api/stories', authenticateToken as any, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const storyData = insertStorySchema.parse({
        ...req.body,
        authorId: (req.user as any).id,
        authorName: (req.user as any).username || (req.user as any).email || "Anonymous",
      });
      
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(400).json({ message: 'Invalid story data', error });
    }
  });

  app.get('/api/stories/chains', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const chains = await storage.getLatestStoryChains(limit);
      res.json(chains);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/stories/chain/:chainId', async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const stories = await storage.getStoriesByChain(chainId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/stories/:id/heart', authenticateToken as any, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const isHearted = await storage.toggleHeart(req.params.id, userId);
      res.json({ hearted: isHearted });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/stories/next-chain-id', async (req, res) => {
    try {
      const chainId = await storage.getNextChainId();
      res.json({ chainId });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Themes
  app.get('/api/themes/daily', async (req, res) => {
    try {
      const theme = await storage.getDailyTheme();
      res.json(theme);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/themes', async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Edit story
  app.put('/api/stories/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content, title, description } = req.body;
      
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      
      // Check if user is the author or room creator
      const isAuthor = story.authorId === req.user?.id;
      const isRoomCreator = story.roomId && (await storage.getRoom(story.roomId))?.creatorId === req.user?.id;
      
      if (!isAuthor && !isRoomCreator) {
        return res.status(403).json({ message: 'Not authorized to edit this story' });
      }
      
      const updatedStory = await storage.updateStory(id, { content, title, description });
      res.json(updatedStory);
    } catch (error) {
      console.error('Edit story error:', error);
      res.status(500).json({ message: 'Failed to edit story', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete story
  app.delete('/api/stories/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      
      // Check if user is the author or room creator
      const isAuthor = story.authorId === req.user?.id;
      const isRoomCreator = story.roomId && (await storage.getRoom(story.roomId))?.creatorId === req.user?.id;
      
      if (!isAuthor && !isRoomCreator) {
        return res.status(403).json({ message: 'Not authorized to delete this story' });
      }
      
      await storage.deleteStory(id);
      res.json({ message: 'Story deleted successfully' });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({ message: 'Failed to delete story', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // ========== COMMENT ENDPOINTS ==========
  
  // Get comments for a story
  app.get('/api/stories/:storyId/comments', optionalAuth as any, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const userId = req.user?.id; // Get current user ID if authenticated
      const comments = await storage.getCommentsByStory(storyId, userId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Failed to get comments', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create a comment
  app.post('/api/stories/:storyId/comments', authenticateToken as any, async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const { content, parentId } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
      }
      
      if (content.length > 250) {
        return res.status(400).json({ message: 'Comment too long (max 250 characters)' });
      }
      
      // Check if story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      
      const comment = await storage.createComment({
        storyId,
        userId: req.user.id,
        content: content.trim(),
        parentId: parentId || null,
      });
      
      // Update story comment count
      await storage.updateStoryCommentCount(storyId);
      
      res.json(comment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: 'Failed to create comment', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update a comment
  app.put('/api/comments/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
      }
      
      if (content.length > 250) {
        return res.status(400).json({ message: 'Comment too long (max 250 characters)' });
      }
      
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check if user is the author
      if (comment.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Not authorized to edit this comment' });
      }
      
      const updatedComment = await storage.updateComment(id, { content: content.trim(), isEdited: true });
      res.json(updatedComment);
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ message: 'Failed to update comment', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete a comment
  app.delete('/api/comments/:id', authenticateToken as any, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check if user is the author or story author or room creator
      const story = await storage.getStory(comment.storyId);
      const isCommentAuthor = comment.userId === req.user?.id;
      const isStoryAuthor = story?.authorId === req.user?.id;
      const isRoomCreator = story?.roomId && (await storage.getRoom(story.roomId))?.creatorId === req.user?.id;
      
      if (!isCommentAuthor && !isStoryAuthor && !isRoomCreator) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }
      
      await storage.deleteComment(id);
      
      // Update story comment count
      await storage.updateStoryCommentCount(comment.storyId);
      
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ message: 'Failed to delete comment', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Heart/unheart a comment
  app.post('/api/comments/:id/heart', authenticateToken as any, async (req: any, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;
      
      const result = await storage.toggleCommentHeart(commentId, userId);
      res.json(result);
    } catch (error) {
      console.error('Toggle comment heart error:', error);
      res.status(500).json({ message: 'Failed to toggle comment heart', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // ========== END COMMENT ENDPOINTS ==========

  // Block user from room
  app.post('/api/rooms/:roomId/block/:userId', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      const { reason } = req.body;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator
      if (room.creatorId !== req.user?.id) {
        return res.status(403).json({ message: 'Only room creators can block users' });
      }
      
      // Cannot block yourself
      if (userId === req.user?.id) {
        return res.status(400).json({ message: 'Cannot block yourself' });
      }
      
      const block = await storage.blockUserFromRoom(roomId, userId, req.user.id, reason);
      
      // Remove user from room if they are a member
      await storage.removeRoomMember(roomId, userId);
      
      res.json({ message: 'User blocked successfully', block });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ message: 'Failed to block user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Unblock user from room
  app.delete('/api/rooms/:roomId/block/:userId', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator
      if (room.creatorId !== req.user?.id) {
        return res.status(403).json({ message: 'Only room creators can unblock users' });
      }
      
      await storage.unblockUserFromRoom(roomId, userId);
      res.json({ message: 'User unblocked successfully' });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ message: 'Failed to unblock user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Suspend user from room
  app.post('/api/rooms/:roomId/suspend/:userId', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      const { reason, duration } = req.body;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator
      if (room.creatorId !== req.user?.id) {
        return res.status(403).json({ message: 'Only room creators can suspend users' });
      }
      
      // Cannot suspend yourself
      if (userId === req.user?.id) {
        return res.status(400).json({ message: 'Cannot suspend yourself' });
      }
      
      const suspension = await storage.suspendUserFromRoom(roomId, userId, req.user.id, reason, duration);
      res.json({ message: 'User suspended successfully', suspension });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ message: 'Failed to suspend user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Unsuspend user from room
  app.delete('/api/rooms/:roomId/suspend/:userId', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator
      if (room.creatorId !== req.user?.id) {
        return res.status(403).json({ message: 'Only room creators can unsuspend users' });
      }
      
      await storage.unsuspendUserFromRoom(roomId, userId);
      res.json({ message: 'User unsuspended successfully' });
    } catch (error) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({ message: 'Failed to unsuspend user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Debug endpoint to recalculate member counts
  app.post('/api/debug/recalculate-member-counts', requireAdmin as any, async (req: any, res) => {
    try {
      // For now, just return a simple message - we'll implement this properly if needed
      res.json({ message: 'Member count recalculation not implemented yet' });
    } catch (error) {
      res.status(500).json({ message: 'Recalculation error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Debug endpoint to check member count consistency
  app.get('/api/debug/room/:roomId/members', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      
      const room = await storage.getRoom(roomId);
      const members = await storage.getRoomMembers(roomId);
      const activeMembers = members.filter(m => m.status === 'active');
      
      res.json({
        roomId,
        roomName: room?.name,
        storedMemberCount: room?.memberCount,
        actualMemberCount: members.length,
        activeMemberCount: activeMembers.length,
        members: members.map(m => ({
          username: m.user?.username,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Debug error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get room members with moderation info
  app.get('/api/rooms/:roomId/members', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user has access to this room
      const member = await storage.getRoomMember(roomId, req.user?.id);
      const isCreator = room.creatorId === req.user?.id;
      const isGlobalAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
      
      if (room.isPrivate && !member && !isCreator && !isGlobalAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const members = await storage.getRoomMembers(roomId);
      res.json(members);
    } catch (error) {
      console.error('Get room members error:', error);
      res.status(500).json({ message: 'Failed to get room members', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update room member role
  app.put('/api/rooms/:roomId/members/:userId/role', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      const { role } = req.body;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator, global admin/moderator, or room moderator
      const requesterMember = await storage.getRoomMember(roomId, req.user?.id);
      const isGlobalModerator = req.user?.role === 'admin' || req.user?.role === 'moderator';
      const isRoomCreator = room.creatorId === req.user?.id;
      const isRoomModerator = requesterMember?.role === 'moderator';
      
      if (!isRoomCreator && !isGlobalModerator && !isRoomModerator) {
        return res.status(403).json({ message: 'Only room creators, global moderators, and room moderators can change member roles' });
      }
      
      // Validate role
      const validRoles = ['viewer', 'contributor', 'moderator', 'suspended'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      await storage.updateRoomMemberRole(roomId, userId, role);
      res.json({ message: 'Member role updated successfully' });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({ message: 'Failed to update member role', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Remove member from room
  app.delete('/api/rooms/:roomId/members/:userId', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator, global admin/moderator, or room moderator
      const requesterMember = await storage.getRoomMember(roomId, req.user?.id);
      const isGlobalModerator = req.user?.role === 'admin' || req.user?.role === 'moderator';
      const isRoomCreator = room.creatorId === req.user?.id;
      const isRoomModerator = requesterMember?.role === 'moderator';
      
      if (!isRoomCreator && !isGlobalModerator && !isRoomModerator) {
        return res.status(403).json({ message: 'Only room creators, global moderators, and room moderators can remove members' });
      }
      
      // Cannot remove the room creator
      if (room.creatorId === userId) {
        return res.status(400).json({ message: 'Cannot remove room creator' });
      }
      
      await storage.removeRoomMember(roomId, userId);
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ message: 'Failed to remove member', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Suspend member from room (update existing to use new path)
  app.post('/api/rooms/:roomId/members/:userId/suspend', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, userId } = req.params;
      const { reason, duration } = req.body;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Check if user is room creator, global admin/moderator, or room moderator
      const requesterMember = await storage.getRoomMember(roomId, req.user?.id);
      const isGlobalModerator = req.user?.role === 'admin' || req.user?.role === 'moderator';
      const isRoomCreator = room.creatorId === req.user?.id;
      const isRoomModerator = requesterMember?.role === 'moderator';
      
      if (!isRoomCreator && !isGlobalModerator && !isRoomModerator) {
        return res.status(403).json({ message: 'Only room creators, global moderators, and room moderators can suspend members' });
      }
      
      await storage.suspendRoomMember(roomId, userId, reason, duration);
      res.json({ message: 'Member suspended successfully' });
    } catch (error) {
      console.error('Suspend member error:', error);
      res.status(500).json({ message: 'Failed to suspend member', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Community
  app.get('/api/community/stats', async (req, res) => {
    try {
      const stats = await storage.getCommunityStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/community/cookies-picks', async (req, res) => {
    try {
      const picks = await storage.getCookiesPicks();
      res.json(picks);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Get user's stories
  app.get('/api/users/:id/stories', async (req, res) => {
    try {
      const { id } = req.params;
      const stories = await storage.getStoriesByUser(id);
      res.json(stories);
    } catch (error) {
      console.error('Get user stories error:', error);
      res.status(500).json({ message: 'Failed to get user stories', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // AI Routes
  app.post('/api/ai/transcribe', upload.single('audio'), async (req: any, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: 'AI features unavailable - OpenAI API key not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      const transcription = await openai.audio.transcriptions.create({
        file: new File([req.file.buffer], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
      });

      res.json({ text: transcription.text });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ message: 'Transcription failed', error });
    }
  });

  app.post('/api/ai/continue-story', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: 'AI features unavailable - OpenAI API key not configured' });
      }

      const { storyContext } = req.body;
      
      if (!storyContext || typeof storyContext !== 'string') {
        return res.status(400).json({ message: 'Story context is required' });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative writing assistant for a collaborative storytelling platform inspired by Nemrah Ahmed's work. Generate a natural, engaging continuation for the story that follows the established tone and style. Keep continuations between 50-150 words, maintaining the narrative flow. Focus on emotional depth and character development."
          },
          {
            role: "user",
            content: `Continue this story naturally: "${storyContext}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const continuation = completion.choices[0].message.content?.trim() || '';
      res.json({ continuation });
    } catch (error) {
      console.error('Story continuation error:', error);
      res.status(500).json({ message: 'Story continuation failed', error });
    }
  });

  // Export Routes
  app.post('/api/export/pdf', async (req, res) => {
    try {
      const { chainId, title } = req.body;
      
      if (!chainId) {
        return res.status(400).json({ message: 'Chain ID is required' });
      }

      const stories = await storage.getStoriesByChain(parseInt(chainId));
      const fullStory = stories.map(story => story.content).join(' ');
      
      // For now, return a simple text response
      // In a real implementation, you'd use a PDF generation library like puppeteer
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'story'}.pdf"`);
      res.send(`PDF Export\n\nTitle: ${title || 'Untitled Story'}\n\nContent:\n${fullStory}`);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: 'PDF export failed', error });
    }
  });

  app.post('/api/export/image', async (req, res) => {
    try {
      const { chainId, title } = req.body;
      
      if (!chainId) {
        return res.status(400).json({ message: 'Chain ID is required' });
      }

      const stories = await storage.getStoriesByChain(parseInt(chainId));
      const fullStory = stories.map(story => story.content).join(' ');
      
      // For now, return a simple text response
      // In a real implementation, you'd use a canvas/image generation library
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'story'}.png"`);
      res.send(`Image Export\n\nTitle: ${title || 'Untitled Story'}\n\nContent:\n${fullStory}`);
    } catch (error) {
      console.error('Image export error:', error);
      res.status(500).json({ message: 'Image export failed', error });
    }
  });

  // Contributor request endpoints
  app.post('/api/rooms/:roomId/request-contributor', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const { storyId, message } = req.body;
      
      // Check if user is a viewer in this room
      const member = await storage.getRoomMember(roomId, req.user?.id);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member of this room' });
      }
      
      if (member.role !== 'viewer') {
        return res.status(400).json({ message: 'Only viewers can request contributor access' });
      }
      
      // Check if there's already a pending request
      const existingRequest = await storage.getContributorRequest(roomId, req.user?.id, storyId);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending request for this story' });
      }
      
      const request = await storage.createContributorRequest(roomId, req.user?.id, storyId, message);
      res.json(request);
    } catch (error) {
      console.error('Create contributor request error:', error);
      res.status(500).json({ message: 'Failed to create request' });
    }
  });

  app.get('/api/rooms/:roomId/contributor-requests', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      
      // Check if user has permission to view requests (creator, manager, admin, moderator)
      const member = await storage.getRoomMember(roomId, req.user?.id);
      const hasPermission = member && ['creator', 'manager'].includes(member.role) || 
                           req.user?.role && ['admin', 'moderator'].includes(req.user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to view contributor requests' });
      }
      
      const requests = await storage.getContributorRequests(roomId);
      res.json(requests);
    } catch (error) {
      console.error('Get contributor requests error:', error);
      res.status(500).json({ message: 'Failed to get requests' });
    }
  });

  app.put('/api/contributor-requests/:requestId/approve', authenticateToken as any, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      
      const request = await storage.getContributorRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check permissions
      const member = await storage.getRoomMember(request.roomId, req.user?.id);
      const hasPermission = member && ['creator', 'manager'].includes(member.role) || 
                           req.user?.role && ['admin', 'moderator'].includes(req.user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to approve requests' });
      }
      
      // Approve request and update user role to contributor
      await storage.approveContributorRequest(requestId, req.user?.id);
      await storage.updateRoomMemberRole(request.roomId, request.userId, 'contributor');
      
      res.json({ message: 'Request approved successfully' });
    } catch (error) {
      console.error('Approve contributor request error:', error);
      res.status(500).json({ message: 'Failed to approve request' });
    }
  });

  app.put('/api/contributor-requests/:requestId/reject', authenticateToken as any, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      
      const request = await storage.getContributorRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check permissions
      const member = await storage.getRoomMember(request.roomId, req.user?.id);
      const hasPermission = member && ['creator', 'manager'].includes(member.role) || 
                           req.user?.role && ['admin', 'moderator'].includes(req.user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to reject requests' });
      }
      
      await storage.rejectContributorRequest(requestId, req.user?.id);
      res.json({ message: 'Request rejected successfully' });
    } catch (error) {
      console.error('Reject contributor request error:', error);
      res.status(500).json({ message: 'Failed to reject request' });
    }
  });

  // Additional contributor request endpoints with correct paths
  app.post('/api/rooms/:roomId/contributor-requests', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const { message } = req.body;
      
      // Check if user is a viewer in this room
      const member = await storage.getRoomMember(roomId, req.user?.id);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member of this room' });
      }
      
      if (member.role !== 'viewer') {
        return res.status(400).json({ message: 'Only viewers can request contributor access' });
      }
      
      // Check if there's already a pending request
      const existingRequest = await storage.getContributorRequest(roomId, req.user?.id);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending request' });
      }
      
      // If there's a rejected or approved request, delete it first to allow a new request
      if (existingRequest && existingRequest.status !== 'pending') {
        // Delete the old request before creating a new one
        await storage.deleteContributorRequest(existingRequest.id);
      }
      
      const request = await storage.createContributorRequest(roomId, req.user?.id, undefined, message);
      res.json(request);
    } catch (error) {
      console.error('Create contributor request error:', error);
      res.status(500).json({ message: 'Failed to create request' });
    }
  });

  app.get('/api/rooms/:roomId/contributor-requests/my-request', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      
      const request = await storage.getContributorRequest(roomId, req.user?.id);
      if (!request) {
        return res.status(404).json({ message: 'No request found' });
      }
      
      res.json(request);
    } catch (error) {
      console.error('Get user contributor request error:', error);
      res.status(500).json({ message: 'Failed to get request' });
    }
  });

  app.patch('/api/rooms/:roomId/contributor-requests/:requestId/approve', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, requestId } = req.params;
      
      const request = await storage.getContributorRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check if user has permission to approve requests
      const member = await storage.getRoomMember(roomId, req.user?.id);
      const hasPermission = member && ['creator', 'manager'].includes(member.role) || 
                           req.user?.role && ['admin', 'moderator'].includes(req.user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to approve requests' });
      }
      
      await storage.approveContributorRequest(requestId, req.user?.id);
      res.json({ message: 'Request approved successfully' });
    } catch (error) {
      console.error('Approve contributor request error:', error);
      res.status(500).json({ message: 'Failed to approve request' });
    }
  });

  app.patch('/api/rooms/:roomId/contributor-requests/:requestId/reject', authenticateToken as any, async (req: any, res) => {
    try {
      const { roomId, requestId } = req.params;
      
      const request = await storage.getContributorRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check if user has permission to reject requests
      const member = await storage.getRoomMember(roomId, req.user?.id);
      const hasPermission = member && ['creator', 'manager'].includes(member.role) || 
                           req.user?.role && ['admin', 'moderator'].includes(req.user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to reject requests' });
      }
      
      await storage.rejectContributorRequest(requestId, req.user?.id);
      res.json({ message: 'Request rejected successfully' });
    } catch (error) {
      console.error('Reject contributor request error:', error);
      res.status(500).json({ message: 'Failed to reject request' });
    }
  });

  return httpServer;
}
