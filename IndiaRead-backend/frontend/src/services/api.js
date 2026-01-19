const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      mode: 'cors', // Add this for CORS
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`📤 API Call: ${method} ${API_URL}${endpoint}`, data);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Log response status
    console.log(`📥 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API Success:', result);
    return result;
    
  } catch (error) {
    console.error('🔥 API Call Failed:', error);
    throw error;
  }
};

// ✅ FIXED: OTP API with correct paths
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send-otp', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify-otp', 'POST', data),
  healthCheck: () => apiCall('/health'),
};

// Auth API
export const authAPI = {
  login: (userData) => apiCall('/auth/login', 'POST', userData),
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  getMe: () => apiCall('/auth/me'),
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
  search: (query) => apiCall(`/reviews/search?query=${query}`),
};

// Recommendation API
export const recommendationAPI = {
  getRecommendations: (keywords) => apiCall('/recommend', 'POST', { keywords }),
};

// Combined export
export default {
  auth: authAPI,
  otp: otpAPI,
  donation: donationAPI,
  review: reviewAPI,
  recommend: recommendationAPI,
};