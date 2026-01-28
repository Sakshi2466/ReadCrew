// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://versal-book-app.onrender.com/api';

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
      credentials: 'omit'
    };

    if (data) options.body = JSON.stringify(data);

    console.log(`🔄 API Call: ${method} ${API_URL}${endpoint}`);
    if (data) console.log('📦 Request data:', data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    console.log(`📡 Full URL: ${API_URL}${endpoint}`);
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
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Cannot connect to server. Check if backend is running.');
    }
    
    throw error;
  }
};

// Donation API
export const donationAPI = {
  create: (donationData) => apiCall('/donations', 'POST', donationData),
  getAll: () => apiCall('/donations'),
  like: (id) => apiCall(`/donations/${id}/like`, 'PUT'),
  save: (id) => apiCall(`/donations/${id}/save`, 'PUT'),
  delete: (id) => apiCall(`/donations/${id}`, 'DELETE'),
};

// Review API
export const reviewAPI = {
  create: (reviewData) => apiCall('/reviews', 'POST', reviewData),
  getAll: () => apiCall('/reviews'),
  search: (query) => apiCall(`/reviews/search?query=${encodeURIComponent(query)}`),
};

// OTP API - CORRECTED based on your backend endpoints
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send-otp', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify-otp', 'POST', data),
};

// Auth API
export const authAPI = {
  login: (data) => apiCall('/auth/login', 'POST', data),
  register: (data) => apiCall('/auth/register', 'POST', data),
  getUsers: () => apiCall('/auth/users'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return Promise.resolve({ success: true });
  },
};

// Test API
export const testAPI = {
  health: () => apiCall('/health', 'GET'),
  test: () => apiCall('/test', 'GET'),
};

// ✅ CORRECTED: Check backend connection function
export const checkBackendConnection = async () => {
  try {
    console.log('🔌 Checking backend connection...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('🌐 Backend connection status:', data);
    return { connected: true, data };
  } catch (error) {
    console.error('🌐 Backend connection failed:', error);
    return { connected: false, error: error.message };
  }
};

// ✅ ADDED: Health check function
export const healthCheck = async () => {
  return checkBackendConnection();
};

// Test all endpoints
export const testAllEndpoints = async () => {
  console.log('🧪 Testing all backend endpoints...');
  
  const endpoints = [
    '/health',
    '/donations',
    '/reviews',
    '/otp/send-otp',
    '/otp/verify-otp'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   Response:`, data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
};

export default { 
  donation: donationAPI, 
  review: reviewAPI,
  auth: authAPI,
  otp: otpAPI,
  test: testAPI,
  checkConnection: checkBackendConnection,
  healthCheck: healthCheck,
  testAll: testAllEndpoints
};