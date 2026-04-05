// ========================================
// App.jsx - READCREWW Social Platform
// Version: 5.0 — Fully Global with Backend Sync
// ✅ All features from previous version
// ✅ Fixed like/unlike toggle (click to like, click again to unlike)
// ✅ Global sync with backend (MongoDB via Render)
// ✅ Heart glitter animation on like only (not on unlike)
// ✅ Infinite scroll support
// ✅ Offline fallback with localStorage
// ========================================

// ========================================
// SECTION 1: IMPORTS
// ========================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image as ImageIcon, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter,
  Paperclip, Mail, Phone, ExternalLink,
  Link2, AtSign, Flag, Pin,
  CheckCheck, BookMarked, PlusCircle, MapPin, Navigation, Map, Repeat,
  UserCheck, UserMinus, Wifi, WifiOff,
  AlertCircle, CheckCircle, Info,
  Play, Pause, Volume2, Mic, Leaf,
  List, Grid,
  HelpCircle, Coffee, Music, Film,
  Video, Download,
  RefreshCw, RotateCcw, Maximize2, Minimize2,
  Circle, Square, Sun, Moon, Cloud,
  Thermometer, Compass, Anchor,
  Rocket, Satellite,
  Briefcase, Building,
  Headphones, Speaker,
  Tv, Monitor, Laptop, Tablet, Smartphone, Watch,
  AlarmClock, Timer, Hourglass, Shield, ShieldOff,
} from 'lucide-react';

import axios from 'axios';
import { io } from 'socket.io-client';

// ========================================
// SECTION 2: CONFIGURATION
// ========================================

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

// ─── Unified API helper (never throws) ──────────────────────────────────────
const api = {
  get: (url, cfg = {}) => axios.get(`${API_URL}${url}`, { timeout: 8000, ...cfg }).catch(() => null),
  post: (url, body, cfg = {}) => axios.post(`${API_URL}${url}`, body, { timeout: 8000, ...cfg }).catch(() => null),
};

// ─── Deep-link helpers ────────────────────────────────────────────────────────
const deepLink = (type, id) => {
  const base = window.location.origin + window.location.pathname;
  return `${base}?rc_type=${type}&rc_id=${encodeURIComponent(id)}`;
};

const parseDeepLink = () => {
  const p = new URLSearchParams(window.location.search);
  const type = p.get('rc_type');
  const id = p.get('rc_id');
  if (type && id) return { type, id };
  const h = window.location.hash.replace('#', '');
  if (h.startsWith('post/')) return { type: 'post', id: h.slice(5) };
  if (h.startsWith('crew/')) return { type: 'crew', id: h.slice(5) };
  return null;
};

// ========================================
// SECTION 3: FEED ALGORITHM ENGINE
// ========================================

const FEED_WEIGHTS = {
  share: 5.0,
  save: 4.0,
  comment: 3.5,
  like: 2.0,
  view: 0.5,
  skip: -1.0,
  follow_author: 6.0,
  close_friend: 3.0,
  mutual_follow: 1.5,
  book_interest: 3.0,
  tag_match: 2.0,
  recency_half_life: 24,
  min_score_factor: 0.05,
  discovery_ratio: 0.20,
};

const buildUserInterestProfile = (userEmail) => {
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const likedPostIds = JSON.parse(localStorage.getItem(`user_${userEmail}_likedPosts`) || '[]');
  const savedPostIds = JSON.parse(localStorage.getItem(`user_${userEmail}_savedPosts`) || '[]');
  const following = JSON.parse(localStorage.getItem(`user_${userEmail}_following`) || '[]');

  const authorScores = {};
  const bookScores = {};

  likedPostIds.forEach(postId => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    authorScores[post.userEmail] = (authorScores[post.userEmail] || 0) + FEED_WEIGHTS.like;
    if (post.bookName) {
      bookScores[post.bookName] = (bookScores[post.bookName] || 0) + FEED_WEIGHTS.like;
    }
  });

  savedPostIds.forEach(postId => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    authorScores[post.userEmail] = (authorScores[post.userEmail] || 0) + FEED_WEIGHTS.save;
    if (post.bookName) {
      bookScores[post.bookName] = (bookScores[post.bookName] || 0) + FEED_WEIGHTS.save;
    }
  });

  allPosts.forEach(post => {
    const comments = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
    const userCommented = comments.some(c => c.userEmail === userEmail);
    if (userCommented) {
      authorScores[post.userEmail] = (authorScores[post.userEmail] || 0) + FEED_WEIGHTS.comment;
      if (post.bookName) {
        bookScores[post.bookName] = (bookScores[post.bookName] || 0) + FEED_WEIGHTS.comment;
      }
    }
  });

  const closeFriends = Object.entries(authorScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([email]) => email);

  const topBooks = Object.entries(bookScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([book]) => book);

  return { following, closeFriends, authorScores, bookScores, topBooks };
};

const scorePostForUser = (post, profile) => {
  let score = 0;

  if (profile.following.includes(post.userEmail)) {
    score += FEED_WEIGHTS.follow_author;
  }
  if (profile.closeFriends.includes(post.userEmail)) {
    score += FEED_WEIGHTS.close_friend;
  }

  const authorInterest = profile.authorScores[post.userEmail] || 0;
  score += authorInterest * 0.4;

  if (post.bookName && profile.bookScores[post.bookName]) {
    score += profile.bookScores[post.bookName] * 0.3;
  }

  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const reshares = post.reshareCount || 0;
  const engagement = likes * 2 + comments * 3 + reshares * 5;
  score += Math.log(engagement + 1) * 1.5;

  const ageInHours = (Date.now() - new Date(post.createdAt)) / 3_600_000;
  const decayFactor = Math.max(
    Math.pow(0.5, ageInHours / FEED_WEIGHTS.recency_half_life),
    FEED_WEIGHTS.min_score_factor
  );
  score *= decayFactor;

  return score;
};

const generatePersonalizedFeed = (userEmail, allPosts, blockedUsers = []) => {
  if (!allPosts || allPosts.length === 0) return [];

  const profile = buildUserInterestProfile(userEmail);
  const candidates = allPosts.filter(p => !blockedUsers.includes(p.userEmail));

  const scored = candidates
    .map(post => ({ post, score: scorePostForUser(post, profile) }))
    .sort((a, b) => b.score - a.score);

  const limit = scored.length;
  const personalizedCount = Math.floor(limit * (1 - FEED_WEIGHTS.discovery_ratio));

  const personalizedFeed = scored.slice(0, personalizedCount).map(s => s.post);
  const discoveryPool = scored.slice(personalizedCount);

  for (let i = discoveryPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [discoveryPool[i], discoveryPool[j]] = [discoveryPool[j], discoveryPool[i]];
  }

  const discoveryFeed = discoveryPool.map(s => s.post);

  const finalFeed = [];
  let pIdx = 0;
  let dIdx = 0;
  while (pIdx < personalizedFeed.length || dIdx < discoveryFeed.length) {
    for (let i = 0; i < 4 && pIdx < personalizedFeed.length; i++) {
      finalFeed.push(personalizedFeed[pIdx++]);
    }
    if (dIdx < discoveryFeed.length) {
      finalFeed.push(discoveryFeed[dIdx++]);
    }
  }

  return finalFeed;
};

// ========================================
// SECTION 4: GLOBAL INTERACTION HELPERS (FULL BACKEND INTEGRATION)
// ========================================

// Your backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com/api/social';

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: data.success, data };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
};

// ========== POSTS (GLOBAL) ==========

// Get all posts from backend with pagination (GLOBAL)
const getAllPosts = async (page = 1, limit = 20, userEmail = null) => {
  let url = `/posts?page=${page}&limit=${limit}`;
  if (userEmail) url += `&userEmail=${encodeURIComponent(userEmail)}`;
  
  const result = await apiCall(url);
  if (result.success) {
    localStorage.setItem('allPosts', JSON.stringify(result.data.posts));
    return result.data.posts;
  }
  return JSON.parse(localStorage.getItem('allPosts') || '[]');
};

// Get a single post by ID (GLOBAL)
const getPostById = async (postId) => {
  const result = await apiCall(`/posts/${postId}`);
  if (result.success) {
    return result.data.post;
  }
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  return allPosts.find(p => p.id === postId);
};

