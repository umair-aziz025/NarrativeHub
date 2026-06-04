import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const connection = neon(process.env.DATABASE_URL);
const db = drizzle(connection);

async function updateUserXPDefaults() {
  try {
    console.log('Updating existing users with default XP values...');
    
    // First, update null values to 0
    await db.execute(sql`
      UPDATE users 
      SET hearts = COALESCE(hearts, 0),
          contributions = COALESCE(contributions, 0),
          experience = COALESCE(experience, 0)
      WHERE hearts IS NULL OR contributions IS NULL OR experience IS NULL
    `);
    
    console.log('✅ Set null XP values to 0');
    
    // Then sync old fields to new fields for users who have old data
    await db.execute(sql`
      UPDATE users 
      SET hearts = COALESCE(hearts_received, 0),
          contributions = COALESCE(contributions_count, 0),
          experience = COALESCE(experience_points, 0)
      WHERE (hearts = 0 OR hearts IS NULL) 
        AND (hearts_received > 0 OR contributions_count > 0 OR experience_points > 0)
    `);
    
    console.log('✅ Successfully synced old XP fields to new fields');
    
    // Show updated users
    const users = await db.execute(sql`
      SELECT username, hearts, contributions, experience, hearts_received, contributions_count, experience_points 
      FROM users 
      LIMIT 5
    `);
    
    console.log('Sample updated users:', users.rows);
    
  } catch (error) {
    console.error('❌ Failed to update user XP defaults:', error);
    process.exit(1);
  }
}

updateUserXPDefaults();
