import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function updateStoryTitles() {
  console.log('Updating stories with null titles...');
  
  try {
    // Get stories with null titles
    const storiesWithoutTitles = await sql`
      SELECT id, content, chain_id 
      FROM stories 
      WHERE title IS NULL OR title = ''
    `;
    
    console.log(`Found ${storiesWithoutTitles.length} stories without titles`);
    
    // Update each story with a generated title
    for (const story of storiesWithoutTitles) {
      // Generate a title from the first 50 characters of content
      let generatedTitle = story.content.substring(0, 50).trim();
      if (generatedTitle.length < story.content.length) {
        generatedTitle += '...';
      }
      
      // If content is very short, use a fallback
      if (generatedTitle.length < 10) {
        generatedTitle = `Story from Chain #${story.chain_id}`;
      }
      
      await sql`
        UPDATE stories 
        SET title = ${generatedTitle}
        WHERE id = ${story.id}
      `;
      
      console.log(`Updated story ${story.id}: "${generatedTitle}"`);
    }
    
    console.log('✅ All story titles updated successfully');
    
    // Verify the update
    const updatedStories = await sql`
      SELECT id, title, content
      FROM stories 
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('\nSample updated stories:');
    updatedStories.forEach(story => {
      console.log(`- ${story.title} (ID: ${story.id})`);
    });
    
  } catch (error) {
    console.error('Error updating story titles:', error);
  }
}

updateStoryTitles();
