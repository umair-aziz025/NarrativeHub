import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

async function addUserXpFields() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const connection = neon(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log('Adding XP fields to users table...');

    // Add the new XP fields to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS hearts INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS contributions INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS experience INTEGER NOT NULL DEFAULT 0;
    `);

    console.log('✅ Successfully added XP fields to users table');

    // Optional: Initialize existing users with default values
    await db.execute(`
      UPDATE users 
      SET 
        hearts = COALESCE(hearts, 0),
        contributions = COALESCE(contributions, 0),
        experience = COALESCE(experience, 0)
      WHERE hearts IS NULL OR contributions IS NULL OR experience IS NULL;
    `);

    console.log('✅ Initialized existing users with default XP values');

  } catch (error) {
    console.error('❌ Error adding XP fields:', error);
    process.exit(1);
  }

  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}

addUserXpFields();