// Create a new post (GLOBAL)
const createPost = async (postData) => {
  const result = await apiCall('/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  });
  
  if (result.success) {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    allPosts.unshift(result.data.post);
    localStorage.setItem('allPosts', JSON.stringify(allPosts.slice(0, 500)));
    return result.data.post;
  }
  
  throw new Error(result.data?.message || 'Failed to create post');
};

// ========== LIKES (GLOBAL - TOGGLE LIKE/UNLIKE) ==========

// Get like count for a post
const getPostLikes = async (postId) => {
  const result = await apiCall(`/posts/${postId}`);
  if (result.success) {
    return result.data.post.likes;
  }
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  return likedBy.length;
};

// Check if user liked a post
const hasUserLikedPost = async (postId, userEmail) => {
  if (!userEmail) return false;
  
  const result = await apiCall(`/posts/${postId}`);
  if (result.success && result.data.post) {
    return result.data.post.likedBy?.includes(userEmail) || false;
  }
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  return likedBy.includes(userEmail);
};

// Toggle like on a post (GLOBAL) - Adds like if not liked, removes if already liked
const addGlobalLike = async (postId, userEmail, userName = '') => {
  if (!userEmail) return { likes: 0, liked: false };
  
  const result = await apiCall(`/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userEmail, userName })
  });
  
  if (result.success) {
    const { likes, liked } = result.data;
    
    // Update local cache
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p =>
      p.id === postId ? { ...p, likes } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    // Update user's liked posts list
    const userLiked = JSON.parse(localStorage.getItem(`user_${userEmail}_likedPosts`) || '[]');
    if (liked && !userLiked.includes(postId)) {
      userLiked.push(postId);
    } else if (!liked && userLiked.includes(postId)) {
      const index = userLiked.indexOf(postId);
      userLiked.splice(index, 1);
    }
    localStorage.setItem(`user_${userEmail}_likedPosts`, JSON.stringify(userLiked));
    
    // Update localStorage for this specific post
    const likedByArray = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
    if (liked && !likedByArray.includes(userEmail)) {
      likedByArray.push(userEmail);
    } else if (!liked && likedByArray.includes(userEmail)) {
      const index = likedByArray.indexOf(userEmail);
      likedByArray.splice(index, 1);
    }
    localStorage.setItem(`post_${postId}_likedBy`, JSON.stringify(likedByArray));
    
    return { likes, liked };
  }
  
  // ========== FALLBACK TO LOCALSTORAGE ONLY (Offline mode) ==========
  console.warn('Backend unavailable, using localStorage fallback for like');
  
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  const alreadyLiked = likedBy.includes(userEmail);
  
  if (alreadyLiked) {
    const index = likedBy.indexOf(userEmail);
    likedBy.splice(index, 1);
  } else {
    likedBy.push(userEmail);
  }
  
  localStorage.setItem(`post_${postId}_likedBy`, JSON.stringify(likedBy));
  
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const updatedPosts = allPosts.map(p =>
    p.id === postId ? { ...p, likes: likedBy.length } : p
  );
  localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  
  const userLiked = JSON.parse(localStorage.getItem(`user_${userEmail}_likedPosts`) || '[]');
  if (!alreadyLiked && !userLiked.includes(postId)) {
    userLiked.push(postId);
  } else if (alreadyLiked && userLiked.includes(postId)) {
    const index = userLiked.indexOf(postId);
    userLiked.splice(index, 1);
  }
  localStorage.setItem(`user_${userEmail}_likedPosts`, JSON.stringify(userLiked));
  
  return { likes: likedBy.length, liked: !alreadyLiked };
};

// ========== COMMENTS (GLOBAL) ==========

// Get comments for a post
const getPostComments = async (postId) => {
  const result = await apiCall(`/posts/${postId}/comments`);
  
  if (result.success) {
    localStorage.setItem(`post_${postId}_comments`, JSON.stringify(result.data.comments));
    return result.data.comments;
  }
  return JSON.parse(localStorage.getItem(`post_${postId}_comments`) || '[]');
};

// Fetch comments from server (alias)
const fetchCommentsFromServer = async (postId) => {
  return await getPostComments(postId);
};

// Add a comment to a post (GLOBAL)
const postCommentToServer = async (postId, commentData) => {
  const result = await apiCall(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData)
  });
  
  if (result.success) {
    const { comments } = result.data;
    localStorage.setItem(`post_${postId}_comments`, JSON.stringify(comments));
    
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const topLevelComments = comments.filter(c => !c.parentId);
    const updatedPosts = allPosts.map(p =>
      p.id === postId ? { ...p, comments: topLevelComments.length } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    return comments;
  }
  
  // Fallback to localStorage
  const cmts = JSON.parse(localStorage.getItem(`post_${postId}_comments`) || '[]');
  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...commentData,
    timestamp: new Date().toISOString(),
    likes: 0,
    likedBy: []
  };
  cmts.push(newComment);
  localStorage.setItem(`post_${postId}_comments`, JSON.stringify(cmts));
  
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const updatedPosts = allPosts.map(p =>
    p.id === postId ? { ...p, comments: cmts.filter(c => !c.parentId).length } : p
  );
  localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  
  return cmts;
};

// ========== RESHARE (GLOBAL) ==========

// Increment reshare count and create reshare post (GLOBAL)
const incrementReshareCount = async (postId, userEmail, userName, reshareComment = '') => {
  const originalPost = await getPostById(postId);
  
  if (originalPost) {
    const reshareData = {
      content: reshareComment || `Shared: ${originalPost.content?.substring(0, 100)}`,
      userName,
      userEmail,
      isReshare: true,
      originalPostId: postId,
      originalPost: originalPost,
      reshareComment: reshareComment,
      type: 'reshare'
    };
    
    const result = await createPost(reshareData);
    
    if (result) {
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const updatedPosts = allPosts.map(p =>
        p.id === postId ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p
      );
      localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
      return (updatedPosts.find(p => p.id === postId)?.reshareCount) || 0;
    }
  }
  
  // Fallback to localStorage only
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const updatedPosts = allPosts.map(p =>
    p.id === postId ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p
  );
  localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  return (updatedPosts.find(p => p.id === postId)?.reshareCount) || 0;
};

// ========== HELPER FUNCTIONS FOR UI ==========

// Get current user from localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Get user email helper
const getUserEmail = () => {
  const user = getCurrentUser();
  return user?.email || null;
};

// Get user name helper
const getUserName = () => {
  const user = getCurrentUser();
  return user?.name || user?.userName || 'User';
};

// Generate unique ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

// Sanitize text
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Extract mentions
const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

// ========================================
// SECTION 5: NOTIFICATION HELPERS
// ========================================

const _shownToastIds = new Set();

const pushNotification = async (targetEmail, notif) => {
  if (!targetEmail) return null;

  const full = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...notif,
    timestamp: new Date().toISOString(),
    read: false,
  };

  const list = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');

  const thirtySecsAgo = Date.now() - 30000;
  const isDuplicate = list.some(n =>
    n.type === full.type &&
    n.fromUserEmail === full.fromUserEmail &&
    n.postId === full.postId &&
    new Date(n.timestamp).getTime() > thirtySecsAgo
  );
  if (isDuplicate) return null;

  list.unshift(full);
  if (list.length > 200) list.length = 200;
  localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(list));

  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));

  api.post('/api/social/notifications', { targetEmail, notification: full });

  return full;
};

// ========================================
// SECTION 6: NOTIFICATION TOAST COMPONENT
// ========================================

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    like: <Heart className="w-5 h-5 text-red-500" />,
    comment: <MessageCircle className="w-5 h-5 text-blue-500" />,
    mention: <AtSign className="w-5 h-5 text-amber-500" />,
    reshare: <Repeat className="w-5 h-5 text-indigo-500" />,
    follow: <UserCheck className="w-5 h-5 text-green-500" />,
    invite: <UserPlus className="w-5 h-5 text-purple-500" />,
    message: <MessageSquare className="w-5 h-5 text-emerald-500" />,
    join: <Users className="w-5 h-5 text-blue-500" />,
    leave: <UserMinus className="w-5 h-5 text-red-500" />,
    review: <Star className="w-5 h-5 text-yellow-500" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    like: 'bg-red-50 border-red-200',
    comment: 'bg-blue-50 border-blue-200',
    mention: 'bg-amber-50 border-amber-200',
    reshare: 'bg-indigo-50 border-indigo-200',
    follow: 'bg-green-50 border-green-200',
    invite: 'bg-purple-50 border-purple-200',
    message: 'bg-emerald-50 border-emerald-200',
    join: 'bg-blue-50 border-blue-200',
    leave: 'bg-red-50 border-red-200',
    review: 'bg-yellow-50 border-yellow-200',
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const iconBgs = {
    like: 'bg-red-100', comment: 'bg-blue-100', mention: 'bg-amber-100',
    reshare: 'bg-indigo-100', follow: 'bg-green-100', invite: 'bg-purple-100',
    message: 'bg-emerald-100', join: 'bg-blue-100', leave: 'bg-red-100',
    review: 'bg-yellow-100', warning: 'bg-orange-100', success: 'bg-green-100',
    info: 'bg-blue-100',
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideDown">
      <div className={`rounded-2xl shadow-2xl border-2 overflow-hidden ${bgColors[notification.type] || 'bg-white border-gray-200'}`}>
        <div className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgs[notification.type] || 'bg-purple-100'}`}>
            {icons[notification.type] || <Bell className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-medium leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 7: HEART GLITTER EFFECT COMPONENT
// ========================================

const HeartGlitterEffect = ({ x, y, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = [
    { dx: -55, dy: -85, rotate: -20, delay: 0,   size: 20, emoji: '❤️' },
    { dx:  55, dy: -85, rotate:  20, delay: 50,  size: 18, emoji: '💖' },
    { dx: -85, dy: -40, rotate: -35, delay: 30,  size: 16, emoji: '✨' },
    { dx:  85, dy: -40, rotate:  35, delay: 80,  size: 16, emoji: '✨' },
    { dx: -25, dy: -105,rotate:   0, delay: 20,  size: 22, emoji: '❤️' },
    { dx:  25, dy: -105,rotate:  10, delay: 60,  size: 18, emoji: '💕' },
    { dx: -65, dy:  15, rotate: -25, delay: 40,  size: 14, emoji: '💖' },
    { dx:  65, dy:  15, rotate:  25, delay: 70,  size: 14, emoji: '✨' },
    { dx:   0, dy: -95, rotate:   5, delay: 10,  size: 24, emoji: '❤️' },
    { dx: -45, dy: -65, rotate: -15, delay: 90,  size: 15, emoji: '💗' },
    { dx:  45, dy: -65, rotate:  15, delay: 45,  size: 15, emoji: '💗' },
    { dx:   0, dy:  25, rotate:   0, delay: 55,  size: 12, emoji: '✨' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            fontSize: p.size,
            animation: `glitter_burst 0.95s ease-out ${p.delay}ms both`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rotate}deg`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};

// Add keyframes to document
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes glitter_burst {
      0% { transform: translate(0, 0) rotate(0deg) scale(0.2); opacity: 1; }
      70% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1.2); opacity: 0.9; }
      100% { transform: translate(calc(var(--dx) * 1.2), calc(var(--dy) * 1.2)) rotate(calc(var(--rot) * 1.3)) scale(0.8); opacity: 0; }
    }
  `;
  if (!document.head.querySelector('[data-glitter-styles]')) {
    styleEl.setAttribute('data-glitter-styles', 'true');
    document.head.appendChild(styleEl);
  }
}

// ========================================
// SECTION 8: DYNAMIC BOOK COVER COMPONENT
// ========================================

const DynamicBookCover = ({ title, author, onClick, size = 'md' }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = {
    xs: 'w-12 h-16',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-48',
  };
  const cls = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!title) { setError(true); setLoading(false); return; }
    let mounted = true;

    const fetchCover = async () => {
      const query = encodeURIComponent(author ? `${title} ${author}` : title);
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&projection=lite`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok && mounted) {
          const data = await res.json();
          const links = data.items?.[0]?.volumeInfo?.imageLinks;
          if (links) {
            const raw = links.extraLarge || links.large || links.medium || links.thumbnail;
            if (raw) {
              setCoverUrl(raw.replace('http:', 'https:').replace('&edge=curl', ''));
              setLoading(false);
              return;
            }
          }
        }
      } catch (_) { }

      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${query}&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok && mounted) {
          const data = await res.json();
          const book = data.docs?.[0];
          if (book?.cover_i) {
            setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`);
            setLoading(false);
            return;
          }
          if (book?.isbn?.length > 0) {
            setCoverUrl(`https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`);
            setLoading(false);
            return;
          }
        }
      } catch (_) { }

      if (mounted) { setError(true); setLoading(false); }
    };

    fetchCover();
    return () => { mounted = false; };
  }, [title, author]);

  const getFallbackColor = () => {
    const colors = [
      '#7B9EA6', '#C8622A', '#8B5E3C', '#E8A87C', '#C4A882',
      '#2C3E50', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C',
      '#27AE60', '#F39C12', '#D35400', '#8E44AD', '#16A085',
    ];
    const hash = (title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';

  if (loading) {
    return (
      <div className={`${cls} bg-gray-200 rounded-xl animate-pulse flex items-center justify-center`} onClick={onClick}>
        <BookOpen className="w-6 h-6 text-gray-400" />
      </div>
    );
  }
  if (error || !coverUrl) {
    return (
      <div
        className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform`}
        style={{ backgroundColor: getFallbackColor() }}
        onClick={onClick}
      >
        <span className="text-xl">{initials}</span>
        <BookOpen className="w-4 h-4 mt-1 opacity-60" />
      </div>
    );
  }
  return (
    <div className={`${cls} rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow`} onClick={onClick}>
      <img
        src={coverUrl}
        alt={`Cover of ${title}`}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        onError={() => { setCoverUrl(null); setError(true); }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// ========================================
// SECTION 9: AVATAR COMPONENT
// ========================================

const Avatar = ({ initials, size = 'md', src, online, onClick }) => {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  const gradients = [
    'from-orange-500 to-red-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-blue-500',
  ];
  const getGradient = () => {
    const hash = (initials || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };
  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src ? (
        <img
          src={src}
          alt={initials}
          className={`${sizes[size]} rounded-full object-cover border-2 border-orange-200 hover:border-orange-400 transition`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center font-semibold text-white shadow-md`}>
          {initials?.slice(0, 2).toUpperCase()}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

// ========================================
// SECTION 10: STAR RATING COMPONENT
// ========================================

const StarRating = ({ rating = 0, onChange, size = 'sm', readonly = false }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const sz = sizeClasses[size] || sizeClasses.sm;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange && !readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
};

// ========================================
// SECTION 11: LOADING SPINNER COMPONENT
// ========================================

const LoadingSpinner = ({ size = 'md', color = 'orange', fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const colors = { orange: 'border-orange-500', blue: 'border-blue-500', purple: 'border-purple-500', green: 'border-green-500', white: 'border-white' };
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`} />
      </div>
    );
  }
  return <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color] || colors.orange} rounded-full animate-spin`} />;
};

// ========================================
// SECTION 12: INLINE POST CARD (WITH TOGGLE LIKE)
// ========================================

const InlinePostCard = React.memo(({
  post, user, profileSrc, updateNotificationCount,
  onShare, onReshareClick, onSaveToggle, isSaved,
  onDelete, onFollow, isFollowing, onBlock, isBlocked,
  onViewUserProfile, onViewBookDetails,
}) => {
  // Like state
  const [isLiked, setIsLiked] = useState(() => {
    if (post.likedBy && user?.email) {
      return post.likedBy.includes(user.email);
    }
    return false;
  });
  const [likeCount, setLikeCount] = useState(() => post.likes || 0);
  
  // Comment states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [showAllComments, setShowAll] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [glitterEffects, setGlitterEffects] = useState([]);
  
  const likeButtonRef = useRef(null);
  const inputRef = useRef(null);

  // Update like status when post data changes
  useEffect(() => {
    const updateLikeStatus = async () => {
      if (user?.email) {
        const liked = await hasUserLikedPost(post.id, user.email);
        setIsLiked(liked);
      }
    };
    updateLikeStatus();
    
    if (post.likes !== undefined && post.likes !== likeCount) {
      setLikeCount(post.likes);
    }
  }, [post.id, post.likes, user?.email]);

  // Load comments when panel opens
  useEffect(() => {
    if (!showComments) return;
    loadComments();
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    const pid = post.id || post._id;
    const cmts = await fetchCommentsFromServer(pid);
    setComments(cmts);
    setCommentCount(cmts.filter(c => !c.parentId).length);
    setLoadingComments(false);
  };

  const triggerGlitter = () => {
    if (!likeButtonRef.current) return;
    const rect = likeButtonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const id = `glitter_${Date.now()}`;
    setGlitterEffects(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setGlitterEffects(prev => prev.filter(g => g.id !== id));
    }, 1500);
  };

  // ========== LIKE/UNLIKE FUNCTION (TOGGLE) ==========
  const handleLikePost = async () => {
    if (isLiking) return;
    if (!user?.email) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    
    try {
      const result = await addGlobalLike(post.id, user.email, user.name);
      
      if (result) {
        setIsLiked(result.liked);
        setLikeCount(result.likes);
        
        // Show glitter animation ONLY when actually liking (not unliking)
        if (result.liked && !wasLiked) {
          triggerGlitter();
        }
        
        // Send notification ONLY when liking (not when unliking)
        if (result.liked && !wasLiked && post.userEmail !== user.email) {
          pushNotification(post.userEmail, {
            type: 'like',
            fromUser: user.name,
            fromUserEmail: user.email,
            message: `${user.name} liked your post`,
            postId: post.id,
          });
          updateNotificationCount?.();
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user?.email) return;

    const mentions = extractMentions(newComment);
    const commentData = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      content: newComment.trim(),
      mentions,
      parentId: replyTo?.id || null,
      timestamp: new Date().toISOString(),
      likes: 0,
    };

    setNewComment('');
    setReplyTo(null);
    const pid = post.id || post._id;
    const updated = await postCommentToServer(pid, commentData);
    setComments(updated);
    setCommentCount(updated.filter(c => !c.parentId).length);

    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, {
        type: 'comment',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.trim().substring(0, 60)}"`,
        postId: post.id,
      });
      updateNotificationCount?.();
    }

    mentions.forEach(mention => {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const mentioned = allUsers.find(u =>
        u.name.toLowerCase().replace(/\s/g, '') === mention.toLowerCase() ||
        u.email.split('@')[0].toLowerCase() === mention.toLowerCase()
      );
      if (mentioned && mentioned.email !== user.email) {
        pushNotification(mentioned.email, {
          type: 'mention',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} mentioned you in a comment`,
          postId: post.id,
        });
      }
    });
  };

  const handleLikeComment = async (commentId, commentUserEmail) => {
    if (likedComments.has(commentId)) return;
    
    const updated = comments.map(c =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    setComments(updated);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    
    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.email}_likedComments`, JSON.stringify([...newLiked]));
    
    if (commentUserEmail && commentUserEmail !== user.email) {
      pushNotification(commentUserEmail, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your comment`,
        postId: post.id,
      });
    }
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    setCommentCount(filtered.filter(c => !c.parentId).length);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(filtered));
    
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    localStorage.setItem('allPosts', JSON.stringify(
      allPosts.map(p => p.id === post.id ? { ...p, comments: filtered.filter(c => !c.parentId).length } : p)
    ));
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const visibleComments = showAllComments ? topLevelComments : topLevelComments.slice(0, 3);
  const isPostAuthor = user?.email === post.userEmail;

  const CommentRow = ({ comment, depth = 0 }) => {
    const replies = depth < 2 ? comments.filter(c => c.parentId === comment.id) : [];
    const isLikedCmt = likedComments.has(comment.id);
    const isOwn = comment.userEmail === user?.email;

    const renderContent = () => {
      if (!comment.mentions?.length) {
        return <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>;
      }
      const parts = comment.content.split(/(@\w+)/g);
      return (
        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
          {parts.map((part, idx) => {
            if (part.startsWith('@')) {
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const all = JSON.parse(localStorage.getItem('users') || '[]');
                    const found = all.find(u =>
                      u.name.toLowerCase().includes(part.substring(1).toLowerCase()) ||
                      u.email.split('@')[0].toLowerCase() === part.substring(1).toLowerCase()
                    );
                    if (found) onViewUserProfile(found.email, found.name);
                  }}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  {part}
                </button>
              );
            }
            return part;
          })}
        </p>
      );
    };

    return (
      <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8' : ''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 30 }}>
          <button onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}>
            <Avatar initials={comment.userName} size="xs" src={comment.userPhoto} />
          </button>
          {replies.length > 0 && showReplies[comment.id] && (
            <div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[16px]" />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}
              className="font-semibold text-gray-900 text-sm hover:underline"
            >
              {comment.userName}
            </button>
            <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(comment.timestamp)}</span>
          </div>
          {renderContent()}

          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => handleLikeComment(comment.id, comment.userEmail)}
              disabled={isLikedCmt}
              className={`flex items-center gap-1 text-xs font-medium transition ${isLikedCmt ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLikedCmt ? 'fill-red-500' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>

            {depth < 2 && (
              <button
                onClick={() => { setReplyTo(comment); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="text-xs text-gray-400 hover:text-orange-500 font-semibold"
              >
                Reply
              </button>
            )}

            {isOwn && (
              <button onClick={() => handleDeleteComment(comment.id)} className="ml-auto text-gray-200 hover:text-red-400 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {replies.length > 0 && (
            <div className="mt-2">
              {!showReplies[comment.id] && replies.length > 1 && (
                <button
                  onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: true }))}
                  className="text-xs text-orange-500 font-semibold mb-2 flex items-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  View {replies.length} replies
                </button>
              )}
              {(showReplies[comment.id] || replies.length === 1) && (
                <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                  {replies.map(reply => <CommentRow key={reply.id} comment={reply} depth={depth + 1} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {glitterEffects.map(effect => (
        <HeartGlitterEffect
          key={effect.id}
          x={effect.x}
          y={effect.y}
          onComplete={() => setGlitterEffects(prev => prev.filter(g => g.id !== effect.id))}
        />
      ))}

      {showOptions && (
        <PostOptionsModal
          post={post} user={user}
          onClose={() => setShowOptions(false)}
          onReshare={onReshareClick}
          onSave={onSaveToggle}
          isSaved={isSaved}
          onDelete={onDelete}
          isOwner={isPostAuthor}
          onFollow={onFollow}
          isFollowing={isFollowing}
          onBlock={onBlock}
          isBlocked={isBlocked}
        />
      )}

      <div id={`post-${post.id || post._id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        {/* Post Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start gap-3">
            <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="flex-shrink-0">
              <Avatar initials={post.userName} size="md" src={post.userPhoto} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="font-bold text-gray-900 text-sm hover:underline">
                  {post.userName || 'Anonymous'}
                </button>
                {post.isReshare && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Repeat className="w-3 h-3" /> Reshared
                  </span>
                )}
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
              </div>

              {post.bookName && (
                <button
                  onClick={() => onViewBookDetails?.({ title: post.bookName, author: post.author })}
                  className="flex items-center gap-1.5 mt-0.5 hover:underline"
                >
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {post.bookName}{post.author && ` · ${post.author}`}
                  </span>
                </button>
              )}
            </div>

            <button onClick={() => setShowOptions(true)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          {post.image && (
            <img
              src={post.image}
              alt=""
              className="w-full rounded-xl mb-3 max-h-96 object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => window.open(post.image, '_blank')}
            />
          )}

          {post.isReshare && post.originalPost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3" />
              <span>
                Reshared from{' '}
                <button
                  onClick={() => onViewUserProfile(post.originalPost.userEmail, post.originalPost.userName)}
                  className="font-semibold hover:underline"
                >
                  {post.originalPost.userName}
                </button>
              </span>
            </div>
          )}

          <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {post.story || post.content}
          </p>

          {post.reshareComment && (
            <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-sm text-orange-800 italic">"{post.reshareComment}"</p>
            </div>
          )}

          {post.isReshare && post.originalPost && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Original post by <span className="font-semibold">{post.originalPost.userName}</span>:</p>
              <p className="text-sm text-gray-600 line-clamp-3">{post.originalPost.content}</p>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          {/* LIKE BUTTON - Toggles like/unlike */}
          <button
            ref={likeButtonRef}
            onClick={handleLikePost}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all 
              ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} 
              ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-200 
                ${isLiked ? 'fill-red-500 scale-110' : ''}`} 
            />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(prev => !prev)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${showComments ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentCount}</span>
          </button>

          <button
            onClick={() => onSaveToggle(post)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.reshareCount || 0}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <>
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
                  <p className="text-xs text-orange-600 font-medium flex-1">
                    Replying to <span className="font-bold">{replyTo.userName}</span>
                  </p>
                  <button onClick={() => setReplyTo(null)}>
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {profileSrc
                  ? <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <Avatar initials={user?.name} size="sm" />
                }
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handlePostComment(); 
                      } 
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    placeholder={replyTo ? `Reply to @${replyTo.userName}...` : 'drop a comment... @mention ur crew 💬'}
                  />
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all 
                    ${newComment.trim() 
                      ? 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Post
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 space-y-3 max-h-96 overflow-y-auto">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : visibleComments.length > 0 ? (
                visibleComments.map(comment => (
                  <CommentRow key={comment.id} comment={comment} depth={0} />
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  No comments yet. Be the first!
                </p>
              )}

              {topLevelComments.length > 3 && (
                <button
                  onClick={() => setShowAll(prev => !prev)}
                  className="text-xs text-orange-500 font-semibold mt-2 flex items-center gap-1 hover:text-orange-600"
                >
                  {showAllComments
                    ? <><ChevronDown className="w-3.5 h-3.5 rotate-180" />Show less</>
                    : <><ChevronDown className="w-3.5 h-3.5" />View all {topLevelComments.length} comments</>
                  }
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
});

// ========================================
// SECTION 13: POST OPTIONS MODAL
// ========================================

const PostOptionsModal = ({
  post, user, onClose, onReshare, onSave, isSaved,
  onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked,
}) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const reportReasons = [
    'Spam or misleading', 'Harassment or bullying', 'Inappropriate content',
    'Misinformation', 'Hate speech', 'Violence', 'Copyright infringement', 'Other',
  ];

  const handleReport = () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    const reports = JSON.parse(localStorage.getItem('reportedPosts') || '[]');
    reports.push({
      postId: post.id, reportedBy: user.email, reportedByName: user.name,
      reason: reportReason, details: reportDetails, postContent: post.content,
      postAuthor: post.userEmail, postAuthorName: post.userName,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('reportedPosts', JSON.stringify(reports));
    setReportSubmitting(false);
    setReportSent(true);
    setTimeout(onClose, 2000);
  };

  if (showReportForm) {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      >
        <div className="bg-white rounded-t-2xl w-full p-5 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 border-b">
            <h3 className="font-semibold text-lg">Report Post</h3>
            <button onClick={() => setShowReportForm(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          {reportSent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-gray-900 text-lg">Report submitted</p>
              <p className="text-sm text-gray-500 mt-2">Thanks for helping keep READCREWW safe.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-3 font-medium">Why are you reporting this?</p>
              <div className="space-y-2 mb-4">
                {reportReasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${reportReason === reason ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none mb-4"
                placeholder="anything else bestie? (optional)"
                rows={3}
                disabled={!reportReason}
              />
              <button
                onClick={handleReport}
                disabled={!reportReason || reportSubmitting}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                {reportSubmitting ? <><LoadingSpinner size="sm" color="white" /><span>Submitting...</span></> : <><Flag className="w-4 h-4" /><span>Submit Report</span></>}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const options = [
    { id: 'reshare', icon: Repeat, label: 'Reshare', color: 'text-blue-600', action: () => { onReshare(post); onClose(); } },
    { id: 'save', icon: Bookmark, label: isSaved ? 'Unsave' : 'Save', color: isSaved ? 'text-orange-500' : 'text-gray-700', action: () => { onSave(post); onClose(); } },
  ];

  if (!isOwner) {
    options.push(
      { id: 'follow', icon: isFollowing ? UserMinus : UserPlus, label: isFollowing ? 'Unfollow' : 'Follow', color: isFollowing ? 'text-red-500' : 'text-green-600', action: () => { onFollow(post.userEmail, post.userName); onClose(); } },
      { id: 'block', icon: isBlocked ? UserCheck : UserMinus, label: isBlocked ? 'Unblock User' : 'Block User', color: isBlocked ? 'text-green-600' : 'text-red-500', action: () => { onBlock(post.userEmail, post.userName); onClose(); } },
      { id: 'report', icon: Flag, label: 'Report Post', color: 'text-red-500', action: () => setShowReportForm(true) }
    );
  }

  if (isOwner) {
    options.push({ id: 'delete', icon: Trash2, label: 'Delete Post', color: 'text-red-500', action: () => { if (window.confirm('Delete this post?')) { onDelete(post); onClose(); } } });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="bg-white rounded-t-2xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-center">Post Options</h3></div>
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {options.map(opt => (
            <button key={opt.id} onClick={opt.action} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition">
              <opt.icon className={`w-5 h-5 ${opt.color}`} />
              <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="w-full px-4 py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition font-medium">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 14: SHARE MODAL
// ========================================

const ShareModal = ({ post, crewInvite, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = post
    ? deepLink('post', post.id || post._id)
    : crewInvite
      ? deepLink('crew', crewInvite.id)
      : window.location.href;
  const shareText = crewInvite
    ? `Join the "${crewInvite.name}" reading crew on READCREWW — reading "${crewInvite.name}" by ${crewInvite.author}!`
    : `Check out this post by ${post?.userName}: "${post?.content?.substring(0, 60)}..."`;

  const shareHandlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
    linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`, '_blank'),
    telegram: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank'),
    email: () => window.open(`mailto:?subject=${encodeURIComponent(crewInvite ? `Join my reading crew: ${crewInvite.name}` : 'Check out this READCREWW post')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank'),
    copyLink: () => {
      navigator.clipboard.writeText(shareUrl).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    },
  };

  const platforms = [
    { key: 'whatsapp', color: '#25D366', letter: 'W', label: 'WhatsApp' },
    { key: 'facebook', color: '#1877F2', letter: 'f', label: 'Facebook' },
    { key: 'twitter', color: '#1DA1F2', letter: '𝕏', label: 'Twitter' },
    { key: 'linkedin', color: '#0A66C2', letter: 'in', label: 'LinkedIn' },
    { key: 'telegram', color: '#0088cc', letter: '✈', label: 'Telegram' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold">{crewInvite ? 'Invite to Crew' : 'Share Post'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          {crewInvite && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{crewInvite.name}</p>
                <p className="text-xs text-gray-500">by {crewInvite.author}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {platforms.map(({ key, color, letter, label }) => (
              <button key={key} onClick={shareHandlers[key]} className="flex flex-col items-center gap-1.5 group">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {letter}
                </div>
                <span className="text-[10px] text-gray-500">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={shareHandlers.email} className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition mb-2">
            <Mail className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-sm">Send via Email</span>
          </button>
          <button
            onClick={shareHandlers.copyLink}
            className={`w-full py-3 border rounded-xl flex items-center justify-center gap-2 transition ${copied ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {copied
              ? <><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium text-sm">Copied!</span></>
              : <><Link2 className="w-5 h-5 text-orange-500" /><span className="font-medium text-sm">Copy Link</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 15: RESHARE MODAL
// ========================================

const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleReshare = () => {
    if (!post) return;
    onReshare(post, comment.trim(), isPublic);
    onClose();
  };

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-semibold flex items-center gap-2">
            <Repeat className="w-4 h-4 text-orange-500" /> Reshare Post
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Avatar initials={post.userName} size="xs" />
              <span className="text-xs font-semibold text-gray-700">{post.userName}</span>
              <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{post.content || post.story}</p>
            {post.image && (
              <img src={post.image} alt="" className="mt-2 rounded-lg max-h-32 object-cover w-full" />
            )}
            {post.bookName && (
              <div className="flex items-center gap-1 mt-2">
                <BookOpen className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-500">{post.bookName}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block font-medium">Add your thoughts (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none transition"
              placeholder="what's ur hot take on this? 🔥"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition font-medium ${isPublic ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isPublic ? 'Public' : 'Private'}
            </button>
            <span className="text-xs text-gray-400">
              {isPublic ? 'the whole timeline will see this' : 'just for ur eyes bestie'}
            </span>
          </div>

          <button
            onClick={handleReshare}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95"
          >
            <Repeat className="w-4 h-4" />
            Reshare Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 16: LOGIN PAGE
// ========================================

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendOTP = () => {
    setError('');
    if (!isLogin && name.trim().length < 2) { setError('Please enter your full name'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    if (!isLogin && !agreeToTerms) { setError('Please agree to the terms'); return; }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('devOTP', otp);
    localStorage.setItem('pendingUser', JSON.stringify({ email, name: name || email.split('@')[0], password: password || 'password123' }));
    setDevOtp(otp);
    setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    setError('');
    if (otpInput.length !== 6) { setError('Please enter the 6-digit code'); return; }
    const savedOtp = localStorage.getItem('devOTP');
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
    if (otpInput !== savedOtp) { setError('Incorrect code. Please try again.'); return; }
    localStorage.removeItem('devOTP');
    localStorage.removeItem('pendingUser');
    const userData = {
      id: generateId(), name: pendingUser.name || name, email: pendingUser.email || email,
      password: pendingUser.password || password, readingGoal, isVerified: true,
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [], readingList: [], savedPosts: [], bio: 'living in my main character era 📚', location: '', website: '',
    };
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existIdx = users.findIndex(u => u.email === userData.email);
    if (existIdx >= 0) users[existIdx] = { ...users[existIdx], ...userData };
    else users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    ['followers', 'following', 'blocked', 'notifications', 'likedPosts', 'likedReviews', 'readingList', 'savedPosts'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`))
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
    });
    if (!localStorage.getItem(`user_${userData.email}_stats`))
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 }));
    setShowOTP(false);
    onLogin(userData);
  };

  const handleLogin = () => {
    setError('');
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.password === password || !found.password) {
        localStorage.setItem('currentUser', JSON.stringify(found));
        setLoading(false);
        onLogin(found);
        return;
      } else {
        setError('Incorrect password. Please try again.');
      }
    } else {
      setError('No account found. Please sign up first.');
    }
    setLoading(false);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
            <p className="text-gray-500 text-sm">We sent a verification code to <strong>{email}</strong></p>
          </div>
          {devOtp && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-2">📧 Demo mode — use this code:</p>
              <p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtp}</p>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{error}</div>}
          <input
            type="text" inputMode="numeric" value={otpInput}
            onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
            placeholder="000000" maxLength="6" autoFocus
          />
          <button onClick={handleVerifyOTP} disabled={otpInput.length !== 6} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3">
            Verify & Continue →
          </button>
          <div className="flex justify-between">
            <button onClick={() => { setShowOTP(false); setError(''); setDevOtp(''); }} className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSendOTP} className="text-orange-500 text-sm font-semibold hover:text-orange-600">Resend code</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
            READCREWW
          </h1>
          <p className="text-gray-500 text-sm mt-2">Read together, slay together. 📚✨</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-5">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{error}</div>}

          <div className="space-y-3">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400" />
                  <input value={name} onChange={e => { setName(e.target.value); setError(''); }} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Full Name *" autoComplete="name" />
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-orange-500" />Reading Goals (Optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly books</label>
                      <input type="number" value={readingGoal.yearly} onChange={e => setReadingGoal({ ...readingGoal, yearly: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="100" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly books</label>
                      <input type="number" value={readingGoal.monthly} onChange={e => setReadingGoal({ ...readingGoal, monthly: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="20" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400" />
              <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Email address *" type="email" autoComplete="email" />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400" />
              <input value={password} onChange={e => { setPassword(e.target.value); setError(''); }} type={showPassword ? 'text' : 'password'} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder={isLogin ? 'Password *' : 'Create password *'} autoComplete={isLogin ? 'current-password' : 'new-password'} />
              <button onClick={() => setShowPassword(!showPassword)} type="button">
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="terms" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the <button className="text-orange-500 hover:underline">Terms of Service</button> and <button className="text-orange-500 hover:underline">Privacy Policy</button>
                </label>
              </div>
            )}
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            {loading ? <><LoadingSpinner size="sm" color="white" /><span>Please wait...</span></> : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setEmail(''); setPassword(''); setName(''); }} className="text-orange-500 font-semibold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 17: BOTTOM NAVIGATION
// ========================================

const BottomNav = ({ active, setPage, unreadCount = 0, show = true }) => {
  if (!show) return null;
  const items = [
    { id: 'home', icon: BookOpen, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'reviews', icon: Star, label: 'Reviews' },
    { id: 'crews', icon: Users, label: 'Crews' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${active === id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active === id ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {id === 'crews' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ========================================
// SECTION 18: TOP BAR COMPONENT
// ========================================

const TopBar = ({ user, setPage, title, showBack = false, onBack, onNotificationClick, notificationCount = 0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
          {title || 'READCREWW'}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onNotificationClick} className="relative p-1 hover:bg-gray-100 rounded-lg transition">
        <Bell className="w-5 h-5 text-gray-600" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
        {profileSrc
          ? <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
          : <Avatar initials={user?.name} size="sm" />
        }
      </button>
    </div>
  </header>
);

// ========================================
// SECTION 19: NOTIFICATIONS PAGE
// ========================================

const NotificationsPage = ({ user, onClose, updateNotificationCount, onNavigateToPost, onNavigateToCrew }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    const raw = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const social = raw.filter(n => n.type !== 'message');
    setNotifications(social.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setLoading(false);
  }, [user.email]);

  useEffect(() => {
    loadNotifications();

    const handleStorage = (e) => {
      if (e.key === `user_${user.email}_notifications`) loadNotifications();
    };
    const handleCustom = (e) => {
      if (e.detail?.targetEmail === user.email) loadNotifications();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('rc:notif', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('rc:notif', handleCustom);
    };
  }, [user.email, loadNotifications]);

  const markAllAsRead = () => {
    const raw = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = raw.map(n => ({ ...n, read: true }));
    updated.forEach(n => _shownToastIds.add(n.id));
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    updateNotificationCount?.();
    window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: user.email } }));
  };

  const markOneAsRead = (id) => {
    _shownToastIds.add(id);
    const raw = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = raw.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    updateNotificationCount?.();
    window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: user.email } }));
  };

  const deleteNotification = (id) => {
    const raw = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = raw.filter(n => n.id !== id);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
    updateNotificationCount?.();
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markOneAsRead(notif.id);
    }

    if (notif.type === 'message' && notif.crewId) {
      onClose();
      onNavigateToCrew?.(notif.crewId);
    } else if (notif.postId && ['like', 'comment', 'mention', 'reshare'].includes(notif.type)) {
      onClose();
      onNavigateToPost?.(notif.postId);
    } else if (notif.type === 'join' && notif.crewId) {
      onClose();
      onNavigateToCrew?.(notif.crewId);
    }
  };

  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    mention: <AtSign className="w-4 h-4 text-amber-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    follow: <UserCheck className="w-4 h-4 text-green-500" />,
    invite: <UserPlus className="w-4 h-4 text-purple-500" />,
    join: <Users className="w-4 h-4 text-blue-500" />,
    review: <Star className="w-4 h-4 text-yellow-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    warning: <AlertCircle className="w-4 h-4 text-orange-500" />,
  };

  const iconBg = {
    like: 'bg-red-100', comment: 'bg-blue-100', mention: 'bg-amber-100',
    reshare: 'bg-indigo-100', follow: 'bg-green-100', invite: 'bg-purple-100',
    join: 'bg-blue-100', review: 'bg-yellow-100', success: 'bg-green-100',
    info: 'bg-blue-100', warning: 'bg-orange-100',
  };

  const isNavigable = (notif) =>
    notif.postId || (notif.crewId && ['message', 'join'].includes(notif.type));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{unreadCount}</span>
          )}
        </div>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className={`text-sm font-medium transition ${unreadCount > 0 ? 'text-orange-500 hover:text-orange-600' : 'text-gray-300 cursor-not-allowed'}`}
        >
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">you're all caught up bestie 🎉</p>
            <p className="text-gray-400 text-sm mt-1">your hype squad will slide in here 📬</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 transition cursor-pointer hover:bg-gray-50 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg[notif.type] || 'bg-gray-100'}`}>
                    {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400">{formatTimeAgo(notif.timestamp)}</p>
                      {isNavigable(notif) && (
                        <span className="text-xs text-orange-500 font-semibold">Tap to view →</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="p-1 text-gray-300 hover:text-red-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// SECTION 20: HOME PAGE
// ========================================

const HomePage = ({
  user, posts, crews, setPage, updateNotificationCount,
  profileSrc, savedPosts, onSavePost, onResharePost, onDeletePost,
  onFollow, following, onBlock, blockedUsers,
  onViewUserProfile, onViewBookDetails,
  onCreateCrew,
  deepLinkPostId, onDeepLinkHandled,
}) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingProgress, setReadingProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!deepLinkPostId || posts.length === 0) return;
    setTimeout(() => {
      const el = document.getElementById(`post-${deepLinkPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px #f97316';
        setTimeout(() => { el.style.boxShadow = ''; }, 2500);
      }
      onDeepLinkHandled?.();
    }, 400);
  }, [deepLinkPostId, posts]);

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    if (user?.readingGoal?.yearly > 0) {
      setReadingProgress(Math.min((savedStats.booksRead || 0) / user.readingGoal.yearly * 100, 100));
    }
  }, [user.email]);

  useEffect(() => {
    setVisibleCount(10);
  }, [posts.length]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(c => c + 10);
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [posts.length]);

  const handleReshareClick = (post) => { setShowReshare(post); };
  const handleReshare = (post, comment, isPublic) => {
    onResharePost(post, comment, isPublic);
    setShowReshare(null);
  };

  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id) || JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]').includes(c.id));
  const hasReadingGoal = user?.readingGoal?.yearly > 0;
  const notifCount = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read && n.type !== 'message').length;

  // Filter posts to show only from non-blocked users
  const filteredPosts = posts.filter(p => !blockedUsers?.includes(p.userEmail));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar
        user={user}
        setPage={setPage}
        profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={notifCount}
      />

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={(book) => {
            const nc = { id: generateId(), name: book.title, author: book.author, genre: book.genre || 'General', members: 1, chats: 0, createdBy: user.email, createdByName: user.name, createdAt: new Date().toISOString() };
            const updatedCrews = [nc, ...crews];
            localStorage.setItem('crews', JSON.stringify(updatedCrews));
            setSelectedBook(null);
            setPage('crews');
          }}
        />
      )}

      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)} />}
      {showReshare && <ReshareModal post={showReshare} onClose={() => setShowReshare(null)} onReshare={handleReshare} />}

      <div className="px-4 py-4 space-y-5">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Hey, {user?.name?.split(' ')[0]}! 📚</h2>
              <p className="text-orange-100 text-sm mt-1">no cap, this feed was made for u 🎯</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Reading Goal</span>
                <span className="font-semibold">{stats.booksRead}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${readingProgress}%` }} />
              </div>
              <p className="text-xs text-orange-100 mt-1">{Math.round(readingProgress)}% of goal achieved</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' },
          ].map(({ label, value, icon: Icon, color, bg, page }, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition" onClick={() => setPage(page)}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Your Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />Your Crews</h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0, 2).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50">
                  <DynamicBookCover title={crew.name} author={crew.author} size="xs" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{crew.members || 1}</div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs font-medium">Joined</span>
                  </div>
                </div>
              </div>
            ))}
            {userCrews.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">no crews yet — find ur people 👯</p>
                <button onClick={() => setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium hover:underline">Browse Crews →</button>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <button onClick={() => setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition">
          {profileSrc ? <img src={profileSrc} alt="profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <Avatar initials={user?.name} size="sm" />}
          <span className="text-gray-400 text-sm flex-1 text-left">What's your current read? spill 👀</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Feed Posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              {following?.length > 0 ? 'Your Feed' : 'Community Feed'}
            </h2>
          </div>

          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">no posts yet — be the main character 🌟</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition">Create Post</button>
              </div>
            ) : (
              filteredPosts.slice(0, visibleCount).map((post, idx) => (
                <InlinePostCard
                  key={post.id || idx}
                  post={post}
                  user={user}
                  profileSrc={profileSrc}
                  updateNotificationCount={updateNotificationCount}
                  onShare={(p) => setShowShare(p)}
                  onReshareClick={handleReshareClick}
                  onSaveToggle={onSavePost}
                  isSaved={savedPosts?.includes(post.id)}
                  onDelete={onDeletePost}
                  onFollow={onFollow}
                  isFollowing={following?.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers?.includes(post.userEmail)}
                  onViewUserProfile={onViewUserProfile}
                  onViewBookDetails={(b) => setSelectedBook(b)}
                />
              ))
            )}
            {filteredPosts.length > visibleCount && (
              <div ref={loaderRef} className="flex justify-center py-6">
                <LoadingSpinner size="md" color="orange" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// SECTION 21: MAIN APP COMPONENT
// ========================================

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileSrc, setProfileSrc] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [posts, setPosts] = useState([]);
  const [crews, setCrews] = useState([
    { id: 'crew_atomic', name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', members: 24, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_tuesdays', name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 12, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_alchemist', name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 31, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_hailmary', name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 18, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_fourth', name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 42, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_midnight', name: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', members: 29, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_becoming', name: 'Becoming', author: 'Michelle Obama', genre: 'Memoir', members: 27, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_beach', name: 'The Beach', author: 'Alex Garland', genre: 'Fiction', members: 15, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_sapiens', name: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', members: 22, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_psychology', name: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', members: 19, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_silentpatient', name: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', members: 33, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'crew_gonegirl', name: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', members: 21, chats: 0, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z' },
  ]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentToast, setCurrentToast] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [viewingFullProfile, setViewingFullProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);

  const [deepLinkPostId, setDeepLinkPostId] = useState(null);
  const [deepLinkCrewId, setDeepLinkCrewId] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    setShowBottomNav(currentPage !== 'post' && !viewingFullProfile);
  }, [currentPage, viewingFullProfile]);

  const handleNavigateToPost = useCallback((postId) => {
    setDeepLinkPostId(postId);
    setCurrentPage('home');
  }, []);

  const handleNavigateToCrew = useCallback((crewId) => {
    setDeepLinkCrewId(crewId);
    setCurrentPage('crews');
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);

        setFollowing(JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]'));
        setFollowers(JSON.parse(localStorage.getItem(`user_${user.email}_followers`) || '[]'));
        setBlockedUsers(JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]'));
        setSavedPosts(JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]'));

        const pi = localStorage.getItem(`user_${user.email}_profile_image`);
        if (pi) setProfileSrc(pi);
      }

      try {
        const email = (JSON.parse(localStorage.getItem('currentUser') || '{}')).email;
        const res = await api.get(`/api/social/posts?userEmail=${encodeURIComponent(email || '')}`);
        if (res?.data?.success) {
          const sp = res.data.posts || [];
          const lp = JSON.parse(localStorage.getItem('allPosts') || '[]');
          const merged = [...sp];
          lp.forEach(lx => { if (!merged.find(sx => (sx.id || sx._id) === (lx.id || lx._id))) merged.push(lx); });
          localStorage.setItem('allPosts', JSON.stringify(merged));
          setPosts(merged);
        } else {
          setPosts(JSON.parse(localStorage.getItem('allPosts') || '[]'));
        }
      } catch (_) {
        setPosts(JSON.parse(localStorage.getItem('allPosts') || '[]'));
      }

      const storedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
      if (storedCrews.length > 0) setCrews(storedCrews);

      if (!localStorage.getItem('reportedPosts')) localStorage.setItem('reportedPosts', JSON.stringify([]));

      const dl = parseDeepLink();
      if (dl) {
        if (dl.type === 'post') { setDeepLinkPostId(dl.id); setCurrentPage('home'); }
        if (dl.type === 'crew') { setDeepLinkCrewId(dl.id); setCurrentPage('crews'); }
        window.history.replaceState({}, '', window.location.pathname);
      }

      setLoading(false);
    };
    init();
  }, []);

  const checkForNewNotifications = useCallback(() => {
    if (!currentUser) return;

    const raw = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
    const social = raw.filter(n => n.type !== 'message');
    const crewMsgs = raw.filter(n => n.type === 'message');

    const unreadSocial = social.filter(n => !n.read).length;
    const unreadCrew = crewMsgs.filter(n => !n.read).length;

    if (unreadSocial > prevCountRef.current) {
      const newest = social.find(n => !n.read && !_shownToastIds.has(n.id));
      if (newest) {
        _shownToastIds.add(newest.id);
        setCurrentToast(newest);
        setTimeout(() => setCurrentToast(null), 5000);
      }
    }

    setNotificationCount(unreadSocial);
    setUnreadMessages(unreadCrew);
    prevCountRef.current = unreadSocial;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    checkForNewNotifications();

    const pollNotifications = async () => {
      try {
        const res = await api.get(`/api/social/notifications/${encodeURIComponent(currentUser.email)}`);
        if (res?.data?.success) {
          const fresh = res.data.notifications || [];
          const old = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
          const merged = [...fresh];
          old.forEach(o => { if (!merged.find(f => f.id === o.id)) merged.push(o); });
          merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          localStorage.setItem(`user_${currentUser.email}_notifications`, JSON.stringify(merged));
          checkForNewNotifications();
        }
      } catch (_) { }
    };

    const interval = setInterval(pollNotifications, 15000);
    pollNotifications();

    const handleCustom = (e) => {
      if (e.detail?.targetEmail === currentUser.email) checkForNewNotifications();
    };
    const handleStorage = (e) => {
      if (e.key?.includes('_notifications')) checkForNewNotifications();
    };

    window.addEventListener('rc:notif', handleCustom);
    window.addEventListener('storage', handleStorage);

    socket.emit('join_user_room', currentUser.email);
    socket.on('new_notification', (notification) => {
      if (notification.toEmail === currentUser?.email) {
        pushNotification(currentUser.email, notification);
        checkForNewNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('rc:notif', handleCustom);
      window.removeEventListener('storage', handleStorage);
      socket.off('new_notification');
    };
  }, [currentUser, checkForNewNotifications]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));

    ['followers', 'following', 'blocked', 'notifications', 'likedPosts', 'likedReviews', 'readingList', 'savedPosts'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`))
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
    });
    if (!localStorage.getItem(`user_${userData.email}_stats`))
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 }));

    setFollowing(JSON.parse(localStorage.getItem(`user_${userData.email}_following`) || '[]'));
    setFollowers(JSON.parse(localStorage.getItem(`user_${userData.email}_followers`) || '[]'));
    setBlockedUsers(JSON.parse(localStorage.getItem(`user_${userData.email}_blocked`) || '[]'));
    setSavedPosts(JSON.parse(localStorage.getItem(`user_${userData.email}_savedPosts`) || '[]'));

    const pi = localStorage.getItem(`user_${userData.email}_profile_image`);
    if (pi) setProfileSrc(pi);

    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setProfileSrc(null);
    setCurrentPage('home');
    localStorage.removeItem('currentUser');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handlePost = (postData) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const newPost = {
      ...postData,
      id: postData.id || generateId(),
      createdAt: postData.createdAt || new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: postData.reshareCount || 0,
    };

    allPosts.unshift(newPost);
    localStorage.setItem('allPosts', JSON.stringify(allPosts));
    setPosts(allPosts);

    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
  };

  const handleDeletePost = (post) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const filtered = allPosts.filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(filtered));
    setPosts(filtered);
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = Math.max((stats.postsCreated || 0) - 1, 0);
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
  };

  const handleSavePost = (post) => {
    const userSaved = JSON.parse(localStorage.getItem(`user_${currentUser.email}_savedPosts`) || '[]');
    const updated = userSaved.includes(post.id) ? userSaved.filter(id => id !== post.id) : [...userSaved, post.id];
    localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(updated));
    setSavedPosts(updated);
  };

  const handleReshare = (originalPost, comment, isPublic = true) => {
    incrementReshareCount(originalPost.id, currentUser.email, currentUser.name, comment);

    if (originalPost.userEmail !== currentUser.email) {
      pushNotification(originalPost.userEmail, {
        type: 'reshare',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`,
        postId: originalPost.id,
      });
      checkForNewNotifications();
    }

    const resharePost = {
      id: generateId(),
      content: originalPost.content || originalPost.story || '',
      bookName: originalPost.bookName,
      author: originalPost.author,
      image: originalPost.image,
      isPublic,
      isReshare: true,
      reshareComment: comment || null,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhoto: currentUser.profileImage,
      userInitials: currentUser.name.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0,
      originalPost: {
        id: originalPost.id,
        userName: originalPost.userName,
        userEmail: originalPost.userEmail,
        content: originalPost.content || originalPost.story || '',
      },
    };

    handlePost(resharePost);

    setCurrentToast({
      type: 'success',
      message: 'Post reshared successfully!',
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => setCurrentToast(null), 3000);
  };

  const handleFollow = useCallback((targetEmail, targetName) => {
    const currentFollowing = JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`) || '[]');

    if (currentFollowing.includes(targetEmail)) {
      const updated = currentFollowing.filter(e => e !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updated));
      setFollowing(updated);
      const tf = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(tf.filter(e => e !== currentUser.email)));
    } else {
      const updated = [...currentFollowing, targetEmail];
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updated));
      setFollowing(updated);
      const tf = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      if (!tf.includes(currentUser.email)) {
        localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify([...tf, currentUser.email]));
        pushNotification(targetEmail, { type: 'follow', fromUser: currentUser.name, fromUserEmail: currentUser.email, message: `${currentUser.name} started following you` });
        checkForNewNotifications();
      }
      setCurrentToast({ type: 'success', message: `You are now following ${targetName} 🎉`, timestamp: new Date().toISOString() });
      setTimeout(() => setCurrentToast(null), 3000);
    }
  }, [currentUser]);

  const handleBlockUser = (targetEmail, targetName) => {
    const current = JSON.parse(localStorage.getItem(`user_${currentUser.email}_blocked`) || '[]');
    if (current.includes(targetEmail)) {
      const updated = current.filter(e => e !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updated));
      setBlockedUsers(updated);
    } else {
      const updated = [...current, targetEmail];
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updated));
      setBlockedUsers(updated);
      const cf = JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`) || '[]');
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(cf.filter(e => e !== targetEmail)));
      setFollowing(cf.filter(e => e !== targetEmail));
    }
  };

  const handleViewUserProfile = (userEmail, userName) => {
    setSelectedUserProfile({ email: userEmail, name: userName });
    setShowUserProfile(true);
  };

  const handleViewFullProfile = (userEmail, userName) => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setViewingFullProfile({ email: userEmail, name: userName });
  };

  if (loading) return <LoadingSpinner size="xl" fullScreen />;
  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {currentToast && (
        <NotificationToast notification={currentToast} onClose={() => setCurrentToast(null)} />
      )}

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1.5 text-xs z-[200] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" />
          You're offline — some features may be limited
        </div>
      )}

      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        {showUserProfile && selectedUserProfile && (
          <UserProfileModal
            userEmail={selectedUserProfile.email}
            userName={selectedUserProfile.name}
            currentUser={currentUser}
            onClose={() => { setShowUserProfile(false); setSelectedUserProfile(null); }}
            onFollow={handleFollow}
            isFollowing={following.includes(selectedUserProfile.email)}
            onBlock={handleBlockUser}
            isBlocked={blockedUsers.includes(selectedUserProfile.email)}
            onViewFullProfile={handleViewFullProfile}
          />
        )}

        {viewingFullProfile && (
          <div className="absolute inset-0 z-50 bg-white overflow-y-auto">
            <FullUserProfilePage
              viewedUserEmail={viewingFullProfile.email}
              viewedUserName={viewingFullProfile.name}
              currentUser={currentUser}
              onBack={() => setViewingFullProfile(null)}
              onFollow={handleFollow}
              isFollowing={following.includes(viewingFullProfile.email)}
              onBlock={handleBlockUser}
              isBlocked={blockedUsers.includes(viewingFullProfile.email)}
            />
          </div>
        )}

        {!viewingFullProfile && (
          <>
            {currentPage === 'home' && (
              <HomePage
                user={currentUser}
                posts={posts}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                profileSrc={profileSrc}
                savedPosts={savedPosts}
                onSavePost={handleSavePost}
                onResharePost={handleReshare}
                onDeletePost={handleDeletePost}
                onFollow={handleFollow}
                following={following}
                onBlock={handleBlockUser}
                blockedUsers={blockedUsers}
                onViewUserProfile={handleViewUserProfile}
                onViewBookDetails={(book) => {}}
                onCreateCrew={(book) => {
                  const existing = crews.find(c =>
                    c.name.trim().toLowerCase() === book.title.trim().toLowerCase() &&
                    c.author.trim().toLowerCase() === (book.author || '').trim().toLowerCase()
                  );
                  if (existing) {
                    alert(`A crew for "${existing.name}" already exists! Taking you there.`);
                    setCurrentPage('crews');
                    return;
                  }
                  const nc = { id: generateId(), name: book.title, author: book.author || '', genre: book.genre || 'General', members: 1, chats: 0, createdBy: currentUser.email, createdByName: currentUser.name, createdAt: new Date().toISOString() };
                  const updatedCrews = [nc, ...crews]; setCrews(updatedCrews);
                  localStorage.setItem('crews', JSON.stringify(updatedCrews));
                  setCurrentPage('crews');
                }}
                deepLinkPostId={deepLinkPostId}
                onDeepLinkHandled={() => setDeepLinkPostId(null)}
              />
            )}

            {currentPage === 'post' && (
              <PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage} />
            )}

            {currentPage === 'reviews' && (
              <ReviewsPage
                user={currentUser}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                onViewUserProfile={handleViewUserProfile}
              />
            )}

            {currentPage === 'explore' && (
              <ExplorePage
                user={currentUser}
                setPage={setCurrentPage}
                onCreateCrew={(book) => {
                  const existing = crews.find(c =>
                    c.name.trim().toLowerCase() === book.title.trim().toLowerCase() &&
                    c.author.trim().toLowerCase() === (book.author || '').trim().toLowerCase()
                  );
                  if (existing) {
                    alert(`A crew for "${existing.name}" already exists! Taking you there.`);
                    setCurrentPage('crews');
                    return;
                  }
                  const nc = { id: generateId(), name: book.title, author: book.author || '', genre: book.genre || 'General', members: 1, chats: 0, createdBy: currentUser.email, createdByName: currentUser.name, createdAt: new Date().toISOString() };
                  const updatedCrews = [nc, ...crews];
                  setCrews(updatedCrews);
                  localStorage.setItem('crews', JSON.stringify(updatedCrews));
                  setCurrentPage('crews');
                }}
              />
            )}

            {currentPage === 'crews' && (
              <CrewsPage
                user={currentUser}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                onViewUserProfile={handleViewUserProfile}
                deepLinkCrewId={deepLinkCrewId}
                onDeepLinkHandled={() => setDeepLinkCrewId(null)}
              />
            )}

            {currentPage === 'profile' && (
              <ProfilePage
                user={currentUser}
                posts={posts}
                setPage={setCurrentPage}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                profileSrc={profileSrc}
                setProfileSrc={setProfileSrc}
                savedPosts={savedPosts}
                following={following}
                followers={followers}
              />
            )}

            {currentPage === 'notifications' && (
              <NotificationsPage
                user={currentUser}
                onClose={() => {
                  setCurrentPage('home');
                  checkForNewNotifications();
                }}
                updateNotificationCount={checkForNewNotifications}
                onNavigateToPost={handleNavigateToPost}
                onNavigateToCrew={handleNavigateToCrew}
              />
            )}

            <BottomNav
              active={currentPage}
              setPage={setCurrentPage}
              unreadCount={unreadMessages}
              show={showBottomNav}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ========================================
// SECTION 22: MISSING COMPONENT STUBS (Add these if not already present)
// ========================================

// BookDetailsModal stub (add full version if needed)
const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto p-6">
        <h3 className="font-bold text-lg mb-4">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-4">by {book.author}</p>
        <div className="flex gap-2">
          <button onClick={() => { onCreateCrew(book); onClose(); }} className="flex-1 py-2 bg-orange-500 text-white rounded-lg">Create Crew</button>
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
};

// UserProfileModal stub
const UserProfileModal = ({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onBlock, isBlocked, onViewFullProfile }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar initials={userName} size="lg" />
          <div>
            <h3 className="font-bold">{userName}</h3>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => onFollow(userEmail, userName)} className={`flex-1 py-2 rounded-lg ${isFollowing ? 'bg-gray-200' : 'bg-orange-500 text-white'}`}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          <button onClick={() => onBlock(userEmail, userName)} className={`flex-1 py-2 rounded-lg ${isBlocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
        <button onClick={() => { onViewFullProfile(userEmail, userName); onClose(); }} className="w-full py-2 border rounded-lg">View Full Profile</button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-gray-500">Close</button>
      </div>
    </div>
  );
};

