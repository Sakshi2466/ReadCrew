// test-otp.js
const axios = require('axios');

// ==========================
// CONFIGURATION - MATCHING FRONTEND
// ==========================
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://versal-book-app.onrender.com' // Your Render URL (WITH /api)
  : 'http://localhost:5000/api';        // Local backend (WITH /api)

// ==========================
// TEST OTP FUNCTION (MATCHING App.jsx)
// ==========================
const testOTP = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING OTP ENDPOINTS (MATCHING FRONTEND)');
    console.log('='.repeat(60));
    console.log('📍 Base URL:', baseURL);
    console.log('📱 Frontend Calls: /api/otp/send and /api/otp/verify');
    console.log('⏰ Test started:', new Date().toLocaleString());
    console.log('='.repeat(60) + '\n');

    // -------- TEST 1: Check if backend is reachable --------
    console.log('📊 TEST 1: Backend Connection');
    console.log('-'.repeat(60));
    try {
      // Try hitting a simple endpoint
      await axios.get(baseURL.replace('/api', '') + '/health');
      console.log('✅ Backend is reachable');
    } catch (error) {
      console.log('⚠️ Could not reach backend directly');
    }

    // Try the test endpoint if exists
    try {
      const test = await axios.get(`${baseURL}/test`);
      console.log('✅ Test endpoint response:', test.data.message);
    } catch (testError) {
      console.log('ℹ️ /api/test endpoint not available');
    }
    console.log('');

    // -------- TEST 2: Send OTP (EXACT SAME AS FRONTEND) --------
    console.log('📤 TEST 2: Send OTP (Matching Frontend Request)');
    console.log('-'.repeat(60));

    const testEmail = `test${Date.now()}@example.com`; // Unique test email
    
    // EXACT SAME DATA STRUCTURE AS FRONTEND App.jsx
    const otpData = {
      email: testEmail,
      phone: '9876543210', // Same as frontend placeholder
      name: 'Test User'
    };

    console.log('📝 Request Data (matching frontend):');
    console.log(JSON.stringify(otpData, null, 2));
    console.log('\n📡 Making POST request to:', `${baseURL}/otp/send`);

    try {
      // IMPORTANT: Use EXACT same endpoint as frontend
      const otpResponse = await axios.post(`${baseURL}/otp/send`, otpData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('\n✅ OTP SEND RESPONSE:');
      console.log('- Status:', otpResponse.status);
      console.log('- Success:', otpResponse.data.success);
      console.log('- Message:', otpResponse.data.message);
      console.log('- Response Data:', JSON.stringify(otpResponse.data, null, 2));

      // Check for OTP in response (for dev mode)
      let receivedOTP = null;
      if (otpResponse.data.otp) {
        console.log('\n🔐 OTP Received (dev mode):', otpResponse.data.otp);
        receivedOTP = otpResponse.data.otp;
      }

      // If no OTP in response, we might need to check database
      if (!receivedOTP) {
        console.log('\n⚠️ No OTP in response. This could mean:');
        console.log('1. Email was sent (check inbox/spam)');
        console.log('2. OTP is stored in database');
        console.log('3. NODE_ENV=production so OTP not shown');
        
        // Try to fetch from database if you have direct access
        console.log('\n💡 For testing, you can:');
        console.log('1. Check your email inbox');
        console.log('2. Check MongoDB database for user document');
        console.log('3. Set NODE_ENV=development to see OTP in response');
      }

      console.log('');

      // -------- TEST 3: Verify OTP (IF WE GOT OTP) --------
      if (receivedOTP) {
        console.log('🔐 TEST 3: Verify OTP (Matching Frontend)');
        console.log('-'.repeat(60));

        // EXACT SAME DATA STRUCTURE AS FRONTEND
        const verifyData = {
          email: testEmail,
          otp: receivedOTP
        };

        console.log('📝 Verify Request Data:');
        console.log(JSON.stringify(verifyData, null, 2));
        console.log('\n📡 Making POST request to:', `${baseURL}/otp/verify`);

        const verifyResponse = await axios.post(`${baseURL}/otp/verify`, verifyData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('\n✅ OTP VERIFY RESPONSE:');
        console.log('- Status:', verifyResponse.status);
        console.log('- Success:', verifyResponse.data.success);
        console.log('- Message:', verifyResponse.data.message);

        if (verifyResponse.data.user) {
          console.log('\n👤 USER CREATED/VERIFIED:');
          console.log('- ID:', verifyResponse.data.user.id || verifyResponse.data.user._id);
          console.log('- Name:', verifyResponse.data.user.name);
          console.log('- Email:', verifyResponse.data.user.email);
          console.log('- Phone:', verifyResponse.data.user.phone);
          console.log('- Verified:', verifyResponse.data.user.isVerified);
          console.log('- Has Reading Goal:', !!verifyResponse.data.user.readingGoal);
        }
      } else {
        console.log('⚠️ TEST 3: Skipping OTP verification (no OTP received)');
        console.log('   For manual testing:');
        console.log(`   1. Check email: ${testEmail}`);
        console.log('   2. Use the OTP to verify manually');
        console.log('   3. Or check MongoDB for stored OTP');
      }

    } catch (sendError) {
      console.log('\n❌ OTP SEND FAILED:');
      
      if (sendError.response) {
        console.log('- Status:', sendError.response.status);
        console.log('- Status Text:', sendError.response.statusText);
        console.log('- Headers:', JSON.stringify(sendError.response.headers, null, 2));
        console.log('- Data:', JSON.stringify(sendError.response.data, null, 2));
        
        console.log('\n🔧 DEBUGGING TIPS:');
        console.log('1. Check if route exists: GET ' + baseURL + '/otp/send');
        console.log('2. Check backend console for errors');
        console.log('3. Verify CORS is configured');
        console.log('4. Check if email service is configured');
      } else if (sendError.request) {
        console.log('- No response received');
        console.log('- Request URL:', sendError.config?.url);
        console.log('- Request Method:', sendError.config?.method);
        console.log('- Request Data:', sendError.config?.data);
        
        console.log('\n🔧 DEBUGGING TIPS:');
        console.log('1. Is backend running?');
        console.log('2. Check network connection');
        console.log('3. Verify baseURL:', baseURL);
      } else {
        console.log('- Error:', sendError.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY OF FRONTEND-BACKEND MATCH');
    console.log('='.repeat(60));
    console.log('✅ Frontend calls:', `${baseURL}/otp/send`);
    console.log('✅ Backend should have:', 'POST /api/otp/send');
    console.log('✅ Frontend calls:', `${baseURL}/otp/verify`);
    console.log('✅ Backend should have:', 'POST /api/otp/verify');
    console.log('✅ Test email used:', testEmail);
    console.log('='.repeat(60));
    console.log('💡 NEXT STEPS:');
    console.log('1. Check if routes match exactly');
    console.log('2. Verify CORS settings on backend');
    console.log('3. Check backend logs for errors');
    console.log('4. Test with Postman/curl:');
    console.log(`   curl -X POST ${baseURL}/otp/send \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log(`     -d '{"email":"${testEmail}","phone":"9876543210","name":"Test"}'`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ OVERALL TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
};

// ==========================
// ADDITIONAL TEST: DIRECT ROUTE CHECK
// ==========================
const testRoutesDirectly = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIRECT ROUTE TESTING');
  console.log('='.repeat(60));

  const routesToTest = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/test' },
    { method: 'POST', path: '/api/otp/send' },
    { method: 'POST', path: '/api/otp/verify' },
    // Also test without /api prefix (common mistake)
    { method: 'POST', path: '/otp/send' },
    { method: 'POST', path: '/otp/verify' }
  ];

  for (const route of routesToTest) {
    try {
      const url = `${baseURL.replace('/api', '')}${route.path}`;
      console.log(`\n🔎 Testing: ${route.method} ${url}`);
      
      if (route.method === 'GET') {
        const response = await axios.get(url, { timeout: 5000 });
        console.log(`✅ ${route.method} ${route.path}: ${response.status}`);
        if (response.data) console.log('   Response:', response.data);
      } else {
        // For POST, just check if endpoint exists (not 404)
        try {
          const response = await axios.post(url, {}, { timeout: 5000 });
          console.log(`✅ ${route.method} ${route.path}: ${response.status}`);
        } catch (postError) {
          if (postError.response && postError.response.status !== 404) {
            console.log(`✅ ${route.method} ${route.path}: Exists (${postError.response.status})`);
          } else {
            console.log(`❌ ${route.method} ${route.path}: Not found (404)`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${route.method} ${route.path}: ${error.message}`);
    }
  }
};

// Run all tests
const runAllTests = async () => {
  await testOTP();
  await testRoutesDirectly();
};

// Run test if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testOTP, testRoutesDirectly, runAllTests };