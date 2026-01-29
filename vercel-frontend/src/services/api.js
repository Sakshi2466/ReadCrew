// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
};

// Check backend connection (wrapper around healthCheck)
export const checkBackendConnection = async () => {
  try {
    const data = await healthCheck();
    return {
      connected: data.status === 'healthy',
      data: data
    };
  } catch (error) {
    console.error('Backend connection failed:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};

// Donation API
export const donationAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/donations`);
    if (!response.ok) throw new Error('Failed to fetch donations');
    return response.json();
  },
  
  create: async (donationData) => {
    const response = await fetch(`${API_URL}/api/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donationData)
    });
    if (!response.ok) throw new Error('Failed to create donation');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/donations/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete donation');
    return response.json();
  },

  like: async (id) => {
    const response = await fetch(`${API_URL}/api/donations/${id}/like`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to like donation');
    return response.json();
  },

  save: async (id) => {
    const response = await fetch(`${API_URL}/api/donations/${id}/save`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to save donation');
    return response.json();
  }
};

// Review API
export const reviewAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },
  
  create: async (reviewData) => {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error('Failed to create review');
    return response.json();
  }
};

// OTP API
export const otpAPI = {
  sendOTP: async (userData) => {
    const response = await fetch(`${API_URL}/api/otp/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to send OTP');
    return response.json();
  },
  
  verifyOTP: async (verificationData) => {
    const response = await fetch(`${API_URL}/api/otp/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    });
    if (!response.ok) throw new Error('Failed to verify OTP');
    return response.json();
  }
};