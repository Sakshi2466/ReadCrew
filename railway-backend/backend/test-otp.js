// test-otp.js
const axios = require('axios');

const testOTP = async () => {
  // Use your Render URL for testing
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://readcrew.onrender.com/api' 
    : 'http://localhost:10000/api';
  
  try {
    console.log('🔍 Testing OTP endpoints...');
    console.log('Using base URL:', baseURL);
    
    // 1. Test health endpoint
    try {
      const health = await axios.get(`${baseURL}/health`);
      console.log('✅ Health check:', health.data);
    } catch (healthError) {
      console.log('⚠️ Health endpoint not available:', healthError.message);
    }
    
    // 2. Test OTP send with valid data
    const otpData = {
      email: 'test@example.com',
      phone: '9876543210', // Valid Indian number
      name: 'Test User'
    };
    
    console.log('📤 Sending OTP:', otpData);
    const otpResponse = await axios.post(`${baseURL}/otp/send-otp`, otpData);
    console.log('✅ OTP Response:');
    console.log('- Success:', otpResponse.data.success);
    console.log('- Message:', otpResponse.data.message);
    
    if (otpResponse.data.otp) {
      console.log('- OTP (development):', otpResponse.data.otp);
    }
    
    if (otpResponse.data.debug && otpResponse.data.debug.otp) {
      console.log('- Debug OTP:', otpResponse.data.debug.otp);
    }
    
    // 3. Test OTP verify (if we have OTP)
    if (otpResponse.data.otp || (otpResponse.data.debug && otpResponse.data.debug.otp)) {
      const verifyOtp = otpResponse.data.otp || otpResponse.data.debug.otp;
      
      console.log('\n🔍 Verifying OTP:', verifyOtp);
      const verifyData = {
        email: 'test@example.com',
        otp: verifyOtp
      };
      
      try {
        const verifyResponse = await axios.post(`${baseURL}/otp/verify-otp`, verifyData);
        console.log('✅ Verify Response:', verifyResponse.data);
      } catch (verifyError) {
        console.log('❌ Verify failed:', verifyError.response?.data || verifyError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
      console.error('- Headers:', error.response.headers);
    } else if (error.request) {
      console.error('- No response received:', error.request);
    } else {
      console.error('- Error:', error.message);
    }
    
    console.error('- Config:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testOTP();
}

module.exports = testOTP;