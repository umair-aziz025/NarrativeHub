#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function verifyTables() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Checking if tables exist...');
    
    // Check if room_members table exists
    const roomMembersCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'room_members'
    `;
    
    console.log('room_members table exists:', roomMembersCheck.length > 0);
    
    // Check if room_invites table exists
    const roomInvitesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'room_invites'
    `;
    
    console.log('room_invites table exists:', roomInvitesCheck.length > 0);
    
    // List all tables
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('All tables in database:');
    allTables.forEach(table => {
      console.log('-', table.table_name);
    });
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

verifyTables();
