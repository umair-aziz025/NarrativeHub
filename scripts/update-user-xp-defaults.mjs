import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../shared/schema.ts';
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
    
    // Update users where XP fields are null or 0 to have proper default values
    const result = await db.update(users)
      .set({
        hearts: sql`COALESCE(${users.hearts}, 0)`,
        contributions: sql`COALESCE(${users.contributions}, 0)`,
        experience: sql`COALESCE(${users.experience}, 0)`
      })
      .where(sql`${users.hearts} IS NULL OR ${users.contributions} IS NULL OR ${users.experience} IS NULL`);
    
    console.log('✅ Successfully updated user XP defaults');
    console.log('Users updated:', result);
    
    // Also sync old fields with new fields for existing users
    await db.update(users).set({
      hearts: sql`COALESCE(${users.heartsReceived}, 0)`,
      contributions: sql`COALESCE(${users.contributionsCount}, 0)`,
      experience: sql`COALESCE(${users.experiencePoints}, 0)`
    });
    
    console.log('✅ Successfully synced old XP fields to new fields');
    
  } catch (error) {
    console.error('❌ Failed to update user XP defaults:', error);
    process.exit(1);
  }
}

updateUserXPDefaults();
