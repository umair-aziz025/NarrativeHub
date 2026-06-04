-- Migration: Enhanced Room System
-- Add new columns to rooms table

ALTER TABLE rooms 
ADD COLUMN description text DEFAULT '',
ADD COLUMN category varchar DEFAULT 'general',
ADD COLUMN max_members integer DEFAULT 50,
ADD COLUMN requires_approval boolean NOT NULL DEFAULT false,
ADD COLUMN allow_invites boolean NOT NULL DEFAULT true,
ADD COLUMN allow_comments boolean NOT NULL DEFAULT true,
ADD COLUMN allow_hearts boolean NOT NULL DEFAULT true,
ADD COLUMN status varchar NOT NULL DEFAULT 'active',
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN rules text DEFAULT '',
ADD COLUMN total_stories integer NOT NULL DEFAULT 0,
ADD COLUMN total_hearts integer NOT NULL DEFAULT 0,
ADD COLUMN last_activity timestamp DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- Create room_members table
CREATE TABLE room_members (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id varchar NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role varchar NOT NULL DEFAULT 'member',
  status varchar NOT NULL DEFAULT 'active',
  permissions json DEFAULT '{}',
  joined_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- Create room_invites table
CREATE TABLE room_invites (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id varchar NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  inviter_id varchar NOT NULL REFERENCES users(id),
  invitee_id varchar REFERENCES users(id),
  invitee_email varchar,
  token varchar NOT NULL UNIQUE,
  status varchar NOT NULL DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create room_follows table
CREATE TABLE room_follows (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id varchar NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id varchar NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id varchar,
  hearts integer NOT NULL DEFAULT 0,
  is_edited boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create comment_hearts table
CREATE TABLE comment_hearts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id varchar NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- Update hearts table to add cascade delete
ALTER TABLE hearts 
DROP CONSTRAINT hearts_story_id_fkey,
ADD CONSTRAINT hearts_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE hearts 
DROP CONSTRAINT hearts_user_id_fkey,
ADD CONSTRAINT hearts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint to hearts table
ALTER TABLE hearts ADD CONSTRAINT hearts_story_user_unique UNIQUE(story_id, user_id);

-- Create indexes for better performance
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_invites_room_id ON room_invites(room_id);
CREATE INDEX idx_room_invites_token ON room_invites(token);
CREATE INDEX idx_room_follows_room_id ON room_follows(room_id);
CREATE INDEX idx_room_follows_user_id ON room_follows(user_id);
CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comment_hearts_comment_id ON comment_hearts(comment_id);
CREATE INDEX idx_comment_hearts_user_id ON comment_hearts(user_id);
CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_last_activity ON rooms(last_activity);

-- Insert room creator as first member for existing rooms
INSERT INTO room_members (room_id, user_id, role, status)
SELECT id, creator_id, 'creator', 'active'
FROM rooms
ON CONFLICT (room_id, user_id) DO NOTHING;
