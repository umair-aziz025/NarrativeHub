import { type User, type InsertUser, type UpsertUser, type Room, type InsertRoom, type Story, type InsertStory, type StoryChain, type CommunityStats, type Theme, type CookiesPick, type RoomMember, type InsertRoomMember, type RoomInvite, type InsertRoomInvite, type RoomFollow, type RoomWithDetails, type RoomMemberWithUser, type UserBlock, type UserSuspension, type Comment, type InsertComment } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, rooms, stories, hearts, themes, cookiesPicks, roomMembers, userBlocks, userSuspensions, comments, commentHearts, contributorRequests, roomFollows } from '@shared/schema';
import { eq, desc, sql, and, isNull, inArray } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  updateUserStats(userId: string, contributions?: number, hearts?: number): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // Rooms
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: string): Promise<void>;
  getPublicRooms(): Promise<Room[]>;
  updateRoomMemberCount(roomId: string, count: number): Promise<void>;
  
  // Room Members
  getRoomMember(roomId: string, userId: string): Promise<RoomMember | undefined>;
  getRoomMembers(roomId: string): Promise<RoomMemberWithUser[]>;
  joinRoom(roomId: string, userId: string): Promise<RoomMember>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  removeRoomMember(roomId: string, userId: string): Promise<void>;
  getUserRoomMemberships(userId: string): Promise<RoomMember[]>;
  
  // Stories
  getStory(id: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story>;
  deleteStory(id: string): Promise<void>;
  getStoriesByChain(chainId: number): Promise<Story[]>;
  getStoriesByChainWithHeartState(chainId: number, userId: string): Promise<(Story & { isHearted: boolean })[]>;
  getStoriesByRoom(roomId: string): Promise<Story[]>;
  getStoriesByRoomWithHeartState(roomId: string, userId: string): Promise<(Story & { isHearted: boolean })[]>;
  getStoriesByUser(userId: string): Promise<Story[]>;
  getLatestStoryChains(limit?: number): Promise<StoryChain[]>;
  toggleHeart(storyId: string, userId: string): Promise<boolean>;
  isStoryHearted(storyId: string, userId: string): Promise<boolean>;
  getNextChainId(): Promise<number>;
  
  // Comments
  getComment(id: string): Promise<Comment | undefined>;
  getCommentsByStory(storyId: string, userId?: string): Promise<(Comment & { authorName: string; isHearted?: boolean })[]>;
  createComment(comment: InsertComment): Promise<Comment & { authorName: string }>;
  updateComment(id: string, updates: Partial<Comment>): Promise<Comment & { authorName: string }>;
  deleteComment(id: string): Promise<void>;
  updateStoryCommentCount(storyId: string): Promise<void>;
  toggleCommentHeart(commentId: string, userId: string): Promise<{ isHearted: boolean; hearts: number }>;
  
  // Room Moderation
  blockUserFromRoom(roomId: string, userId: string, blockedBy: string, reason?: string): Promise<any>;
  unblockUserFromRoom(roomId: string, userId: string): Promise<void>;
  suspendUserFromRoom(roomId: string, userId: string, suspendedBy: string, reason?: string, duration?: number): Promise<any>;
  unsuspendUserFromRoom(roomId: string, userId: string): Promise<void>;
  updateRoomMemberRole(roomId: string, userId: string, role: string): Promise<void>;
  removeRoomMember(roomId: string, userId: string): Promise<void>;
  suspendRoomMember(roomId: string, userId: string, reason?: string, duration?: number): Promise<void>;
  
  // Contributor Requests
  getContributorRequest(roomId: string, userId: string, storyId?: string): Promise<any>;
  createContributorRequest(roomId: string, userId: string, storyId?: string, message?: string): Promise<any>;
  deleteContributorRequest(requestId: string): Promise<void>;
  getContributorRequests(roomId: string): Promise<any[]>;
  getContributorRequestById(requestId: string): Promise<any>;
  approveContributorRequest(requestId: string, reviewedBy: string): Promise<void>;
  rejectContributorRequest(requestId: string, reviewedBy: string): Promise<void>;
  
  // Themes
  getDailyTheme(): Promise<Theme | undefined>;
  getAllThemes(): Promise<Theme[]>;
  
  // Community
  getCommunityStats(): Promise<CommunityStats>;
  getCookiesPicks(): Promise<CookiesPick[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, Room>;
  private stories: Map<string, Story>;
  private hearts: Map<string, Set<string>>; // storyId -> Set of userIds
  private themes: Map<string, Theme>;
  private cookiesPicks: Map<string, CookiesPick>;
  private roomMembersMap: Map<string, RoomMember>; // `${roomId}-${userId}` -> RoomMember
  private contributorRequests: Map<string, any>; // contributorRequest objects
  private chainCounter: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.stories = new Map();
    this.hearts = new Map();
    this.themes = new Map();
    this.cookiesPicks = new Map();
    this.roomMembersMap = new Map();
    this.contributorRequests = new Map();
    this.chainCounter = 1;
    
    this.initializeData();
  }

  private initializeData() {
    // Create sample themes
    const themes = [
      {
        id: randomUUID(),
        title: "Jannat Kay Pattay Vibes",
        description: "Stories about finding home in people, not places",
        prompt: "Someone somewhere is discovering that home isn't a place, but the people who make your heart feel at peace...",
        isDaily: true,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Nemrah Ahmed Inspired",
        description: "Mystery and family secrets",
        prompt: "Someone somewhere just discovered a hidden truth that changes everything they thought they knew...",
        isDaily: false,
        isActive: true,
        createdAt: new Date(),
      }
    ];
    
    themes.forEach(theme => this.themes.set(theme.id, theme));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username || null,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      nickname: insertUser.nickname || insertUser.username || null,
      password: insertUser.password || null,
      role: insertUser.role || 'community',
      status: insertUser.status || 'pending',
      contributionsCount: 0,
      heartsReceived: 0,
      experiencePoints: 0,
      level: 1,
      badges: [],
      preferences: {},
      // New XP columns
      hearts: 0,
      contributions: 0,
      experience: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(updatedUser.id, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(userData as InsertUser);
    }
  }

  async updateUserStats(userId: string, contributions = 0, hearts = 0): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.contributionsCount += contributions;
      user.heartsReceived += hearts;
      this.users.set(userId, user);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    // Also remove any hearts given by this user
    this.hearts.forEach((userSet, storyId) => {
      userSet.delete(id);
      if (userSet.size === 0) {
        this.hearts.delete(storyId);
      }
    });
  }

  // Rooms
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: Room = {
      ...insertRoom,
      id,
      code,
      status: "active",
      description: insertRoom.description || null,
      category: insertRoom.category || "general",
      maxMembers: insertRoom.maxMembers || 50,
      requiresApproval: insertRoom.requiresApproval || false,
      allowInvites: insertRoom.allowInvites !== false,
      allowComments: insertRoom.allowComments !== false,
      allowHearts: insertRoom.allowHearts !== false,
      tags: insertRoom.tags || [],
      rules: insertRoom.rules || null,
      totalStories: 0,
      totalHearts: 0,
      isPrivate: insertRoom.isPrivate || false,
      isThemed: insertRoom.isThemed || false,
      theme: insertRoom.theme || "",
      memberCount: 1,
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add creator as a member with "creator" role
    const membershipId = randomUUID();
    this.roomMembersMap.set(membershipId, {
      id: membershipId,
      roomId: id,
      userId: insertRoom.creatorId,
      role: 'creator',
      status: 'active',
      permissions: {},
      joinedAt: new Date(),
      lastActive: new Date(),
    });
    
    this.rooms.set(id, room);
    return room;
  }

  async getPublicRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate)
      .sort((a, b) => b.memberCount - a.memberCount);
  }

  async updateRoomMemberCount(roomId: string, count: number): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.memberCount = Math.max(0, room.memberCount + count);
      this.rooms.set(roomId, room);
    }
  }

  async updateRoom(id: string, roomData: Partial<InsertRoom>): Promise<Room> {
    const existingRoom = this.rooms.get(id);
    if (!existingRoom) {
      throw new Error('Room not found');
    }
    
    const updatedRoom = {
      ...existingRoom,
      ...roomData,
      updatedAt: new Date(),
    };
    
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id);
  }

  // Room Members
  async getRoomMember(roomId: string, userId: string): Promise<RoomMember | undefined> {
    const key = `${roomId}-${userId}`;
    return this.roomMembersMap.get(key);
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomMember> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const member: RoomMember = {
      id: randomUUID(),
      roomId,
      userId,
      role: "viewer", // Default role for new members
      status: "active",
      permissions: {},
      joinedAt: new Date(),
      lastActive: new Date(),
    };
    
    // Store in the roomMembersMap
    const key = `${roomId}-${userId}`;
    this.roomMembersMap.set(key, member);
    
    // Update room member count
    room.memberCount = (room.memberCount || 0) + 1;
    this.rooms.set(roomId, room);
    
    return member;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const key = `${roomId}-${userId}`;
    this.roomMembersMap.delete(key);
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.memberCount = Math.max(0, (room.memberCount || 0) - 1);
      this.rooms.set(roomId, room);
    }
  }

  async getUserRoomMemberships(userId: string): Promise<RoomMember[]> {
    return Array.from(this.roomMembersMap.values())
      .filter((member: RoomMember) => member.userId === userId);
  }

  // Stories
  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    
    // Calculate sequence number based on existing stories in the chain
    const existingStories = Array.from(this.stories.values()).filter(s => s.chainId === insertStory.chainId);
    const sequence = existingStories.length + 1;
    
    const story: Story = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      chainId: insertStory.chainId,
      roomId: insertStory.roomId || null,
      title: insertStory.title || null,
      description: insertStory.description || null,
      content: insertStory.content,
      authorId: insertStory.authorId,
      authorName: insertStory.authorName,
      sequence: sequence,
      hearts: 0,
      comments: 0,
    };
    this.stories.set(id, story);
    
    // Update user contributions
    await this.updateUserStats(story.authorId, 1, 0);
    
    return story;
  }

  async getStoriesByChain(chainId: number): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.chainId === chainId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async getStoriesByChainWithHeartState(chainId: number, userId: string): Promise<(Story & { isHearted: boolean })[]> {
    const stories = await this.getStoriesByChain(chainId);
    return stories.map(story => ({
      ...story,
      isHearted: this.hearts.get(story.id)?.has(userId) || false
    }));
  }

  async getStoriesByRoom(roomId: string): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.roomId === roomId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStoriesByRoomWithHeartState(roomId: string, userId: string): Promise<(Story & { isHearted: boolean })[]> {
    const stories = await this.getStoriesByRoom(roomId);
    return stories.map(story => ({
      ...story,
      isHearted: this.hearts.get(story.id)?.has(userId) || false
    }));
  }

  async getStoriesByUser(userId: string): Promise<Story[]> {
    return Array.from(this.stories.values())
      .filter(story => story.authorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLatestStoryChains(limit = 10): Promise<StoryChain[]> {
    const chainGroups = new Map<number, Story[]>();
    
    // Group stories by chainId
    Array.from(this.stories.values()).forEach(story => {
      if (!chainGroups.has(story.chainId)) {
        chainGroups.set(story.chainId, []);
      }
      chainGroups.get(story.chainId)!.push(story);
    });

    // Convert to StoryChain objects
    const chains: StoryChain[] = Array.from(chainGroups.entries()).map(([chainId, stories]) => {
      const sortedStories = stories.sort((a, b) => a.sequence - b.sequence);
      const totalHearts = stories.reduce((sum, story) => sum + story.hearts, 0);
      const totalComments = stories.reduce((sum, story) => sum + story.comments, 0);
      const contributorCount = new Set(stories.map(s => s.authorId)).size;
      
      return {
        chainId,
        roomId: stories[0]?.roomId,
        stories: sortedStories,
        totalHearts,
        totalComments,
        contributorCount,
        createdAt: sortedStories[0]?.createdAt || new Date(),
      };
    });

    // Sort by latest activity and return limited results
    return chains
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async toggleHeart(storyId: string, userId: string): Promise<boolean> {
    if (!this.hearts.has(storyId)) {
      this.hearts.set(storyId, new Set());
    }
    
    const storyHearts = this.hearts.get(storyId)!;
    const story = this.stories.get(storyId);
    
    if (!story) return false;
    
    if (storyHearts.has(userId)) {
      // Remove heart
      storyHearts.delete(userId);
      story.hearts = Math.max(0, story.hearts - 1);
      await this.updateUserStats(story.authorId, 0, -1);
      return false;
    } else {
      // Add heart
      storyHearts.add(userId);
      story.hearts += 1;
      await this.updateUserStats(story.authorId, 0, 1);
      return true;
    }
  }

  async isStoryHearted(storyId: string, userId: string): Promise<boolean> {
    if (!this.hearts.has(storyId)) {
      return false;
    }
    const storyHearts = this.hearts.get(storyId)!;
    return storyHearts.has(userId);
  }

  async getNextChainId(): Promise<number> {
    return this.chainCounter++;
  }

  // Themes
  async getDailyTheme(): Promise<Theme | undefined> {
    return Array.from(this.themes.values()).find(theme => theme.isDaily && theme.isActive);
  }

  async getAllThemes(): Promise<Theme[]> {
    return Array.from(this.themes.values()).filter(theme => theme.isActive);
  }

  // Community
  async getCommunityStats(): Promise<CommunityStats> {
    const totalStories = this.stories.size;
    const activeUsers = this.users.size;
    const totalHearts = Array.from(this.stories.values()).reduce((sum, story) => sum + story.hearts, 0);
    
    // Daily contributions (stories from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyContributions = Array.from(this.stories.values())
      .filter(story => story.createdAt >= today).length;

    return {
      totalStories,
      activeUsers,
      totalHearts,
      dailyContributions,
    };
  }

  async getCookiesPicks(): Promise<CookiesPick[]> {
    return Array.from(this.cookiesPicks.values())
      .filter(pick => pick.isFeatured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Additional methods for interface compliance
  async getRoomMembers(roomId: string): Promise<RoomMemberWithUser[]> {
    const members = Array.from(this.roomMembersMap.values())
      .filter((member: RoomMember) => member.roomId === roomId);
    
    return members.map((member: RoomMember) => ({
      ...member,
      user: this.users.get(member.userId)!
    }));
  }

  async removeRoomMember(roomId: string, userId: string): Promise<void> {
    const key = `${roomId}-${userId}`;
    this.roomMembersMap.delete(key);
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story> {
    const story = this.stories.get(id);
    if (!story) throw new Error('Story not found');
    
    const updatedStory = { ...story, ...updates, updatedAt: new Date() };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: string): Promise<void> {
    this.stories.delete(id);
  }

  async blockUserFromRoom(roomId: string, userId: string, blockedBy: string, reason?: string): Promise<UserBlock> {
    const block: UserBlock = {
      id: randomUUID(),
      roomId,
      userId,
      blockedBy,
      reason: reason || null,
      isActive: true,
      blockedAt: new Date()
    };
    return block;
  }

  async unblockUserFromRoom(roomId: string, userId: string): Promise<void> {
    // Mock implementation for memory storage
    console.log(`Unblocking user ${userId} from room ${roomId}`);
  }

  async suspendUserFromRoom(roomId: string, userId: string, suspendedBy: string, reason?: string, duration?: number): Promise<UserSuspension> {
    const suspension: UserSuspension = {
      id: randomUUID(),
      roomId,
      userId,
      suspendedBy,
      reason: reason || null,
      duration: duration || null,
      isActive: true,
      suspendedAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null
    };
    return suspension;
  }

  async unsuspendUserFromRoom(roomId: string, userId: string): Promise<void> {
    // Mock implementation for memory storage
    console.log(`Unsuspending user ${userId} from room ${roomId}`);
  }

  // Comment methods (stub implementations for MemStorage)
  async getComment(id: string): Promise<Comment | undefined> {
    throw new Error("Comments not supported in memory storage");
  }

  async getCommentsByStory(storyId: string, userId?: string): Promise<(Comment & { authorName: string; isHearted?: boolean })[]> {
    return [];
  }

  async createComment(comment: InsertComment): Promise<Comment & { authorName: string }> {
    throw new Error("Comments not supported in memory storage");
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment & { authorName: string }> {
    throw new Error("Comments not supported in memory storage");
  }

  async deleteComment(id: string): Promise<void> {
    throw new Error("Comments not supported in memory storage");
  }

  async updateStoryCommentCount(storyId: string): Promise<void> {
    // Stub implementation
  }

  async toggleCommentHeart(commentId: string, userId: string): Promise<{ isHearted: boolean; hearts: number }> {
    throw new Error("Comments not supported in memory storage");
  }

  async updateRoomMemberRole(roomId: string, userId: string, role: string): Promise<void> {
    // Stub implementation for memory storage
  }

  async suspendRoomMember(roomId: string, userId: string, reason?: string, duration?: number): Promise<void> {
    // Stub implementation for memory storage
  }

  // Contributor Requests
  async getContributorRequest(roomId: string, userId: string, storyId?: string): Promise<any> {
    const key = storyId ? `${roomId}-${userId}-${storyId}` : `${roomId}-${userId}`;
    return Array.from(this.contributorRequests.values())
      .find(req => req.roomId === roomId && req.userId === userId && 
                   (storyId ? req.storyId === storyId : !req.storyId));
  }

  async createContributorRequest(roomId: string, userId: string, storyId?: string, message?: string): Promise<any> {
    const id = randomUUID();
    const request = {
      id,
      roomId,
      userId,
      storyId: storyId || null,
      message: message || null,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    
    this.contributorRequests.set(id, request);
    return request;
  }

  async deleteContributorRequest(requestId: string): Promise<void> {
    this.contributorRequests.delete(requestId);
  }

  async getContributorRequests(roomId: string): Promise<any[]> {
    return Array.from(this.contributorRequests.values())
      .filter(req => req.roomId === roomId);
  }

  async getContributorRequestById(requestId: string): Promise<any> {
    return this.contributorRequests.get(requestId);
  }

  async approveContributorRequest(requestId: string, reviewedBy: string): Promise<void> {
    const request = this.contributorRequests.get(requestId);
    if (request) {
      request.status = 'approved';
      request.reviewedBy = reviewedBy;
      request.reviewedAt = new Date();
      this.contributorRequests.set(requestId, request);
      
      // Update user's role in the room to contributor
      const roomMemberKey = `${request.roomId}-${request.userId}`;
      const member = this.roomMembersMap.get(roomMemberKey);
      if (member) {
        member.role = 'contributor';
        this.roomMembersMap.set(roomMemberKey, member);
      }
    }
  }

  async rejectContributorRequest(requestId: string, reviewedBy: string): Promise<void> {
    const request = this.contributorRequests.get(requestId);
    if (request) {
      request.status = 'rejected';
      request.reviewedBy = reviewedBy;
      request.reviewedAt = new Date();
      this.contributorRequests.set(requestId, request);
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private db: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not found in environment variables");
    }
    const connection = neon(process.env.DATABASE_URL);
    this.db = drizzle(connection);
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Check if themes exist, if not create them
      const existingThemes = await this.db.select().from(themes).limit(1);
      if (existingThemes.length === 0) {
        const sampleThemes = [
          {
            title: "Jannat Kay Pattay Vibes",
            description: "Stories about finding home in people, not places",
            prompt: "Someone somewhere is discovering that home isn't a place, but the people who make your heart feel at peace...",
            isDaily: true,
            isActive: true,
          },
          {
            title: "Nemrah Ahmed Inspired",
            description: "Mystery and family secrets",
            prompt: "Someone somewhere just discovered a hidden truth that changes everything they thought they knew...",
            isDaily: false,
            isActive: true,
          },
        ];
        
        await this.db.insert(themes).values(sampleThemes);
      }
    } catch (error) {
      console.log("Failed to initialize themes:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          username: userData.username,
          role: userData.role,
          status: userData.status,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateUserStats(userId: string, contributions?: number, hearts?: number): Promise<void> {
    const updates: any = {};
    let experienceGain = 0;
    
    if (contributions !== undefined) {
      updates.contributionsCount = sql`${users.contributionsCount} + ${contributions}`;
      updates.contributions = sql`${users.contributions} + ${contributions}`;
      experienceGain += contributions * 10; // 10 XP per contribution
    }
    if (hearts !== undefined) {
      updates.heartsReceived = sql`${users.heartsReceived} + ${hearts}`;
      updates.hearts = sql`${users.hearts} + ${hearts}`;
      experienceGain += hearts * 5; // 5 XP per heart
    }
    
    if (experienceGain !== 0) {
      updates.experience = sql`${users.experience} + ${experienceGain}`;
    }
    
    if (Object.keys(updates).length > 0) {
      await this.db.update(users).set(updates).where(eq(users.id, userId));
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const cleanUpdates: any = {};
    
    // Only include fields that are defined in the updates object
    if (updates.nickname !== undefined) cleanUpdates.nickname = updates.nickname;
    if (updates.password !== undefined) cleanUpdates.password = updates.password;
    if (updates.firstName !== undefined) cleanUpdates.firstName = updates.firstName;
    if (updates.lastName !== undefined) cleanUpdates.lastName = updates.lastName;
    if (updates.profileImageUrl !== undefined) cleanUpdates.profileImageUrl = updates.profileImageUrl;
    if (updates.role !== undefined) cleanUpdates.role = updates.role;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    
    if (Object.keys(cleanUpdates).length > 0) {
      cleanUpdates.updatedAt = new Date();
      await this.db.update(users).set(cleanUpdates).where(eq(users.id, id));
    }
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user from the database
    await this.db.delete(users).where(eq(users.id, id));
    
    // Also remove any hearts given by this user
    await this.db.delete(hearts).where(eq(hearts.userId, id));
  }

  // Rooms
  async getRoom(id: string): Promise<Room | undefined> {
    const result = await this.db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0];
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const result = await this.db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    return result[0];
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    // Generate a unique 6-character room code
    let code: string;
    let isCodeUnique = false;
    
    do {
      // Generate a random 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if this code already exists
      const existing = await this.db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
      isCodeUnique = existing.length === 0;
    } while (!isCodeUnique);
    
    const roomWithCode = { ...room, code };
    const result = await this.db.insert(rooms).values(roomWithCode).returning();
    const createdRoom = result[0];
    
    // Add creator as a member with "creator" role
    await this.db.insert(roomMembers).values({
      roomId: createdRoom.id,
      userId: room.creatorId,
      role: 'creator',
      status: 'active',
    });
    
    return createdRoom;
  }

  async getPublicRooms(): Promise<Room[]> {
    try {
      console.log('DatabaseStorage: Getting public rooms...');
      const result = await this.db.select().from(rooms).where(eq(rooms.isPrivate, false)).orderBy(desc(rooms.createdAt));
      
      // Calculate real-time statistics for each room
      const roomsWithStats = await Promise.all(result.map(async (room: Room) => {
        // Get total stories count for this room
        const storiesResult = await this.db.select({ count: sql`count(*)` })
          .from(stories)
          .where(eq(stories.roomId, room.id));
        const totalStories = Number(storiesResult[0]?.count || 0);

        // Get total hearts count for this room
        const heartsResult = await this.db.select({ totalHearts: sql`sum(${stories.hearts})` })
          .from(stories)
          .where(eq(stories.roomId, room.id));
        const totalHearts = Number(heartsResult[0]?.totalHearts || 0);

        // Get member count for this room
        const membersResult = await this.db.select({ count: sql`count(*)` })
          .from(roomMembers)
          .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.status, 'active')));
        const memberCount = Number(membersResult[0]?.count || 0);

        return {
          ...room,
          totalStories,
          totalHearts,
          memberCount
        };
      }));
      
      console.log('DatabaseStorage: Found', roomsWithStats.length, 'public rooms with stats');
      return roomsWithStats;
    } catch (error) {
      console.error('DatabaseStorage: Error getting public rooms:', error);
      throw error;
    }
  }

  async updateRoom(id: string, roomData: Partial<InsertRoom>): Promise<Room> {
    const result = await this.db.update(rooms).set(roomData).where(eq(rooms.id, id)).returning();
    return result[0];
  }

  async deleteRoom(id: string): Promise<void> {
    try {
      // Delete all related data first due to foreign key constraints
      
      // Get all stories in this room
      const roomStories = await this.db.select({ id: stories.id }).from(stories).where(eq(stories.roomId, id));
      
      if (roomStories.length > 0) {
        const storyIds = roomStories.map((s: any) => s.id);
        
        // Get all comments for these stories first
        const storyComments = await this.db.select({ id: comments.id }).from(comments).where(inArray(comments.storyId, storyIds));
        
        if (storyComments.length > 0) {
          const commentIds = storyComments.map((c: any) => c.id);
          
          // Delete comment hearts for these comments
          await this.db.delete(commentHearts).where(inArray(commentHearts.commentId, commentIds));
        }
        
        // Delete comments for stories in this room
        await this.db.delete(comments).where(inArray(comments.storyId, storyIds));
        
        // Delete hearts for stories in this room
        await this.db.delete(hearts).where(inArray(hearts.storyId, storyIds));
        
        // Delete the stories themselves
        await this.db.delete(stories).where(eq(stories.roomId, id));
      }
      
      // Delete contributor requests for this room
      await this.db.delete(contributorRequests).where(eq(contributorRequests.roomId, id));
      
      // Delete room follows (if this table exists)
      try {
        await this.db.delete(roomFollows).where(eq(roomFollows.roomId, id));
      } catch (e) {
        // Ignore if table doesn't exist
      }
      
      // Delete room members
      await this.db.delete(roomMembers).where(eq(roomMembers.roomId, id));
      
      // Finally delete the room itself
      await this.db.delete(rooms).where(eq(rooms.id, id));
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  // Room Members
  async getRoomMember(roomId: string, userId: string): Promise<RoomMember | undefined> {
    const result = await this.db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
    return result[0];
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomMember> {
    const memberData = {
      roomId,
      userId,
      role: "viewer" as const, // Default role for new members
      status: "active" as const,
    };
    const result = await this.db.insert(roomMembers).values(memberData).returning();
    
    // Update room member count
    await this.db.update(rooms).set({
      memberCount: sql`${rooms.memberCount} + 1`
    }).where(eq(rooms.id, roomId));
    
    return result[0];
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await this.db.delete(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
    
    // Update room member count
    await this.db.update(rooms).set({
      memberCount: sql`${rooms.memberCount} - 1`
    }).where(eq(rooms.id, roomId));
  }

  async getUserRoomMemberships(userId: string): Promise<RoomMember[]> {
    const result = await this.db.select().from(roomMembers).where(eq(roomMembers.userId, userId));
    return result;
  }

  async updateRoomMemberCount(roomId: string, count: number): Promise<void> {
    await this.db.update(rooms).set({ memberCount: count }).where(eq(rooms.id, roomId));
  }

  // Stories
  async getStory(id: string): Promise<Story | undefined> {
    const result = await this.db.select().from(stories).where(eq(stories.id, id)).limit(1);
    return result[0];
  }

  async createStory(story: InsertStory): Promise<Story> {
    // Get next sequence number for this chain
    const maxSeq = await this.db.select({ max: sql<number>`max(${stories.sequence})` })
      .from(stories)
      .where(eq(stories.chainId, story.chainId));
    
    const sequence = (maxSeq[0]?.max || 0) + 1;
    
    const result = await this.db.insert(stories).values({
      ...story,
      sequence
    }).returning();
    
    // Update user's contribution XP
    await this.updateUserStats(story.authorId, 1, 0);
    
    return result[0];
  }

  async getStoriesByChain(chainId: number): Promise<Story[]> {
    return await this.db.select().from(stories)
      .where(eq(stories.chainId, chainId))
      .orderBy(stories.sequence);
  }

  async getStoriesByChainWithHeartState(chainId: number, userId: string): Promise<(Story & { isHearted: boolean })[]> {
    const chainStories = await this.getStoriesByChain(chainId);
    const storiesWithHeartState = [];
    
    for (const story of chainStories) {
      const isHearted = await this.isStoryHearted(story.id, userId);
      storiesWithHeartState.push({
        ...story,
        isHearted
      });
    }
    
    return storiesWithHeartState;
  }

  async getStoriesByRoom(roomId: string): Promise<Story[]> {
    return await this.db.select().from(stories)
      .where(eq(stories.roomId, roomId))
      .orderBy(desc(stories.createdAt));
  }

  async getStoriesByRoomWithHeartState(roomId: string, userId: string): Promise<(Story & { isHearted: boolean })[]> {
    const roomStories = await this.getStoriesByRoom(roomId);
    const storiesWithHeartState = [];
    
    for (const story of roomStories) {
      const isHearted = await this.isStoryHearted(story.id, userId);
      storiesWithHeartState.push({
        ...story,
        isHearted
      });
    }
    
    return storiesWithHeartState;
  }

  async getStoriesByUser(userId: string): Promise<Story[]> {
    return await this.db.select().from(stories)
      .where(eq(stories.authorId, userId))
      .orderBy(desc(stories.createdAt));
  }

  async getLatestStoryChains(limit = 10): Promise<StoryChain[]> {
    const chainsData = await this.db
      .select({
        chainId: stories.chainId,
        storyCount: sql<number>`count(*)`,
        lastUpdated: sql<Date>`max(${stories.createdAt})`,
        stories: sql<Story[]>`json_agg(
          json_build_object(
            'id', ${stories.id},
            'chainId', ${stories.chainId},
            'roomId', ${stories.roomId},
            'content', ${stories.content},
            'authorId', ${stories.authorId},
            'authorName', ${stories.authorName},
            'sequence', ${stories.sequence},
            'hearts', ${stories.hearts},
            'comments', ${stories.comments},
            'createdAt', ${stories.createdAt}
          ) ORDER BY ${stories.sequence}
        )`
      })
      .from(stories)
      .groupBy(stories.chainId)
      .orderBy(desc(sql`max(${stories.createdAt})`))
      .limit(limit);

    return chainsData.map((chain: any) => ({
      chainId: chain.chainId,
      storyCount: chain.storyCount,
      lastUpdated: chain.lastUpdated,
      stories: chain.stories
    }));
  }

  async toggleHeart(storyId: string, userId: string): Promise<boolean> {
    const existing = await this.db.select().from(hearts)
      .where(and(eq(hearts.storyId, storyId), eq(hearts.userId, userId)))
      .limit(1);

    // Get story author to update their XP
    const story = await this.db.select({ authorId: stories.authorId }).from(stories).where(eq(stories.id, storyId)).limit(1);
    if (!story.length) return false;
    
    const storyAuthorId = story[0].authorId;

    if (existing.length > 0) {
      // Remove heart
      await this.db.delete(hearts)
        .where(and(eq(hearts.storyId, storyId), eq(hearts.userId, userId)));
      
      await this.db.update(stories)
        .set({ hearts: sql`${stories.hearts} - 1` })
        .where(eq(stories.id, storyId));
      
      // Update story author's XP (remove heart)
      await this.updateUserStats(storyAuthorId, 0, -1);
      
      return false;
    } else {
      // Add heart
      await this.db.insert(hearts).values({ storyId, userId });
      
      await this.db.update(stories)
        .set({ hearts: sql`${stories.hearts} + 1` })
        .where(eq(stories.id, storyId));
      
      // Update story author's XP (add heart)
      await this.updateUserStats(storyAuthorId, 0, 1);
      
      return true;
    }
  }

  async isStoryHearted(storyId: string, userId: string): Promise<boolean> {
    const result = await this.db.select().from(hearts)
      .where(and(eq(hearts.storyId, storyId), eq(hearts.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async getNextChainId(): Promise<number> {
    const result = await this.db.select({ max: sql<number>`coalesce(max(${stories.chainId}), 0) + 1` }).from(stories);
    return result[0]?.max || 1;
  }

  // Room Members
  async getRoomMembers(roomId: string): Promise<RoomMemberWithUser[]> {
    const members = await this.db.select({
      id: roomMembers.id,
      roomId: roomMembers.roomId,
      userId: roomMembers.userId,
      role: roomMembers.role,
      status: roomMembers.status,
      permissions: roomMembers.permissions,
      joinedAt: roomMembers.joinedAt,
      lastActive: roomMembers.lastActive,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        hearts: users.hearts,
        contributions: users.contributions,
        experience: users.experience,
        level: users.level
      }
    })
    .from(roomMembers)
    .leftJoin(users, eq(roomMembers.userId, users.id))
    .where(eq(roomMembers.roomId, roomId));

    return members;
  }

  async removeRoomMember(roomId: string, userId: string): Promise<void> {
    await this.db.delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
  }

  // Stories
  async updateStory(id: string, updates: Partial<Story>): Promise<Story> {
    const result = await this.db.update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    return result[0];
  }

  async deleteStory(id: string): Promise<void> {
    // First delete all hearts associated with this story to avoid foreign key constraint
    await this.db.delete(hearts).where(eq(hearts.storyId, id));
    
    // Then delete the story itself
    await this.db.delete(stories).where(eq(stories.id, id));
  }

  // Room Moderation
  async blockUserFromRoom(roomId: string, userId: string, blockedBy: string, reason?: string): Promise<UserBlock> {
    const result = await this.db.insert(userBlocks).values({
      roomId,
      userId,
      blockedBy,
      reason
    }).returning();
    return result[0];
  }

  async unblockUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.db.update(userBlocks)
      .set({ isActive: false })
      .where(and(
        eq(userBlocks.roomId, roomId),
        eq(userBlocks.userId, userId),
        eq(userBlocks.isActive, true)
      ));
  }

  async suspendUserFromRoom(roomId: string, userId: string, suspendedBy: string, reason?: string, duration?: number): Promise<UserSuspension> {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
    
    const result = await this.db.insert(userSuspensions).values({
      roomId,
      userId,
      suspendedBy,
      reason,
      duration,
      expiresAt
    }).returning();
    return result[0];
  }

  async unsuspendUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.db.update(userSuspensions)
      .set({ isActive: false })
      .where(and(
        eq(userSuspensions.roomId, roomId),
        eq(userSuspensions.userId, userId),
        eq(userSuspensions.isActive, true)
      ));
  }

  // Themes
  async getDailyTheme(): Promise<Theme | undefined> {
    const result = await this.db.select().from(themes)
      .where(and(eq(themes.isDaily, true), eq(themes.isActive, true)))
      .limit(1);
    return result[0];
  }

  async getAllThemes(): Promise<Theme[]> {
    return await this.db.select().from(themes).where(eq(themes.isActive, true));
  }

  // Community
  async getCommunityStats(): Promise<CommunityStats> {
    const [storiesCount, usersCount, heartsCount] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(stories),
      this.db.select({ count: sql<number>`count(*)` }).from(users),
      this.db.select({ count: sql<number>`sum(${stories.hearts})` }).from(stories)
    ]);

    // Daily contributions (stories from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyContributions = await this.db.select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(sql`${stories.createdAt} >= ${today}`);

    return {
      totalStories: storiesCount[0]?.count || 0,
      activeUsers: usersCount[0]?.count || 0,
      totalHearts: heartsCount[0]?.count || 0,
      dailyContributions: dailyContributions[0]?.count || 0,
    };
  }

  async getCookiesPicks(): Promise<CookiesPick[]> {
    return await this.db.select().from(cookiesPicks)
      .where(eq(cookiesPicks.isFeatured, true))
      .orderBy(desc(cookiesPicks.createdAt));
  }

  // ========== COMMENT METHODS ==========

  async getComment(id: string): Promise<Comment | undefined> {
    const result = await this.db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async getCommentsByStory(storyId: string, userId?: string): Promise<(Comment & { authorName: string; isHearted?: boolean })[]> {
    const result = await this.db
      .select({
        id: comments.id,
        storyId: comments.storyId,
        userId: comments.userId,
        content: comments.content,
        parentId: comments.parentId,
        hearts: comments.hearts,
        isEdited: comments.isEdited,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.username,
        isHearted: userId ? sql<boolean>`CASE WHEN ${commentHearts.userId} IS NOT NULL THEN true ELSE false END` : sql<boolean>`false`,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(
        commentHearts, 
        userId ? and(
          eq(commentHearts.commentId, comments.id),
          eq(commentHearts.userId, userId)
        ) : sql`false`
      )
      .where(eq(comments.storyId, storyId))
      .orderBy(comments.createdAt);

    return result.map((row: any) => ({
      ...row,
      authorName: row.authorName || 'Anonymous'
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment & { authorName: string }> {
    const [newComment] = await this.db.insert(comments).values(comment).returning();
    
    // Get the author name
    const user = await this.getUser(comment.userId);
    
    return {
      ...newComment,
      authorName: user?.username || 'Anonymous'
    };
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment & { authorName: string }> {
    const [updatedComment] = await this.db
      .update(comments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();

    // Get the author name
    const user = await this.getUser(updatedComment.userId);

    return {
      ...updatedComment,
      authorName: user?.username || 'Anonymous'
    };
  }

  async deleteComment(id: string): Promise<void> {
    await this.db.delete(comments).where(eq(comments.id, id));
  }

  async updateStoryCommentCount(storyId: string): Promise<void> {
    // Count comments for this story
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.storyId, storyId));

    // Update the story's comment count
    await this.db
      .update(stories)
      .set({ comments: Number(count) })
      .where(eq(stories.id, storyId));
  }

  async toggleCommentHeart(commentId: string, userId: string): Promise<{ isHearted: boolean; hearts: number }> {
    // Check if the user already hearted this comment
    const existingHeart = await this.db
      .select()
      .from(commentHearts)
      .where(and(
        eq(commentHearts.commentId, commentId),
        eq(commentHearts.userId, userId)
      ))
      .limit(1);

    let isHearted: boolean;

    if (existingHeart.length > 0) {
      // Remove the heart
      await this.db.delete(commentHearts).where(
        and(
          eq(commentHearts.commentId, commentId),
          eq(commentHearts.userId, userId)
        )
      );
      isHearted = false;
    } else {
      // Add a heart
      await this.db.insert(commentHearts).values({
        commentId,
        userId,
      });
      isHearted = true;
    }

    // Count total hearts for this comment
    const [{ hearts }] = await this.db
      .select({ hearts: sql<number>`count(*)` })
      .from(commentHearts)
      .where(eq(commentHearts.commentId, commentId));

    // Update the comment's heart count
    await this.db
      .update(comments)
      .set({ hearts: Number(hearts) })
      .where(eq(comments.id, commentId));

    return { isHearted, hearts: Number(hearts) };
  }

  async updateRoomMemberRole(roomId: string, userId: string, role: string): Promise<void> {
    await this.db
      .update(roomMembers)
      .set({ role })
      .where(and(
        eq(roomMembers.roomId, roomId),
        eq(roomMembers.userId, userId)
      ));
  }

  async suspendRoomMember(roomId: string, userId: string, reason?: string, duration?: number): Promise<void> {
    await this.db
      .update(roomMembers)
      .set({ 
        status: 'suspended',
        // In a real implementation, you might want to add suspend date, reason etc.
      })
      .where(and(
        eq(roomMembers.roomId, roomId),
        eq(roomMembers.userId, userId)
      ));
  }

  // Contributor Requests
  async getContributorRequest(roomId: string, userId: string, storyId?: string): Promise<any> {
    const query = this.db
      .select()
      .from(contributorRequests)
      .where(and(
        eq(contributorRequests.roomId, roomId),
        eq(contributorRequests.userId, userId),
        storyId ? eq(contributorRequests.storyId, storyId) : isNull(contributorRequests.storyId)
      ))
      .limit(1);
    
    const result = await query;
    return result[0];
  }

  async createContributorRequest(roomId: string, userId: string, storyId?: string, message?: string): Promise<any> {
    const requestData = {
      roomId,
      userId,
      storyId: storyId || null,
      message: message || null,
      status: 'pending' as const,
    };
    
    const result = await this.db.insert(contributorRequests).values(requestData).returning();
    return result[0];
  }

  async getContributorRequests(roomId: string): Promise<any[]> {
    const result = await this.db
      .select({
        id: contributorRequests.id,
        roomId: contributorRequests.roomId,
        userId: contributorRequests.userId,
        storyId: contributorRequests.storyId,
        message: contributorRequests.message,
        status: contributorRequests.status,
        reviewedBy: contributorRequests.reviewedBy,
        reviewedAt: contributorRequests.reviewedAt,
        createdAt: contributorRequests.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(contributorRequests)
      .leftJoin(users, eq(contributorRequests.userId, users.id))
      .where(eq(contributorRequests.roomId, roomId))
      .orderBy(desc(contributorRequests.createdAt));
    
    return result;
  }

  async getContributorRequestById(requestId: string): Promise<any> {
    const result = await this.db
      .select()
      .from(contributorRequests)
      .where(eq(contributorRequests.id, requestId))
      .limit(1);
    
    return result[0];
  }

  async approveContributorRequest(requestId: string, reviewedBy: string): Promise<void> {
    // Get the request first to get user and room info
    const request = await this.db
      .select()
      .from(contributorRequests)
      .where(eq(contributorRequests.id, requestId))
      .limit(1);
    
    if (!request.length) {
      throw new Error('Contributor request not found');
    }
    
    const requestData = request[0];
    
    // Update request status
    await this.db
      .update(contributorRequests)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(contributorRequests.id, requestId));
    
    // Update user's role in the room to contributor
    await this.db
      .update(roomMembers)
      .set({
        role: 'contributor',
      })
      .where(
        and(
          eq(roomMembers.roomId, requestData.roomId),
          eq(roomMembers.userId, requestData.userId)
        )
      );
  }

  async rejectContributorRequest(requestId: string, reviewedBy: string): Promise<void> {
    await this.db
      .update(contributorRequests)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(contributorRequests.id, requestId));
  }

  async deleteContributorRequest(requestId: string): Promise<void> {
    await this.db.delete(contributorRequests).where(eq(contributorRequests.id, requestId));
  }
}

// Function to create storage based on environment
export function createStorage(): IStorage {
  console.log('Creating storage...');
  console.log('Storage type:', process.env.DATABASE_URL ? 'DatabaseStorage' : 'MemStorage');
  console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  return process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
}

// This will be set by the routes when they initialize
export let storage: IStorage;
