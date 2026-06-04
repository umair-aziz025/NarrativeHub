import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addStoryFields() {
  console.log('Adding title and description fields to stories table...');
  
  try {
    // Add title and description columns to stories table
    await sql`
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;
    
    console.log('✅ Successfully added title, description, and updated_at columns to stories table');
    
  } catch (error) {
    console.error('❌ Error adding story fields:', error);
    throw error;
  }
}

// Run the migration
addStoryFields()
  .then(() => {
    console.log('🎉 Story fields migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
