#!/usr/bin/env node

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function fixRoomsMigration() {
  try {
    console.log('🔧 Fixing rooms table migration...');
    
    const statements = [
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general'",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS allow_invites BOOLEAN NOT NULL DEFAULT true",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT true",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS allow_hearts BOOLEAN NOT NULL DEFAULT true",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'active'",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT ''",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS total_stories INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS total_hearts INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW()",
      "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"
    ];
    
    for (const statement of statements) {
      try {
        console.log(`  ⚙️ Executing: ${statement.substring(0, 60)}...`);
        await sql([statement]);
        console.log('  ✅ Success');
      } catch (error) {
        console.log(`  ⚠️ Warning: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Rooms table migration fixed!');
    
    // Verify the fix
    console.log('\n🔍 Verifying columns...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rooms' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Current columns:', columns.map(c => c.column_name));
    
  } catch (error) {
    console.error('❌ Error fixing migration:', error);
  }
}

fixRoomsMigration();
