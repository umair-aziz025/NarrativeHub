#!/usr/bin/env node

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkRoomsTable() {
  try {
    console.log('🔍 Checking rooms table structure...');
    
    // Get column information
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rooms' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Current rooms table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🏗️ Expected columns:');
    const expected = [
      'id', 'name', 'code', 'prompt', 'description', 'isPrivate', 'isThemed', 
      'theme', 'category', 'maxMembers', 'requiresApproval', 'allowInvites', 
      'allowComments', 'allowHearts', 'status', 'tags', 'rules', 'creatorId', 
      'memberCount', 'totalStories', 'totalHearts', 'lastActivity', 'createdAt', 'updatedAt'
    ];
    
    const existing = columns.map(col => col.column_name);
    const missing = expected.filter(col => !existing.includes(col) && !existing.includes(col.toLowerCase()));
    
    if (missing.length > 0) {
      console.log('❌ Missing columns:', missing);
    } else {
      console.log('✅ All expected columns are present');
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
  }
}

checkRoomsTable();
