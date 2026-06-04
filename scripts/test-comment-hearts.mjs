#!/usr/bin/env node
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { stories, comments, commentHearts, users } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function testCommentHearts() {
  console.log('Testing comment heart system...');
  
  try {
    // Find a test story
    const testStories = await db.select().from(stories).limit(1);
    if (testStories.length === 0) {
      console.log('❌ No stories found for testing');
      return;
    }
    
    const testStory = testStories[0];
    console.log(`Testing with story: "${testStory.content.slice(0, 20)}..." (${testStory.id})`);
    
    // Find a test user
    const testUsers = await db.select().from(users).limit(1);
    if (testUsers.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }
    
    const testUser = testUsers[0];
    console.log(`Testing with user: ${testUser.username} (${testUser.id})`);
    
    // Create a test comment
    const [testComment] = await db.insert(comments).values({
      storyId: testStory.id,
      userId: testUser.id,
      content: 'This is a test comment for heart testing! ❤️'
    }).returning();
    
    console.log('✅ Test comment created:', testComment.content);
    
    // Test initial state (no hearts)
    let commentResult = await db
      .select()
      .from(comments)
      .where(eq(comments.id, testComment.id));
    
    let heartResult = await db
      .select()
      .from(commentHearts)
      .where(and(
        eq(commentHearts.commentId, testComment.id),
        eq(commentHearts.userId, testUser.id)
      ));
    
    console.log('✅ Initial state:', {
      hearts: commentResult[0].hearts,
      isHearted: heartResult.length > 0
    });
    
    // Heart the comment
    await db.insert(commentHearts).values({
      commentId: testComment.id,
      userId: testUser.id
    });
    
    // Update the comment heart count
    await db.update(comments)
      .set({ hearts: commentResult[0].hearts + 1 })
      .where(eq(comments.id, testComment.id));
    
    console.log('✅ Comment hearted');
    
    // Test hearted state
    commentResult = await db
      .select()
      .from(comments)
      .where(eq(comments.id, testComment.id));
    
    heartResult = await db
      .select()
      .from(commentHearts)
      .where(and(
        eq(commentHearts.commentId, testComment.id),
        eq(commentHearts.userId, testUser.id)
      ));
    
    console.log('✅ Hearted state:', {
      hearts: commentResult[0].hearts,
      isHearted: heartResult.length > 0
    });
    
    // Unheart the comment
    await db.delete(commentHearts)
      .where(and(
        eq(commentHearts.commentId, testComment.id),
        eq(commentHearts.userId, testUser.id)
      ));
    
    // Update the comment heart count
    await db.update(comments)
      .set({ hearts: commentResult[0].hearts - 1 })
      .where(eq(comments.id, testComment.id));
    
    console.log('✅ Comment unhearted');
    
    // Test unhearted state
    commentResult = await db
      .select()
      .from(comments)
      .where(eq(comments.id, testComment.id));
    
    heartResult = await db
      .select()
      .from(commentHearts)
      .where(and(
        eq(commentHearts.commentId, testComment.id),
        eq(commentHearts.userId, testUser.id)
      ));
    
    console.log('✅ Unhearted state:', {
      hearts: commentResult[0].hearts,
      isHearted: heartResult.length > 0
    });
    
    // Clean up
    await db.delete(comments).where(eq(comments.id, testComment.id));
    console.log('🧹 Test comment cleaned up');
    
    console.log('\n🎉 Comment heart system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCommentHearts();
