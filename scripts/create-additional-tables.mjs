#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function createMissingTables() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Creating additional tables for room system...');
    
    // Create join requests table for approval system
    await sql`
      CREATE TABLE IF NOT EXISTS room_join_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        responded_at TIMESTAMP,
        responded_by VARCHAR REFERENCES users(id),
        response_message TEXT,
        UNIQUE(room_id, user_id)
      )
    `;
    console.log('✅ room_join_requests table created');

    // Update room_members table to include approval status
    await sql`
      ALTER TABLE room_members 
      ADD COLUMN IF NOT EXISTS approved_by VARCHAR REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
    `;
    console.log('✅ room_members table updated with approval fields');

    // Create stories table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS stories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR REFERENCES rooms(id) ON DELETE CASCADE,
        chain_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        author_id VARCHAR NOT NULL REFERENCES users(id),
        author_name VARCHAR NOT NULL,
        sequence INTEGER NOT NULL DEFAULT 1,
        hearts INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ stories table created');

    // Create hearts table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS hearts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(story_id, user_id)
      )
    `;
    console.log('✅ hearts table created');

    // Create comments table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        hearts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ comments table created');

    console.log('🎉 All additional tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createMissingTables();
