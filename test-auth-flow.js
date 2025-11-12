/**
 * Test script for authentication flow
 * Run with: node test-auth-flow.js
 */

const testEmail = `test${Date.now()}@example.com`;
const testPassword = 'TestPass123!';
const testName = 'Test User';

console.log('Testing Authentication Flow');
console.log('===========================');
console.log(`Test Email: ${testEmail}`);
console.log(`Test Password: ${testPassword}`);
console.log('');

async function testSignup() {
  console.log('1. Testing Signup...');

  try {
    const response = await fetch('http://localhost:3050/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Signup successful!');
      console.log('   Response:', JSON.stringify(data, null, 2));

      if (data.requiresMagicLink) {
        console.log('   ⚠️  User needs to use magic link to sign in');
        console.log('   📧 Since email confirmations are not working, user should request a magic link');
      } else {
        console.log('   ✨ User was automatically signed in!');
      }
    } else {
      console.log('❌ Signup failed!');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Signup request failed!');
    console.log('   Error:', error.message);
  }
}

async function testLogin() {
  console.log('\n2. Testing Direct Login (will fail if email confirmation is required)...');

  // Note: This test would require a browser environment to work with Supabase client
  console.log('   ⚠️  Direct login test requires browser environment');
  console.log('   Please test manually in the browser at http://localhost:3050/auth/login');
}

// Run tests
(async () => {
  await testSignup();
  await testLogin();

  console.log('\n===========================');
  console.log('Test Summary:');
  console.log('1. Open http://localhost:3050/auth/signup in your browser');
  console.log('2. Try creating a new account');
  console.log('3. If email confirmations are disabled in Supabase, you\'ll be logged in immediately');
  console.log('4. If email confirmations are required, you\'ll be guided to use magic links');
  console.log('5. Magic links work but must be opened in the same browser that requested them');
})();