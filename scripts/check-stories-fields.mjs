import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkAndAddStoriesFields() {
  try {
    console.log('Checking if title and description columns exist in stories table...');
    
    // Check if title column exists
    const titleCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stories' AND column_name = 'title'
    `;
    
    // Check if description column exists  
    const descCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stories' AND column_name = 'description'
    `;
    
    console.log('Title column exists:', titleCheck.length > 0);
    console.log('Description column exists:', descCheck.length > 0);
    
    // Add title column if it doesn't exist
    if (titleCheck.length === 0) {
      console.log('Adding title column...');
      await sql`ALTER TABLE stories ADD COLUMN title TEXT`;
      console.log('✅ Title column added');
    }
    
    // Add description column if it doesn't exist  
    if (descCheck.length === 0) {
      console.log('Adding description column...');
      await sql`ALTER TABLE stories ADD COLUMN description TEXT`;
      console.log('✅ Description column added');
    }
    
    if (titleCheck.length > 0 && descCheck.length > 0) {
      console.log('✅ Both columns already exist');
    }
    
    // Test a simple query to see current structure
    console.log('\nTesting stories table structure...');
    const sampleStory = await sql`
      SELECT id, title, description, content, author_name 
      FROM stories 
      LIMIT 1
    `;
    console.log('Sample story:', sampleStory[0] || 'No stories found');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndAddStoriesFields();
