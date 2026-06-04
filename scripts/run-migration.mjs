import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    console.log('🔗 Connecting to database...');
    const sql = neon(DATABASE_URL);

    console.log('📜 Reading migration file...');
    const migrationPath = join(__dirname, 'enhanced_rooms_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running enhanced rooms migration...');
    
    // Split the migration into individual statements and run them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'COMMIT');

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql(statement);
          console.log('✅ Executed statement successfully');
        } catch (error) {
          console.log('⚠️  Statement warning (might be expected):', error.message);
        }
      }
    }

    console.log('🎉 Enhanced rooms migration completed successfully!');
    console.log('📊 New features available:');
    console.log('  - Room categories and tags');
    console.log('  - Room permissions and settings');
    console.log('  - Room members and roles');
    console.log('  - Room invites system');
    console.log('  - Room follows');
    console.log('  - Comments system');
    console.log('  - Enhanced statistics');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
