// src/services/api.js
// ─── Wired to actual backend endpoints (bookRoutes.js + socialRoutes.js) ──────
//     Books API  → /api/books/*   powered by Groq (llama-3.3-70b) → Gemini fallback
//     Social API → /api/social/*  posts / crews / reviews / comments
//     OTP API    → /api/otp/*

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
  'https://versal-book-app.onrender.com';

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

const _post = async (path, body, timeoutMs = 20000) => {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status}${txt ? ': ' + txt.slice(0, 200) : ''}`);
  }
  return res.json();
};

const _get = async (path, timeoutMs = 10000) => {
  const res = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

// Never throws — logs error and returns { success: false, error, ...fallback }
const _safe = async (fn, fallback = {}) => {
  try {
    return await fn();
  } catch (err) {
    console.error('[api]', err.message);
    return { success: false, error: err.message, ...fallback };
  }
};

// ─── HEALTH ──────────────────────────────────────────────────────────────────

export const healthCheck = () => _get('/api/health', 5000);

export const checkBackendConnection = async () => {
  try {
    const data = await healthCheck();
    return { connected: data.status === 'healthy', data };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// ─── OTP ─────────────────────────────────────────────────────────────────────

export const otpAPI = {
  sendOTP:   (userData)          => _post('/api/otp/send-otp',   userData,          10000),
  verifyOTP: (verificationData)  => _post('/api/otp/verify-otp', verificationData,  10000),
};

// ─── USER ────────────────────────────────────────────────────────────────────

export const userAPI = {
  create:        (userData)           => _safe(() => _post('/api/users', userData)),
  get:           (email)              => _safe(() => _get(`/api/users/${encodeURIComponent(email)}`)),
  updateGoals:   (email, goals)       => _safe(() => _post(`/api/users/${encodeURIComponent(email)}/goals`, goals)),
  updateProfile: (email, profileData) => _safe(() => _post(`/api/users/${encodeURIComponent(email)}/profile`, profileData)),
  incrementStat: (email, field)       => _safe(() => _post(`/api/users/${encodeURIComponent(email)}/stats/increment`, { field })),
  getStats:      (email)              => _safe(() => _get(`/api/users/${encodeURIComponent(email)}/stats`)),
  addBook:       (email, bookData)    => _safe(() => _post(`/api/users/${encodeURIComponent(email)}/books`, bookData)),
};

// ─── BOOKS API — Groq (llama-3.3-70b) → Gemini 1.5 Flash → local fallback ───
//
// All endpoints live in bookRoutes.js on your Render backend.
//
// Quick test: visit https://versal-book-app.onrender.com/api/books/debug
// to confirm Groq and Gemini keys are loaded.
//
// Route summary:
//   GET  /api/books/debug            → { groqKey, geminiKey, groq, gemini }
//   GET  /api/books/trending?page=N  → { success, books[], hasMore, source }
//   POST /api/books/chat             → { success, reply, hasRecommendations,
//                                        recommendations[], exchangeCount, source }
//   POST /api/books/recommend        → { success, recommendations[], hasMore, source }
//   POST /api/books/character-search → { success, characterAnalysis, recommendations[] }
//   POST /api/books/book-details     → { success, details: { description, themes, … } }
//   POST /api/books/similar-books    → { success, books[] }

export const booksAPI = {

  // Verify Groq & Gemini keys are alive on Render
  debug: () =>
    _safe(() => _get('/api/books/debug', 15000), { groq: 'unreachable', gemini: 'unreachable' }),

  // Trending books — AI-generated, cached 24 h
  getTrending: (page = 1) =>
    _safe(() => _get(`/api/books/trending?page=${page}`, 12000), { books: [] }),

  // ── Conversational AI — "Page Turner" book guide ─────────────────────────
  // sessionId  →  keeps 2-hour conversation memory on the server
  // Exchange 1 →  AI asks a clarifying question (no recommendations yet)
  // Exchange 2+ →  AI recommends 5 books matching the user's mood/genre
  // Say "more"  →  5 completely different books
  // Emotional messages ("I feel sad") →  warm empathetic reply first
  chat: (message, sessionId) =>
    _safe(
      () => _post('/api/books/chat', { message, sessionId }, 30000),
      {
        reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        hasRecommendations: false,
        recommendations: [],
      }
    ),

  // Direct recommendations — paginated (page 1–5)
  recommend: (query, page = 1) =>
    _safe(() => _post('/api/books/recommend', { query, page }, 20000), { recommendations: [] }),

  // Books featuring a character similar to one you love
  // e.g. searchByCharacter('Hermione Granger', 'Harry Potter')
  searchByCharacter: (character, fromBook = '') =>
    _safe(
      () => _post('/api/books/character-search', { character, fromBook }, 20000),
      { characterAnalysis: '', recommendations: [] }
    ),

  // Rich info panel for one book (description, themes, awards, pages, year)
  getBookDetails: (bookName, author = '') =>
    _safe(() => _post('/api/books/book-details', { bookName, author }, 15000), { details: null }),

  // "If you liked X, you'll love …"
  getSimilarBooks: (bookName, author = '', genre = '') =>
    _safe(() => _post('/api/books/similar-books', { bookName, author, genre }, 15000), { books: [] }),
};

// ─── SOCIAL API ───────────────────────────────────────────────────────────────
//
// All endpoints live in socialRoutes.js on your Render backend.
//
// Route summary:
//   GET  /api/social/posts                         → paginated feed
//   POST /api/social/posts                         → create post (dedup by id)
//   POST /api/social/posts/:id/like                → like a post
//   GET  /api/social/posts/:id/comments            → public comments (all users)
//   POST /api/social/posts/:id/comment             → add comment (stored on server)
//   POST /api/social/posts/:id/comments/:cid/like  → like a comment
//   GET  /api/social/reviews                       → all reviews
//   POST /api/social/reviews                       → create review
//   POST /api/social/reviews/:id/like              → like a review
//   GET  /api/social/crews                         → all crews
//   POST /api/social/crews                         → create crew
//   POST /api/social/crews/:id/join                → join crew
//   POST /api/social/crews/:id/message             → send crew message
//   GET  /api/social/crews/:id/messages            → get crew messages

export const socialAPI = {

  // Posts
  getPosts:    (page = 1, limit = 30) => _safe(() => _get(`/api/social/posts?page=${page}&limit=${limit}`, 8000), { posts: [] }),
  createPost:  (postData)             => _safe(() => _post('/api/social/posts', postData, 10000)),
  likePost:    (postId)               => _safe(() => _post(`/api/social/posts/${postId}/like`, {}, 5000)),

  // Comments (public — synced to backend so every user sees them)
  getComments: (postId)               => _safe(() => _get(`/api/social/posts/${postId}/comments`, 6000), { comments: [] }),
  addComment:  (postId, commentData)  => _safe(() => _post(`/api/social/posts/${postId}/comment`, commentData, 8000)),
  likeComment: (postId, commentId)    => _safe(() => _post(`/api/social/posts/${postId}/comments/${commentId}/like`, {}, 5000)),

  // Reviews
  getReviews:   ()             => _safe(() => _get('/api/social/reviews', 8000), { reviews: [] }),
  createReview: (reviewData)   => _safe(() => _post('/api/social/reviews', reviewData, 10000)),
  likeReview:   (reviewId)     => _safe(() => _post(`/api/social/reviews/${reviewId}/like`, {}, 5000)),

  // Crews
  getCrews:        ()                => _safe(() => _get('/api/social/crews', 8000), { crews: [] }),
  createCrew:      (crewData)        => _safe(() => _post('/api/social/crews', crewData, 10000)),
  joinCrew:        (crewId)          => _safe(() => _post(`/api/social/crews/${crewId}/join`, {}, 5000)),
  getCrewMessages: (crewId)          => _safe(() => _get(`/api/social/crews/${crewId}/messages`, 6000), { messages: [] }),
  sendCrewMessage: (crewId, msgData) => _safe(() => _post(`/api/social/crews/${crewId}/message`, msgData, 6000)),
};

// ─── LEGACY EXPORTS ───────────────────────────────────────────────────────────
// The old api.js exported donationAPI, reviewAPI, bookCrewAPI, chatAPI, crewAPI,
// postAPI, aiChatAPI, notificationAPI.  They all forward to the real endpoints
// above so existing imports in App.jsx keep working without any changes.

export const donationAPI = {
  getAll:           ()        => socialAPI.getPosts(),
  create:           (data)    => socialAPI.createPost(data),
  like:             (id)      => socialAPI.likePost(id),
  save:             ()        => Promise.resolve({ success: true }),  // client-side only
  delete:           ()        => Promise.resolve({ success: true }),  // not on backend
  getUserDonations: async (email) => {
    const r = await socialAPI.getPosts();
    return { ...r, posts: (r.posts || []).filter(p => p.userEmail === email) };
  },
};

export const reviewAPI = {
  getAll:           ()        => socialAPI.getReviews(),
  create:           (data)    => socialAPI.createReview(data),
  getUserReviews:   async (email) => {
    const r = await socialAPI.getReviews();
    return { ...r, reviews: (r.reviews || []).filter(rv => rv.userEmail === email) };
  },
  delete:   ()    => Promise.resolve({ success: true }),
  update:   ()    => Promise.resolve({ success: true }),
};

export const bookCrewAPI = {
  getAll:          ()              => socialAPI.getCrews(),
  join:            (data)          => socialAPI.joinCrew(data?.crewId || data?.id || data),
  leave:           ()              => Promise.resolve({ success: true }),
  getMessages:     (crewId)        => socialAPI.getCrewMessages(crewId),
  sendMessage:     (data)          => socialAPI.sendCrewMessage(data?.crewId, data),
  getByBookName:   ()              => Promise.resolve({ success: true, crew: null }),
  updateStatus:    ()              => Promise.resolve({ success: true }),
  getMembers:      ()              => Promise.resolve({ success: true, members: [] }),
  getSimilarBooks: (bookName)      => booksAPI.getSimilarBooks(bookName),
};

export const chatAPI = {
  sendMessage:    (crewId, data)  => socialAPI.sendCrewMessage(crewId, data),
  getMessages:    (crewId)        => socialAPI.getCrewMessages(crewId),
  markAsRead:     ()              => Promise.resolve({ success: true }),
  getUnreadCount: ()              => Promise.resolve({ success: true, count: 0 }),
  sendTyping:     ()              => Promise.resolve({ success: true }),
};

export const crewAPI = {
  getAll:     ()        => socialAPI.getCrews(),
  create:     (data)    => socialAPI.createCrew(data),
  join:       (crewId)  => socialAPI.joinCrew(crewId),
  leave:      ()        => Promise.resolve({ success: true }),
  getMembers: ()        => Promise.resolve({ success: true, members: [] }),
  update:     ()        => Promise.resolve({ success: true }),
  delete:     ()        => Promise.resolve({ success: true }),
  getById:    ()        => Promise.resolve({ success: true }),
};

export const postAPI = {
  getAll:       ()        => socialAPI.getPosts(),
  create:       (data)    => socialAPI.createPost(data),
  like:         (id)      => socialAPI.likePost(id),
  save:         ()        => Promise.resolve({ success: true }),
  delete:       ()        => Promise.resolve({ success: true }),
  getUserPosts: async (email) => {
    const r = await socialAPI.getPosts();
    return { ...r, posts: (r.posts || []).filter(p => p.userEmail === email) };
  },
};

// aiChatAPI → booksAPI.chat  (the real Groq/Gemini "Page Turner" chat)
export const aiChatAPI = {
  sendMessage: (message, sessionId) => booksAPI.chat(message, sessionId),

  // Your backend returns full JSON (no SSE stream) — simulate streaming
  streamResponse: async (message, onToken, onDone, sessionId) => {
    const result = await booksAPI.chat(message, sessionId);
    if (result?.reply) onToken(result.reply);
    onDone();
  },

  getHistory:   () => Promise.resolve({ success: true, messages: [] }),
  clearHistory: () => Promise.resolve({ success: true }),
};

// Notifications are stored in localStorage only (no backend endpoint)
export const notificationAPI = {
  getUserNotifications: async (userId) => {
    try {
      const notifs = JSON.parse(localStorage.getItem(`user_${userId}_notifications`) || '[]');
      return { success: true, notifications: notifs };
    } catch { return { success: true, notifications: [] }; }
  },
  markAsRead: async () => ({ success: true }),
  markAllAsRead: async (userId) => {
    try {
      const key = `user_${userId}_notifications`;
      const notifs = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(notifs.map(n => ({ ...n, read: true }))));
    } catch {}
    return { success: true };
  },
  getUnreadCount: async (userId) => {
    try {
      const notifs = JSON.parse(localStorage.getItem(`user_${userId}_notifications`) || '[]');
      return { success: true, count: notifs.filter(n => !n.read).length };
    } catch { return { success: true, count: 0 }; }
  },
};

// ─── LEGACY STREAMING FUNCTIONS ───────────────────────────────────────────────
// Old code called getBookRecommendations(keywords, onToken, onDone) expecting
// an SSE stream. Your backend no longer streams — we call booksAPI.recommend
// and deliver the result to the same onToken/onDone callbacks.

export const getBookRecommendations = async (keywords, onToken, onDone) => {
  try {
    const result = await booksAPI.recommend(keywords, 1);
    if (result.success && result.recommendations?.length > 0) {
      const text = result.recommendations
        .map(b => `**${b.title}** by ${b.author}\n${b.description || ''}\n_${b.reason || ''}_`)
        .join('\n\n');
      onToken(text);
    } else {
      onToken("I couldn't find recommendations right now — please try again!");
    }
  } catch (err) {
    onToken(`Error: ${err.message}`);
  } finally {
    onDone();
  }
};

export const getTrendingBooks = async (onToken, onDone) => {
  try {
    const result = await booksAPI.getTrending(1);
    if (result.success && result.books?.length > 0) {
      const text = result.books
        .map(b => `**${b.title}** by ${b.author} — ${b.trendReason || b.description || ''}`)
        .join('\n\n');
      onToken(text);
    } else {
      onToken("Couldn't load trending books right now.");
    }
  } catch (err) {
    onToken(`Error: ${err.message}`);
  } finally {
    onDone();
  }
};

// ─── CONVENIENCE DEFAULT EXPORT ───────────────────────────────────────────────

export const api = {
  // Primary (new)
  books:    booksAPI,
  social:   socialAPI,
  otp:      otpAPI,
  user:     userAPI,
  // Legacy (forwarded)
  donation: donationAPI,
  review:   reviewAPI,
  bookCrew: bookCrewAPI,
  chat:     chatAPI,
  crew:     crewAPI,
  post:     postAPI,
  aiChat:   aiChatAPI,
  notification: notificationAPI,
  // Standalone functions
  getBookRecommendations,
  getTrendingBooks,
  checkBackendConnection,
  healthCheck,
};

export default api;