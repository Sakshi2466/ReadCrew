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
      credentials: 'omit'
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
    } else {
      const text = await response.text();
      console.log('📝 Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
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
  getById: (id) => apiCall(`/donations/${id}`),
  delete: (id) => apiCall(`/donations/${id}`, 'DELETE'),
};

// Review API
export const reviewAPI = {
  create: (reviewData) => apiCall('/reviews', 'POST', reviewData),
  getAll: () => apiCall('/reviews'),
  search: (query) => apiCall(`/reviews/search?query=${encodeURIComponent(query)}`),
  getById: (id) => apiCall(`/reviews/${id}`),
  delete: (id) => apiCall(`/reviews/${id}`, 'DELETE'),
};

// User/Auth API
export const authAPI = {
  login: (data) => apiCall('/auth/login', 'POST', data),
  register: (data) => apiCall('/auth/register', 'POST', data),
  getUsers: () => apiCall('/auth/users'),
  getCurrentUser: () => apiCall('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return Promise.resolve({ success: true });
  },
};

// OTP API
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify', 'POST', data),
};

// Test API
export const testAPI = {
  health: () => apiCall('/health', 'GET'),
  test: () => apiCall('/test', 'GET'),
};

// Check backend connection
export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('🌐 Backend connection status:', data);
    return { connected: true, data };
  } catch (error) {
    console.error('🌐 Backend connection failed:', error);
    return { connected: false, error: error.message };
  }
};

export default { 
  donation: donationAPI, 
  review: reviewAPI,
  auth: authAPI,
  otp: otpAPI,
  test: testAPI,
  checkConnection: checkBackendConnection
};