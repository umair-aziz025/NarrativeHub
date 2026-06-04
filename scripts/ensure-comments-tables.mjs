import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function ensureCommentsTable() {
  console.log('Checking and creating comments table if needed...');
  
  try {
    // Drop and recreate comments table to ensure correct schema
    console.log('Dropping existing comments table if it exists...');
    await sql`DROP TABLE IF EXISTS comment_hearts CASCADE`;
    await sql`DROP TABLE IF EXISTS comments CASCADE`;
    
    // Create comments table with correct schema
    await sql`
      CREATE TABLE comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id VARCHAR,
        hearts INTEGER NOT NULL DEFAULT 0,
        is_edited BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create comment_hearts table
    await sql`
      CREATE TABLE comment_hearts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        comment_id VARCHAR NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(comment_id, user_id)
      )
    `;
    
    // Add index for better performance
    await sql`CREATE INDEX idx_comments_story_id ON comments(story_id)`;
    await sql`CREATE INDEX idx_comments_user_id ON comments(user_id)`;
    await sql`CREATE INDEX idx_comment_hearts_comment_id ON comment_hearts(comment_id)`;
    
    console.log('✅ Comments tables created successfully with correct schema');
    
    // Check if tables exist and show sample data
    const commentsCount = await sql`SELECT COUNT(*) as count FROM comments`;
    const commentHeartsCount = await sql`SELECT COUNT(*) as count FROM comment_hearts`;
    
    console.log(`Comments table: ${commentsCount[0].count} comments`);
    console.log(`Comment hearts table: ${commentHeartsCount[0].count} hearts`);
    
  } catch (error) {
    console.error('Error creating comments tables:', error);
  }
}

ensureCommentsTable();
