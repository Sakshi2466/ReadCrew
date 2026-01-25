// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://readcrew.onrender.com/api';

/**
 * Generic API call helper
 */
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json' 
    };

    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { 
      method, 
      headers, 
      mode: 'cors',
      credentials: 'omit' // Changed from 'include' to 'omit' for Render
    };

    if (data) options.body = JSON.stringify(data);

    console.log(`🔄 API Call: ${method} ${API_URL}${endpoint}`);
    if (data) console.log('📦 Request data:', data);

    const response = await fetch(`${API_URL}${endpoint}`, options);

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    let result = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    }

    if (!response.ok) {
      console.error('❌ API Error Response:', result);
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
    }

    console.log('✅ API Response:', result);
    return result;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Enhanced error messages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Cannot connect to server. Check if backend is running.');
    }
    
    throw error;
  }
};

// OTP API - CORRECTED ENDPOINTS
export const otpAPI = {
  sendOTP: (data) => {
    console.log('📤 Sending OTP to:', data.email);
    return apiCall('/otp/send', 'POST', data);
  },
  verifyOTP: (data) => {
    console.log('🔐 Verifying OTP for:', data.email);
    return apiCall('/otp/verify', 'POST', data);
  },
  
  // Alternative endpoints if needed
  sendOTPAlt: (data) => apiCall('/send-otp', 'POST', data),
  verifyOTPAlt: (data) => apiCall('/verify-otp', 'POST', data),
  
  // Direct endpoints without /api prefix
  sendOTPDirect: (data) => apiCall('/send', 'POST', data, true),
  verifyOTPDirect: (data) => apiCall('/verify', 'POST', data, true)
};

// Auth API
export const authAPI = {
  login: (data) => apiCall('/auth/login', 'POST', data),
  register: (data) => apiCall('/auth/register', 'POST', data),
  getUsers: () => apiCall('/auth/users'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },
};

// Test connection
export const testAPI = {
  health: () => apiCall('/health', 'GET'),
  test: () => apiCall('/test', 'GET'),
  testEndpoint: (endpoint) => apiCall(endpoint, 'GET')
};

// Helper to test all endpoints
export const testAllEndpoints = async () => {
  const endpoints = [
    '/health',
    '/test',
    '/otp/send',
    '/otp/verify',
    '/send-otp',
    '/verify-otp',
    '/api/otp/send',
    '/api/otp/verify'
  ];
  
  console.log('🧪 Testing all endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
};

export default { 
  otp: otpAPI, 
  auth: authAPI, 
  test: testAPI,
  testAll: testAllEndpoints 
};