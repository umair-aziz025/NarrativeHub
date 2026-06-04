-- Enhanced Room System Migration
-- This migration adds new fields to support advanced room features

-- First, let's check if we need to add new columns to the rooms table
-- Add new columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general',
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_invites BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_hearts BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS total_stories INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hearts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL DEFAULT 'member', -- creator, admin, moderator, member
    status VARCHAR NOT NULL DEFAULT 'active', -- active, banned, left
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Create room_invites table
CREATE TABLE IF NOT EXISTS room_invites (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    inviter_id VARCHAR NOT NULL REFERENCES users(id),
    invitee_id VARCHAR REFERENCES users(id), -- null for email invites
    invitee_email VARCHAR, -- for non-users
    token VARCHAR NOT NULL UNIQUE,
    status VARCHAR NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create room_follows table
CREATE TABLE IF NOT EXISTS room_follows (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id VARCHAR, -- Self-reference for nested comments
    hearts INTEGER NOT NULL DEFAULT 0,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create comment_hearts table
CREATE TABLE IF NOT EXISTS comment_hearts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id VARCHAR NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Update existing hearts table to have CASCADE delete
DROP TABLE IF EXISTS hearts CASCADE;
CREATE TABLE hearts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_room_id ON room_invites(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_token ON room_invites(token);
CREATE INDEX IF NOT EXISTS idx_room_follows_room_id ON room_follows(room_id);
CREATE INDEX IF NOT EXISTS idx_room_follows_user_id ON room_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_hearts_comment_id ON comment_hearts(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_hearts_user_id ON comment_hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(category);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity);

-- Add triggers to update room stats
CREATE OR REPLACE FUNCTION update_room_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update story count
        UPDATE rooms 
        SET total_stories = total_stories + 1,
            last_activity = NOW(),
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update story count
        UPDATE rooms 
        SET total_stories = GREATEST(total_stories - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for story count updates
DROP TRIGGER IF EXISTS trigger_update_room_story_count ON stories;
CREATE TRIGGER trigger_update_room_story_count
    AFTER INSERT OR DELETE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_room_stats();

-- Add trigger for heart count updates
CREATE OR REPLACE FUNCTION update_room_heart_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update heart count for room
        UPDATE rooms 
        SET total_hearts = total_hearts + 1,
            updated_at = NOW()
        WHERE id = (SELECT room_id FROM stories WHERE id = NEW.story_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update heart count for room
        UPDATE rooms 
        SET total_hearts = GREATEST(total_hearts - 1, 0),
            updated_at = NOW()
        WHERE id = (SELECT room_id FROM stories WHERE id = OLD.story_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for heart count updates
DROP TRIGGER IF EXISTS trigger_update_room_heart_count ON hearts;
CREATE TRIGGER trigger_update_room_heart_count
    AFTER INSERT OR DELETE ON hearts
    FOR EACH ROW
    EXECUTE FUNCTION update_room_heart_stats();

-- Create function to auto-add room creator as admin member
CREATE OR REPLACE FUNCTION add_room_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO room_members (room_id, user_id, role, status)
    VALUES (NEW.id, NEW.creator_id, 'creator', 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-add room creator
DROP TRIGGER IF EXISTS trigger_add_room_creator ON rooms;
CREATE TRIGGER trigger_add_room_creator
    AFTER INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION add_room_creator_as_member();

-- Update member count trigger
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE rooms 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE rooms 
        SET member_count = GREATEST(member_count - 1, 0),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.room_id, OLD.room_id);
        RETURN COALESCE(NEW, OLD);
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE rooms 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member count updates
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON room_members;
CREATE TRIGGER trigger_update_room_member_count
    AFTER INSERT OR UPDATE OR DELETE ON room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_room_member_count();

COMMIT;
