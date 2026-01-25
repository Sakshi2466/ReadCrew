// backend/test-otp.js
const axios = require('axios');

const testOTP = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔍 Testing OTP endpoints...');
    
    // 1. Test health endpoint
    try {
      const health = await axios.get(`${baseURL}/health`);
      console.log('✅ Health check:', health.data);
    } catch (healthError) {
      console.log('⚠️ Health endpoint not available');
    }
    
    // 2. Test OTP send
    const otpData = {
      email: 'test@example.com',
      phone: '9876543210',
      name: 'Test User'
    };
    
    console.log('📤 Sending OTP:', otpData);
    const otpResponse = await axios.post(`${baseURL}/otp/send-otp`, otpData);
    console.log('✅ OTP Response:', otpResponse.data);
    
    // 3. Test OTP verify (if we have OTP)
    if (otpResponse.data.otp) {
      console.log('🔍 Verifying OTP...');
      const verifyData = {
        email: 'test@example.com',
        otp: otpResponse.data.otp
      };
      const verifyResponse = await axios.post(`${baseURL}/otp/verify-otp`, verifyData);
      console.log('✅ Verify Response:', verifyResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

testOTP();