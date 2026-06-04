#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function createRoomMembersTable() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Creating room_members table...');
    
    // Create room_members table
    await sql`
      CREATE TABLE IF NOT EXISTS room_members (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR NOT NULL DEFAULT 'member',
        status VARCHAR NOT NULL DEFAULT 'active',
        permissions JSON DEFAULT '{}',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_active TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, user_id)
      )
    `;
    
    console.log('✅ room_members table created successfully');

    // Create room_invites table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS room_invites (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        inviter_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR,
        message TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        responded_at TIMESTAMP
      )
    `;
    
    console.log('✅ room_invites table created successfully');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createRoomMembersTable();