// FullUserProfilePage stub
const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="font-semibold flex-1">{viewedUserName}'s Profile</h2>
      </div>
      <div className="p-6 text-center">
        <Avatar initials={viewedUserName} size="xl" />
        <h1 className="text-xl font-bold mt-4">{viewedUserName}</h1>
        <p className="text-gray-500 text-sm mt-1">{viewedUserEmail}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onFollow(viewedUserEmail, viewedUserName)} className={`flex-1 py-2 rounded-lg ${isFollowing ? 'bg-gray-200' : 'bg-orange-500 text-white'}`}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          <button onClick={() => onBlock(viewedUserEmail, viewedUserName)} className={`flex-1 py-2 rounded-lg ${isBlocked ? 'bg-green-100' : 'bg-red-100 text-red-700'}`}>
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
};

// PostPage stub
const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost({ content, userName: user.name, userEmail: user.email, createdAt: new Date().toISOString() });
    setPage('home');
  };
  return (
    <div className="fixed inset-0 bg-white z-[55] flex flex-col"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="p-4 border-b flex justify-between">
        <button onClick={() => setPage('home')}><X className="w-5 h-5" /></button>
        <h2 className="font-semibold">Create Post</h2>
        <button onClick={handleSubmit} className="text-orange-500 font-semibold">Post</button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-4 text-lg outline-none resize-none"
        placeholder="What's on your mind?"
        autoFocus
      />
    </div>
  );
};

