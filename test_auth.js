// Test Firebase Authentication
const fetch = require('node-fetch');

async function testAuth() {
  console.log('Testing Firebase Authentication...\n');
  
  // Test registration via frontend API
  console.log('1. Testing registration via frontend API:');
  try {
    const regResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'EMT'
      })
    });
    const regData = await regResponse.json();
    console.log('Registration response:', regData);
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
  
  // Test auth emulator directly
  console.log('\n2. Testing auth emulator directly:');
  try {
    const emulatorResponse = await fetch('http://localhost:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emulator@test.com',
        password: 'test123',
        returnSecureToken: true
      })
    });
    const emulatorData = await emulatorResponse.json();
    console.log('Emulator response:', {
      email: emulatorData.email,
      idToken: emulatorData.idToken ? 'Token received' : 'No token',
      localId: emulatorData.localId
    });
  } catch (error) {
    console.error('Emulator test failed:', error.message);
  }
  
  // Check Firestore connection
  console.log('\n3. Testing Firestore via frontend API:');
  try {
    const eventsResponse = await fetch('http://localhost:3000/api/events');
    const eventsData = await eventsResponse.json();
    console.log(`Firestore events: ${eventsData.events?.length || 0} events found`);
  } catch (error) {
    console.error('Firestore test failed:', error.message);
  }
}

testAuth();
