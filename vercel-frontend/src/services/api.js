// vercel-frontend/src/services/api.js - CORRECTED VERSION

const API_URL = import.meta.env.VITE_API_URL || 'https://versal-book-app.onrender.com/api';

console.log('🔧 API_URL configured as:', API_URL);


/**
 * Helper function for API calls
 */
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const options = {
      method,
      headers,
      mode: 'cors',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // ✅ IMPORTANT: Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;

    console.log(`🔄 ${method} ${url}`);
    
    const response = await fetch(url, options);
    
    // Handle empty responses
    const contentType = response.headers.get("content-type");
    let result = {};
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
      result = await response.json();
    }

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, result);
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
    }

    console.log('✅ API Response:', result);
    return result;
  } catch (error) {
    console.error('⚠️ API error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (userData) => {
    const res = await apiCall('/auth/login', 'POST', userData);
    if (res.token) localStorage.setItem('token', res.token);
    return res;
  },
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  getUsers: () => apiCall('/auth/users'),
  logout: () => localStorage.removeItem('token'),
};

// OTP API
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send-otp', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify-otp', 'POST', data),
};

// Donation API
export const donationAPI = {
  create: (donationData) => apiCall('/donations', 'POST', donationData),
  getAll: () => apiCall('/donations', 'GET'),
  like: (id) => apiCall(`/donations/${id}/like`, 'PUT'),
  save: (id) => apiCall(`/donations/${id}/save`, 'PUT'),
  delete: (id) => apiCall(`/donations/${id}`, 'DELETE'),
};

// Review API
export const reviewAPI = {
  create: (reviewData) => apiCall('/reviews', 'POST', reviewData),
  getAll: () => apiCall('/reviews', 'GET'),
  search: (query) => apiCall(`/reviews/search?query=${encodeURIComponent(query)}`, 'GET'),
  delete: (id) => apiCall(`/reviews/${id}`, 'DELETE'),
};

// Recommendation API
export const recommendationAPI = {
  getRecommendations: (keywords) => apiCall('/recommend', 'POST', { keywords }),
};

// Health Check
export const healthCheck = async () => {
  try {
    return await apiCall('/health', 'GET');
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

export default {
  auth: authAPI,
  otp: otpAPI,
  donation: donationAPI,
  review: reviewAPI,
  recommend: recommendationAPI,
  healthCheck,
};