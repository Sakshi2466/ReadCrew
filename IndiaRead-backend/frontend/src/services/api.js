// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Generic API call helper
 */
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers, mode: 'cors' };

    if (data) options.body = JSON.stringify(data);

    console.log(`🔄 API Call: ${method} ${API_URL}${endpoint}`);
    console.log('📦 Request data:', data);

    const response = await fetch(`${API_URL}${endpoint}`, options);

    let result = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    }

    if (!response.ok) {
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

// OTP API
export const otpAPI = {
  sendOTP: (data) => apiCall('/otp/send-otp', 'POST', data),
  verifyOTP: (data) => apiCall('/otp/verify-otp', 'POST', data),
};

// Other APIs unchanged
export const authAPI = {
  login: (data) => apiCall('/auth/login', 'POST', data),
  register: (data) => apiCall('/auth/register', 'POST', data),
  getUsers: () => apiCall('/auth/users'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },
};

export default { otp: otpAPI, auth: authAPI };
