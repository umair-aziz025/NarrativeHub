#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function enhanceRoomSystem() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Enhancing room system with new features...');
    
    // Update room_members table to include suspension/blocking
    await sql`
      ALTER TABLE room_members 
      ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS blocked_by VARCHAR REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS suspended_by VARCHAR REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS block_reason TEXT,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT
    `;
    console.log('✅ room_members table enhanced with blocking/suspension features');

    // Create room_stories table (stories within rooms, separate from story chains)
    await sql`
      CREATE TABLE IF NOT EXISTS room_stories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        author_id VARCHAR NOT NULL REFERENCES users(id),
        author_name VARCHAR NOT NULL,
        hearts INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        status VARCHAR NOT NULL DEFAULT 'active',
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ room_stories table created');

    // Update stories table to reference room_stories
    await sql`
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS room_story_id VARCHAR REFERENCES room_stories(id) ON DELETE CASCADE
    `;
    console.log('✅ stories table updated to reference room_stories');

    // Create user_blocks table for room-level user blocking
    await sql`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        blocked_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, blocked_user_id)
      )
    `;
    console.log('✅ user_blocks table created');

    // Create user_suspensions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_suspensions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        suspended_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        suspended_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, suspended_user_id)
      )
    `;
    console.log('✅ user_suspensions table created');

    // Update users table for XP and leveling system
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS required_xp INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS total_stories INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_contributions INTEGER DEFAULT 0
    `;
    console.log('✅ users table enhanced with XP system');

    console.log('🎉 All enhancements completed successfully!');
    
  } catch (error) {
    console.error('❌ Error enhancing room system:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

enhanceRoomSystem();