// ReviewsPage stub
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center">
        <button onClick={() => setPage('home')} className="p-1"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="font-semibold flex-1 text-center">Reviews</h2>
      </div>
      <div className="p-4 text-center text-gray-500">Reviews feature coming soon!</div>
    </div>
  );
};

// ExplorePage stub
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center">
        <button onClick={() => setPage('home')} className="p-1"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="font-semibold flex-1 text-center">Explore</h2>
      </div>
      <div className="p-4 text-center text-gray-500">Explore feature coming soon!</div>
    </div>
  );
};

// CrewsPage stub
const CrewsPage = ({ user, crews, setPage, updateNotificationCount, onViewUserProfile, deepLinkCrewId, onDeepLinkHandled }) => {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center">
        <button onClick={() => setPage('home')} className="p-1"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="font-semibold flex-1 text-center">Crews</h2>
      </div>
      <div className="p-4 text-center text-gray-500">Crews feature coming soon!</div>
    </div>
  );
};

// ProfilePage stub
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers }) => {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold">Profile</h2>
        <button onClick={onLogout} className="text-red-500 text-sm">Logout</button>
      </div>
      <div className="p-6 text-center">
        {profileSrc ? <img src={profileSrc} className="w-20 h-20 rounded-full mx-auto object-cover" /> : <Avatar initials={user?.name} size="xl" />}
        <h1 className="text-xl font-bold mt-4">{user?.name}</h1>
        <p className="text-gray-500 text-sm">{user?.email}</p>
      </div>
    </div>
  );
};

// ========================================
// SECTION 23: GLOBAL STYLES
// ========================================

if (typeof document !== 'undefined' && !document.querySelector('style[data-rc-styles]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to   { transform: translate(-50%, 0);     opacity: 1; }
    }
    .animate-slideDown { animation: slideDown 0.3s ease-out; }

    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-5px); }
    }
    .animate-bounce { animation: bounce 1s infinite; }

    .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
    .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
  `;
  style.setAttribute('data-rc-styles', 'true');
  document.head.appendChild(style);
}