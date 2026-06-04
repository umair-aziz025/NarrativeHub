import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for optional server-side auth/session workflows.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  nickname: varchar("nickname"), // For story contributions
  password: varchar("password"), // For local authentication
  role: varchar("role").notNull().default("community"), // community, moderator, admin
  status: varchar("status").notNull().default("pending"), // pending, approved, suspended, rejected
  contributionsCount: integer("contributions_count").notNull().default(0),
  heartsReceived: integer("hearts_received").notNull().default(0),
  experiencePoints: integer("experience_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  badges: text("badges").array().default([]),
  preferences: json("preferences").default({}),
  // New XP system columns
  hearts: integer("hearts").notNull().default(0),
  contributions: integer("contributions").notNull().default(0),
  experience: integer("experience").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roomMembers = pgTable("room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull().default("viewer"), // creator, manager, contributor, viewer
  status: varchar("status").notNull().default("active"), // active, banned, left, pending
  permissions: json("permissions").default({}), // custom permissions object
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

export const roomInvites = pgTable("room_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  inviterId: varchar("inviter_id").notNull().references(() => users.id),
  inviteeId: varchar("invitee_id").references(() => users.id), // null for email invites
  inviteeEmail: varchar("invitee_email"), // for non-users
  token: varchar("token").notNull().unique(),
  status: varchar("status").notNull().default("pending"), // pending, accepted, declined, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const roomFollows = pgTable("room_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contributorRequests = pgTable("contributor_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").references(() => stories.id, { onDelete: "cascade" }), // specific story they want to contribute to
  message: text("message"), // optional message from user
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id), // who approved/rejected
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  prompt: text("prompt").notNull(),
  description: text("description").default(""),
  isPrivate: boolean("is_private").notNull().default(false),
  isThemed: boolean("is_themed").notNull().default(false),
  theme: text("theme").default(""),
  category: varchar("category").default("general"), // general, horror, romance, sci-fi, fantasy, mystery, etc.
  maxMembers: integer("max_members").default(50),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  allowInvites: boolean("allow_invites").notNull().default(true),
  allowComments: boolean("allow_comments").notNull().default(true),
  allowHearts: boolean("allow_hearts").notNull().default(true),
  status: varchar("status").notNull().default("active"), // active, paused, completed, archived
  tags: text("tags").array().default([]),
  rules: text("rules").default(""),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  memberCount: integer("member_count").notNull().default(1),
  totalStories: integer("total_stories").notNull().default(0),
  totalHearts: integer("total_hearts").notNull().default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: integer("chain_id").notNull(),
  roomId: varchar("room_id").references(() => rooms.id),
  title: text("title"),
  description: text("description"),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  authorName: text("author_name").notNull(),
  sequence: integer("sequence").notNull(),
  hearts: integer("hearts").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hearts = pgTable("hearts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: varchar("parent_id"), // Self-reference for nested comments
  hearts: integer("hearts").notNull().default(0),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commentHearts = pgTable("comment_hearts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const themes = pgTable("themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  isDaily: boolean("is_daily").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cookiesPicks = pgTable("cookies_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  reason: text("reason").default(""),
  isFeatured: boolean("is_featured").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Room Stories table for room-specific stories
export const roomStories = pgTable("room_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  title: text("title"),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Blocks table for room-specific blocking
export const userBlocks = pgTable("user_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedBy: varchar("blocked_by").notNull().references(() => users.id),
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  blockedAt: timestamp("blocked_at").notNull().defaultNow(),
});

// User Suspensions table for room-specific suspensions
export const userSuspensions = pgTable("user_suspensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  suspendedBy: varchar("suspended_by").notNull().references(() => users.id),
  reason: text("reason"),
  duration: integer("duration"), // in hours, null for indefinite
  isActive: boolean("is_active").notNull().default(true),
  suspendedAt: timestamp("suspended_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Insert schemas  
export const insertUserSchema = createInsertSchema(users).omit({
  contributionsCount: true,
  heartsReceived: true,
  experiencePoints: true,
  level: true,
  badges: true,
  preferences: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  contributionsCount: true,
  heartsReceived: true,
  experiencePoints: true,
  level: true,
  badges: true,
  preferences: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  code: true,
  memberCount: true,
  totalStories: true,
  totalHearts: true,
  lastActivity: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomMemberSchema = createInsertSchema(roomMembers).omit({
  id: true,
  joinedAt: true,
  lastActive: true,
});

export const insertRoomInviteSchema = createInsertSchema(roomInvites).omit({
  id: true,
  token: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  hearts: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  sequence: true,
  hearts: true,
  comments: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type RoomMember = typeof roomMembers.$inferSelect;
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>;

export type RoomInvite = typeof roomInvites.$inferSelect;
export type InsertRoomInvite = z.infer<typeof insertRoomInviteSchema>;

export type RoomFollow = typeof roomFollows.$inferSelect;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CommentHeart = typeof commentHearts.$inferSelect;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type Heart = typeof hearts.$inferSelect;
export type CookiesPick = typeof cookiesPicks.$inferSelect;

export type RoomStory = typeof roomStories.$inferSelect;
export type UserBlock = typeof userBlocks.$inferSelect;
export type UserSuspension = typeof userSuspensions.$inferSelect;

// API Response types
export interface StoryChain {
  chainId: number;
  roomId?: string | null;
  stories: Story[];
  totalHearts: number;
  totalComments: number;
  contributorCount: number;
  createdAt: Date;
}

export interface RoomWithDetails extends Room {
  stories: Story[];
  activeUsers: number;
  members: RoomMember[];
  isFollowing?: boolean;
  memberRole?: string;
  canJoin?: boolean;
  requiresInvite?: boolean;
}

export interface RoomMemberWithUser extends RoomMember {
  user: User;
}

export interface CommentWithUser extends Comment {
  user: User;
  replies?: CommentWithUser[];
  isLiked?: boolean;
}

export interface StoryWithDetails extends Story {
  commentsList: CommentWithUser[];
  isLiked?: boolean;
}

export interface CommunityStats {
  totalStories: number;
  activeUsers: number;
  totalHearts: number;
  dailyContributions: number;
}
