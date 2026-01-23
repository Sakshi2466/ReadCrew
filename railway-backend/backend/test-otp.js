// test-otp.js - CORRECTED VERSION
const axios = require('axios');

const testOTP = async () => {
  // ✅ CORRECTED: Use your actual Render URL
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://readcrew.onrender.com/api' 
    : 'http://localhost:10000/api';
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING OTP ENDPOINTS');
    console.log('='.repeat(60));
    console.log('📍 Base URL:', baseURL);
    console.log('⏰ Test started:', new Date().toLocaleString());
    console.log('='.repeat(60) + '\n');
    
    // ========== TEST 1: Health Check ==========
    console.log('📊 TEST 1: Health Check');
    console.log('-'.repeat(60));
    try {
      const health = await axios.get(`${baseURL}/health`);
      console.log('✅ Health Status:', health.data.status);
      console.log('✅ Database:', health.data.database);
      console.log('✅ Email Config:', health.data.emailConfigured);
    } catch (healthError) {
      console.log('⚠️  Health endpoint error:', healthError.message);
    }
    console.log('');
    
    // ========== TEST 2: Send OTP ==========
    console.log('📤 TEST 2: Send OTP');
    console.log('-'.repeat(60));
    
    const testEmail = `test${Date.now()}@example.com`; // Unique email
    const otpData = {
      email: testEmail,
      phone: '9876543210', // Valid Indian number
      name: 'Test User'
    };
    
    console.log('📝 Request Data:', JSON.stringify(otpData, null, 2));
    
    // ✅ CORRECTED: Use /otp/send (not /otp/send-otp)
    const otpResponse = await axios.post(`${baseURL}/otp/send`, otpData);
    
    console.log('\n✅ OTP SEND RESPONSE:');
    console.log('- Success:', otpResponse.data.success);
    console.log('- Message:', otpResponse.data.message);
    
    // Check for OTP in response (development mode)
    let receivedOTP = null;
    
    if (otpResponse.data.otp) {
      console.log('- OTP (dev mode):', otpResponse.data.otp);
      receivedOTP = otpResponse.data.otp;
    }
    
    if (otpResponse.data.debug?.otp) {
      console.log('- Debug OTP:', otpResponse.data.debug.otp);
      receivedOTP = otpResponse.data.debug.otp;
    }
    
    if (otpResponse.data.password) {
      console.log('- Password (dev mode):', otpResponse.data.password);
    }
    
    console.log('');
    
    // ========== TEST 3: Verify OTP ==========
    if (receivedOTP) {
      console.log('🔐 TEST 3: Verify OTP');
      console.log('-'.repeat(60));
      
      const verifyData = {
        email: testEmail,
        otp: receivedOTP
      };
      
      console.log('📝 Verify Request:', JSON.stringify(verifyData, null, 2));
      
      try {
        // ✅ CORRECTED: Use /otp/verify (not /otp/verify-otp)
        const verifyResponse = await axios.post(`${baseURL}/otp/verify`, verifyData);
        
        console.log('\n✅ OTP VERIFY RESPONSE:');
        console.log('- Success:', verifyResponse.data.success);
        console.log('- Message:', verifyResponse.data.message);
        
        if (verifyResponse.data.user) {
          console.log('- User Created:', {
            id: verifyResponse.data.user._id,
            name: verifyResponse.data.user.name,
            email: verifyResponse.data.user.email,
            verified: verifyResponse.data.user.isVerified
          });
        }
        
      } catch (verifyError) {
        console.log('\n❌ VERIFY FAILED:');
        if (verifyError.response) {
          console.log('- Status:', verifyError.response.status);
          console.log('- Error:', verifyError.response.data);
        } else {
          console.log('- Error:', verifyError.message);
        }
      }
    } else {
      console.log('⚠️  TEST 3: Skipped (OTP not returned in response)');
      console.log('   This is normal in production mode.');
      console.log('   Check your email for the OTP and verify manually.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('\n📛 Response Error:');
      console.error('- Status:', error.response.status);
      console.error('- Status Text:', error.response.statusText);
      console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      console.error('- Headers:', error.response.headers);
    } else if (error.request) {
      console.error('\n📛 Request Error (No Response):');
      console.error('- Request made but no response received');
      console.error('- Check if backend is running');
      console.error('- URL:', error.config?.url);
    } else {
      console.error('\n📛 Error:', error.message);
    }
    
    if (error.config) {
      console.error('\n📝 Request Config:');
      console.error('- URL:', error.config.url);
      console.error('- Method:', error.config.method);
      console.error('- Data:', error.config.data);
    }
    
    console.error('\n' + '='.repeat(60) + '\n');
    process.exit(1);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testOTP();
}

module.exports = testOTP;