// frontend/src/services/api.js

const API_URL = 'https://readcrew.onrender.com/api'; // ✅ Your deployed backend

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`🔄 API Call: ${method} ${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }

    console.log('✅ API Response:', result);
    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (userData) => apiCall('/auth/login', 'POST', userData),
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  getUsers: () => apiCall('/auth/users'),
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