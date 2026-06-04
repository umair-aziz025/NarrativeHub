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

async function checkUserTableSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const connection = neon(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log('Checking users table schema...');

    // Get column info for users table
    const result = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Users table columns:');
    console.log('========================');
    result.rows.forEach(row => {
      console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || 'no default'}`);
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkUserTableSchema();
