// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
};

// Check backend connection
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

// User API
export const userAPI = {
  create: async (userData) => {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
  
  get: async (email) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  updateGoals: async (email, goals) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals)
    });
    if (!response.ok) throw new Error('Failed to update goals');
    return response.json();
  },
  
  addBook: async (email, bookData) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
    if (!response.ok) throw new Error('Failed to add book');
    return response.json();
  },
  
  incrementStat: async (email, field) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/stats/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field })
    });
    if (!response.ok) throw new Error('Failed to increment stat');
    return response.json();
  },
  
  // Get user stats
  getStats: async (email) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/stats`);
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return response.json();
  },
  
  // Update user profile
  updateProfile: async (email, profileData) => {
    const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(email)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }
};

// Donation API (Keep for backwards compatibility, but consider renaming to postAPI)
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
  },
  
  // Get user's donations
  getUserDonations: async (email) => {
    const response = await fetch(`${API_URL}/api/donations/user/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch user donations');
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
  },
  
  // Get user's reviews
  getUserReviews: async (email) => {
    const response = await fetch(`${API_URL}/api/reviews/user/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch user reviews');
    return response.json();
  },
  
  // Delete review
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete review');
    return response.json();
  },
  
  // Update review
  update: async (id, reviewData) => {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error('Failed to update review');
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

    onDone();

  } catch (error) {
    console.error('💥 getBookRecommendations failed:', error);
    throw error;
  }
};

// Get Trending Books using AI
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
  },
  
  // Get crew members
  getMembers: async (bookName) => {
    const response = await fetch(`${API_URL}/api/book-crews/members/${encodeURIComponent(bookName)}`);
    if (!response.ok) throw new Error('Failed to fetch crew members');
    return response.json();
  },
  
  // Get similar books for a crew
  getSimilarBooks: async (bookName) => {
    const response = await fetch(`${API_URL}/api/book-crews/similar/${encodeURIComponent(bookName)}`);
    if (!response.ok) throw new Error('Failed to fetch similar books');
    return response.json();
  }
};

// ========== NEW API EXPORTS ==========

// Chat API (for crew messaging)
export const chatAPI = {
  // Send a message to a crew
  sendMessage: async (crewId, messageData) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${crewId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get messages for a crew
  getMessages: async (crewId, limit = 50) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${crewId}/messages?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Mark messages as read
  markAsRead: async (crewId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${crewId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to mark messages as read');
      return response.json();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get unread count
  getUnreadCount: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/unread/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Send typing indicator
  sendTyping: async (crewId, userId, isTyping) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${crewId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isTyping })
      });
      if (!response.ok) throw new Error('Failed to send typing indicator');
      return response.json();
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return { success: false, error: error.message };
    }
  }
};

// Crew API (general crew management)
export const crewAPI = {
  // Get all crews
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/api/crews`);
      if (!response.ok) throw new Error('Failed to fetch crews');
      return response.json();
    } catch (error) {
      console.error('Error fetching crews:', error);
      return { success: false, error: error.message, crews: [] };
    }
  },
  
  // Get crew by ID
  getById: async (crewId) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}`);
      if (!response.ok) throw new Error('Failed to fetch crew');
      return response.json();
    } catch (error) {
      console.error('Error fetching crew:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Create a new crew
  create: async (crewData) => {
    try {
      const response = await fetch(`${API_URL}/api/crews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewData)
      });
      if (!response.ok) throw new Error('Failed to create crew');
      return response.json();
    } catch (error) {
      console.error('Error creating crew:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Join a crew
  join: async (crewId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to join crew');
      return response.json();
    } catch (error) {
      console.error('Error joining crew:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Leave a crew
  leave: async (crewId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to leave crew');
      return response.json();
    } catch (error) {
      console.error('Error leaving crew:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get crew members
  getMembers: async (crewId) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    } catch (error) {
      console.error('Error fetching members:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update crew details
  update: async (crewId, crewData) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewData)
      });
      if (!response.ok) throw new Error('Failed to update crew');
      return response.json();
    } catch (error) {
      console.error('Error updating crew:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Delete a crew
  delete: async (crewId) => {
    try {
      const response = await fetch(`${API_URL}/api/crews/${crewId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete crew');
      return response.json();
    } catch (error) {
      console.error('Error deleting crew:', error);
      return { success: false, error: error.message };
    }
  }
};

// Post API (for general posts/feed)
export const postAPI = {
  // Get all posts
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { success: false, error: error.message, posts: [] };
    }
  },
  
  // Create a post
  create: async (postData) => {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Like a post
  like: async (postId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    } catch (error) {
      console.error('Error liking post:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Save a post
  save: async (postId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to save post');
      return response.json();
    } catch (error) {
      console.error('Error saving post:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get user's posts
  getUserPosts: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/user/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch user posts');
      return response.json();
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return { success: false, error: error.message, posts: [] };
    }
  },
  
  // Delete a post
  delete: async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: error.message };
    }
  }
};

// AI Chat API (for the explore page AI assistant)
export const aiChatAPI = {
  // Send a message to AI
  sendMessage: async (message, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    } catch (error) {
      console.error('Error sending message to AI:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Stream AI response
  streamResponse: async (message, onToken, onDone, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message, userId })
      });

      if (!response.ok) throw new Error('Failed to stream AI response');
      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.token) onToken(parsed.token);
            if (parsed.done) onDone();
            if (parsed.error) throw new Error(parsed.error);
          } catch (parseError) {
            console.warn('Failed to parse line:', trimmed, parseError);
          }
        }
      }
      
      onDone();
    } catch (error) {
      console.error('Error streaming AI response:', error);
      throw error;
    }
  },
  
  // Get chat history
  getHistory: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/history/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json();
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { success: false, error: error.message, messages: [] };
    }
  },
  
  // Clear chat history
  clearHistory: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/history/${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear chat history');
      return response.json();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return { success: false, error: error.message };
    }
  }
};

// Notification API
export const notificationAPI = {
  // Get user notifications
  getUserNotifications: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message, notifications: [] };
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${encodeURIComponent(userId)}/read-all`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get unread count
  getUnreadCount: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${encodeURIComponent(userId)}/unread-count`);
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export all APIs as a single object for convenience
export const api = {
  user: userAPI,
  donation: donationAPI,
  review: reviewAPI,
  otp: otpAPI,
  bookCrew: bookCrewAPI,
  chat: chatAPI,
  crew: crewAPI,
  post: postAPI,
  aiChat: aiChatAPI,
  notification: notificationAPI,
  getBookRecommendations,
  getTrendingBooks,
  checkBackendConnection,
  healthCheck
};

// Default export for convenience
export default api;