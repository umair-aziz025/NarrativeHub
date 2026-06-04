import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

dotenv.config();

async function ensureContributorRequestsTable() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, using memory storage - no migration needed');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('Creating contributor_requests table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS contributor_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        story_id VARCHAR REFERENCES stories(id) ON DELETE CASCADE,
        message TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        reviewed_by VARCHAR REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('✅ contributor_requests table created successfully');

    // Add index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_contributor_requests_room_id ON contributor_requests(room_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_contributor_requests_user_id ON contributor_requests(user_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_contributor_requests_status ON contributor_requests(status);
    `;
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating contributor_requests table:', error);
    throw error;
  }
}

ensureContributorRequestsTable();
