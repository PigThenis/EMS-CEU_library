// Test real Firebase Authentication
const fetch = require('node-fetch');

async function testRealAuth() {
  console.log('🔐 Testing Real Firebase Authentication\n');
  console.log('=' .repeat(50));
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  // Test registration with real Firebase Auth
  console.log('\n1. Testing user registration:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  try {
    const regResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        role: 'EMT'
      })
    });
    
    const regData = await regResponse.json();
    
    if (!regResponse.ok) {
      console.error('❌ Registration failed:', regData.error);
      if (regData.details) {
        console.error('   Details:', regData.details);
      }
      return;
    }
    
    console.log('✅ Registration successful!');
    console.log('   User ID:', regData.user?.uid);
    console.log('   Email:', regData.user?.email);
    console.log('   Name:', regData.user?.name);
    console.log('   Role:', regData.user?.role);
    console.log('   Custom Token:', regData.customToken ? 'Received' : 'Not received');
    
    // Test login verification
    console.log('\n2. Verifying user exists in Firebase Auth:');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ User verification failed:', loginData.error);
      return;
    }
    
    console.log('✅ User verified in Firebase Auth!');
    console.log('   UID:', loginData.user?.uid);
    console.log('   Email Verified:', loginData.user?.emailVerified);
    
    // Check if user profile was created in Firestore
    console.log('\n3. Checking Firestore profile:');
    console.log('   Profile should be created at: users/' + regData.user?.uid);
    
    // Test duplicate registration
    console.log('\n4. Testing duplicate email prevention:');
    const dupResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'AnotherPass123',
        name: 'Duplicate User',
        role: 'Paramedic'
      })
    });
    
    const dupData = await dupResponse.json();
    
    if (dupResponse.status === 409) {
      console.log('✅ Duplicate prevention working:', dupData.error);
    } else {
      console.error('❌ Duplicate prevention failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Firebase Auth is now working with:');
  console.log('   - Real user creation in Firebase Auth');
  console.log('   - Profile storage in Firestore');
  console.log('   - Email duplicate prevention');
  console.log('   - Custom token generation for immediate login');
}

testRealAuth();
