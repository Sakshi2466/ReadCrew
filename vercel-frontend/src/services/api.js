// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export const healthCheck = async () => {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
};

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
  }
};

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

export const otpAPI = {
  send: async (email) => {
    const response = await fetch(`${API_URL}/api/otp/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to send OTP');
    return response.json();
  },
  
  verify: async (email, otp) => {
    const response = await fetch(`${API_URL}/api/otp/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (!response.ok) throw new Error('Failed to verify OTP');
    return response.json();
  }
};