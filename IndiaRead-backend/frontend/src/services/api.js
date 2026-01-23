// frontend/src/services/api.js - CORRECTED VERSION

const API_URL = 'https://readcrew.onrender.com/api'; // ✅ FIXED!

/**
 * Helper function for API calls
 * Automatically handles JSON stringification and Authorization headers
 */
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // ✅ Automatically add Authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      mode: 'cors', // ✅ ADDED: Explicitly enable CORS
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`🔄 API Call: ${method} ${API_URL}${endpoint}`);
    console.log('📦 Request data:', data);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get("content-type");
    let result = {};
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
      result = await response.json();
    }

    if (!response.ok) {
      // If unauthorized (401), clear the token
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
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (userData) => {
    const res = await apiCall('/auth/login', 'POST', userData);
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    return res;
  },
  register: async (userData) => {
    const res = await apiCall('/auth/register', 'POST', userData);
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    return res;
  },
  getUsers: () => apiCall('/auth/users'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },
};

// OTP API
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify', 'POST', data),
};

// Donation API
export const donationAPI = {
  create: (donationData) => apiCall('/donations', 'POST', donationData),
  getAll: () => apiCall('/donations'),
  like: (id) => apiCall(`/donations/${id}/like`, 'PUT'),
  save: (id) => apiCall(`/donations/${id}/save`, 'PUT'),
};

// Review API
export const reviewAPI = {
  create: (reviewData) => apiCall('/reviews', 'POST', reviewData),
  getAll: () => apiCall('/reviews'),
  search: (query) => apiCall(`/reviews/search?query=${encodeURIComponent(query)}`),
};

// Recommendation API
export const recommendationAPI = {
  getRecommendations: (keywords) => apiCall('/recommend', 'POST', { keywords }),
};

export default {
  auth: authAPI,
  otp: otpAPI,
  donation: donationAPI,
  review: reviewAPI,
  recommend: recommendationAPI,
};