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

// Book Recommendations API with streaming support
export const getBookRecommendations = async (keywords, onToken, onDone) => {
  const url = `${API_URL}/api/recommend`;
  console.log('🚀 Calling:', url);
  console.log('📝 Keywords:', keywords);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ keywords })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Error response:', errText);
      throw new Error(errText || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('📖 Starting to read stream...');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('🏁 Stream complete');
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || !trimmed.startsWith('data: ')) {
          continue;
        }

        try {
          const jsonStr = trimmed.slice(6); // Remove 'data: ' prefix
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.token) {
            onToken(parsed.token);
          }
          
          if (parsed.done) {
            console.log('✅ Done signal received');
            onDone();
          }
          
          if (parsed.error) {
            console.error('❌ Stream error:', parsed.error);
            throw new Error(parsed.error);
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse line:', trimmed, parseError);
        }
      }
    }

    // Call onDone if not already called
    onDone();

  } catch (error) {
    console.error('💥 getBookRecommendations failed:', error);
    throw error;
  }
};

// ✅ NEW: Get Trending Books using AI
export const getTrendingBooks = async (onToken, onDone) => {
  const url = `${API_URL}/api/recommend`;
  console.log('🔥 Fetching trending books from:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ 
        keywords: 'current trending popular bestseller books 2024 2025 2026',
        requestType: 'trending'
      })
    });

    console.log('📡 Trending books response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Error response:', errText);
      throw new Error(errText || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('📖 Starting to read trending books stream...');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('🏁 Trending books stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || !trimmed.startsWith('data: ')) {
          continue;
        }

        try {
          const jsonStr = trimmed.slice(6);
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.token) {
            onToken(parsed.token);
          }
          
          if (parsed.done) {
            console.log('✅ Trending books done signal received');
            onDone();
          }
          
          if (parsed.error) {
            console.error('❌ Trending books stream error:', parsed.error);
            throw new Error(parsed.error);
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse trending books line:', trimmed, parseError);
        }
      }
    }

    onDone();

  } catch (error) {
    console.error('💥 getTrendingBooks failed:', error);
    throw error;
  }
};
// Book Crew API
export const bookCrewAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/book-crews`);
    if (!response.ok) throw new Error('Failed to fetch crews');
    return response.json();
  },
  
  getByBookName: async (bookName) => {
    const response = await fetch(`${API_URL}/api/book-crews/book/${encodeURIComponent(bookName)}`);
    if (!response.ok) throw new Error('Failed to fetch crew');
    return response.json();
  },
  
  join: async (crewData) => {
    const response = await fetch(`${API_URL}/api/book-crews/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crewData)
    });
    if (!response.ok) throw new Error('Failed to join crew');
    return response.json();
  },
  
  leave: async (bookName, userEmail) => {
    const response = await fetch(`${API_URL}/api/book-crews/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookName, userEmail })
    });
    if (!response.ok) throw new Error('Failed to leave crew');
    return response.json();
  },
  
  getMessages: async (bookName) => {
    const response = await fetch(`${API_URL}/api/book-crews/messages/${encodeURIComponent(bookName)}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },
  
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_URL}/api/book-crews/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },
  
  updateStatus: async (bookName, userEmail, status) => {
    const response = await fetch(`${API_URL}/api/book-crews/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookName, userEmail, status })
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  }
};