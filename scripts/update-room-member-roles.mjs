import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

dotenv.config();

async function updateRoomMemberRoles() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, using memory storage - no migration needed');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('Updating room member roles...');
    
    // First, let's see what roles exist currently
    const currentRoles = await sql`
      SELECT DISTINCT role, COUNT(*) as count 
      FROM room_members 
      GROUP BY role
    `;
    console.log('Current roles in database:', currentRoles);

    // Update default "member" role to "viewer" for non-creators
    const membersUpdated = await sql`
      UPDATE room_members 
      SET role = 'viewer' 
      WHERE role = 'member'
    `;
    console.log('✅ Updated members with "member" role to "viewer":', membersUpdated.length);

    // Check if we have any room creators and update them
    const creatorUpdates = await sql`
      UPDATE room_members 
      SET role = 'creator' 
      WHERE user_id IN (
        SELECT creator_id 
        FROM rooms 
        WHERE creator_id = room_members.user_id 
        AND room_id = rooms.id
      )
      AND role != 'creator'
    `;
    console.log('✅ Updated room creators:', creatorUpdates.length);

    // Show final state
    const finalRoles = await sql`
      SELECT DISTINCT role, COUNT(*) as count 
      FROM room_members 
      GROUP BY role
    `;
    console.log('Final roles in database:', finalRoles);
    
  } catch (error) {
    console.error('❌ Error updating room member roles:', error);
    throw error;
  }
}

updateRoomMemberRoles();
