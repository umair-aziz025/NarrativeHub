// Use built-in fetch API (Node.js 18+)

const API_BASE = 'http://localhost:3000/api';

// Test admin credentials (from previous tests)
const adminAuth = {
  username: 'admin',
  password: 'admin123'
};

let adminToken = '';
let testRoomId = '';

async function testMemberManagement() {
  try {
    console.log('🔑 Logging in as admin...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminAuth)
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    console.log('✅ Admin login successful');

    // Get rooms to find a test room
    console.log('\n📂 Getting public rooms...');
    const roomsRes = await fetch(`${API_BASE}/rooms/public`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (!roomsRes.ok) {
      throw new Error(`Failed to get rooms: ${roomsRes.status}`);
    }
    
    const rooms = await roomsRes.json();
    if (rooms.length === 0) {
      console.log('❌ No rooms found for testing');
      return;
    }
    
    testRoomId = rooms[0].id;
    console.log(`✅ Found test room: ${testRoomId}`);

    // Test getting room members
    console.log('\n👥 Getting room members...');
    const membersRes = await fetch(`${API_BASE}/rooms/${testRoomId}/members`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (!membersRes.ok) {
      throw new Error(`Failed to get members: ${membersRes.status}`);
    }
    
    const members = await membersRes.json();
    console.log(`✅ Found ${members.length} members:`, members.map(m => ({ username: m.username, role: m.role, status: m.status })));

    if (members.length > 1) {
      // Test updating a member's role (if there are multiple members)
      const targetMember = members.find(m => m.role !== 'creator');
      
      if (targetMember) {
        console.log(`\n🔄 Testing role update for member: ${targetMember.username}`);
        const updateRes = await fetch(`${API_BASE}/rooms/${testRoomId}/members/${targetMember.id}/role`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'moderator' })
        });
        
        if (!updateRes.ok) {
          console.log(`❌ Role update failed: ${updateRes.status}`);
          const errorText = await updateRes.text();
          console.log('Error:', errorText);
        } else {
          console.log('✅ Role update successful');
        }

        // Test suspending a member
        console.log(`\n⏸️ Testing member suspension for: ${targetMember.username}`);
        const suspendRes = await fetch(`${API_BASE}/rooms/${testRoomId}/members/${targetMember.id}/suspend`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'Test suspension' })
        });
        
        if (!suspendRes.ok) {
          console.log(`❌ Suspension failed: ${suspendRes.status}`);
          const errorText = await suspendRes.text();
          console.log('Error:', errorText);
        } else {
          console.log('✅ Suspension successful');
        }
      } else {
        console.log('⚠️ No non-creator members found for testing role updates');
      }
    } else {
      console.log('⚠️ Only one member found, skipping role update tests');
    }

    console.log('\n🎉 Member management tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMemberManagement();
