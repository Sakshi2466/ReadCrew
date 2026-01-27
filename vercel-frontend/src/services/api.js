// frontend/src/services/api.js

// ✅ Backend base URL
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://versal-book-app.onrender.com/api";

/**
 * ✅ Safe API call helper
 * - Never crashes UI
 * - Always returns predictable output
 */
const apiCall = async (endpoint, method = "GET", data = null) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    mode: "cors",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`🔄 ${method} ${API_URL}${endpoint}`);
    if (data) console.log("📦 Payload:", data);

    const response = await fetch(`${API_URL}${endpoint}`, options);

    let result = null;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text);
      return {
        success: false,
        message: "Server returned invalid response",
        status: response.status,
      };
    }

    if (!response.ok) {
      console.warn("⚠️ API error:", result);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
      }

      return {
        success: false,
        message: result?.message || "Request failed",
        status: response.status,
      };
    }

    console.log("✅ API success:", result);
    return { success: true, data: result };

  } catch (error) {
    console.error("❌ Network/API error:", error);

    return {
      success: false,
      message:
        error.message === "Failed to fetch"
          ? "Cannot connect to server"
          : error.message,
    };
  }
};


// =======================
// 📚 DONATION API
// =======================
export const donationAPI = {
  create: (data) => apiCall("/donations", "POST", data),
  getAll: () => apiCall("/donations"),
  getById: (id) => apiCall(`/donations/${id}`),
  like: (id) => apiCall(`/donations/${id}/like`, "PUT"),
  save: (id) => apiCall(`/donations/${id}/save`, "PUT"),
  delete: (id) => apiCall(`/donations/${id}`, "DELETE"),
};


// =======================
// 📝 REVIEW / STORY API
// =======================
export const reviewAPI = {
  create: (data) => apiCall("/reviews", "POST", data),
  getAll: () => apiCall("/reviews"),          // ✅ PUBLIC
  getById: (id) => apiCall(`/reviews/${id}`),
  search: (query) =>
    apiCall(`/reviews/search?query=${encodeURIComponent(query)}`),
  delete: (id) => apiCall(`/reviews/${id}`, "DELETE"),
};


// =======================
// 👤 AUTH / USER API
// =======================
export const authAPI = {
  login: (data) => apiCall("/auth/login", "POST", data),
  register: (data) => apiCall("/auth/register", "POST", data),
  getCurrentUser: () => apiCall("/auth/me"),
  getUsers: () => apiCall("/auth/users"),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    return Promise.resolve({ success: true });
  },
};


// =======================
// 🔐 OTP API
// =======================
export const otpAPI = {
  sendOTP: (data) => apiCall("/otp/send", "POST", data),
  verifyOTP: (data) => apiCall("/otp/verify", "POST", data),
};


// =======================
// 🧪 HEALTH / TEST API
// =======================
export const testAPI = {
  health: () => apiCall("/health"),
  test: () => apiCall("/test"),
};


// =======================
// 🌐 BACKEND CHECK
// =======================
export const checkBackendConnection = async () => {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    console.log("🌐 Backend OK:", data);
    return { connected: true };
  } catch (err) {
    console.error("🌐 Backend unreachable:", err);
    return { connected: false };
  }
};


// =======================
// 🚀 EXPORT
// =======================
export default {
  donation: donationAPI,
  review: reviewAPI,
  auth: authAPI,
  otp: otpAPI,
  test: testAPI,
  checkConnection: checkBackendConnection,
};
