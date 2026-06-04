import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testCommentSystem() {
  console.log('Testing comment system...');
  
  try {
    // Get a sample story to test with
    const stories = await sql`SELECT id, title FROM stories LIMIT 1`;
    
    if (stories.length === 0) {
      console.log('No stories found. Create a story first to test comments.');
      return;
    }
    
    const storyId = stories[0].id;
    console.log(`Testing with story: "${stories[0].title}" (${storyId})`);
    
    // Get a sample user
    const users = await sql`SELECT id, username FROM users LIMIT 1`;
    
    if (users.length === 0) {
      console.log('No users found. Cannot test comments without a user.');
      return;
    }
    
    const userId = users[0].id;
    console.log(`Testing with user: ${users[0].username} (${userId})`);
    
    // Create a test comment
    const [testComment] = await sql`
      INSERT INTO comments (story_id, user_id, content)
      VALUES (${storyId}, ${userId}, 'This is a test comment! 🎉')
      RETURNING *
    `;
    
    console.log('✅ Test comment created:', testComment.content);
    
    // Test getting comments for the story
    const comments = await sql`
      SELECT c.*, u.username as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.story_id = ${storyId}
      ORDER BY c.created_at
    `;
    
    console.log(`✅ Found ${comments.length} comment(s) for this story`);
    comments.forEach(comment => {
      console.log(`  - "${comment.content}" by ${comment.author_name}`);
    });
    
    // Update story comment count
    await sql`
      UPDATE stories 
      SET comments = (
        SELECT COUNT(*) FROM comments WHERE story_id = ${storyId}
      )
      WHERE id = ${storyId}
    `;
    
    console.log('✅ Story comment count updated');
    
    // Clean up test comment
    await sql`DELETE FROM comments WHERE id = ${testComment.id}`;
    console.log('🧹 Test comment cleaned up');
    
    console.log('\n🎉 Comment system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing comment system:', error);
  }
}

testCommentSystem();
