// ========================================
// App.jsx - READCREWW Social Platform
// Complete Rewrite - All Bugs Fixed:
// ✅ Global Likes & Comments (cross-user sync)
// ✅ Personalized Feed Algorithm
// ✅ Fixed Notifications (no filter tabs, mark-all-read works)
// ✅ Fixed Reshare (persists globally)
// ✅ Real comment counts on posts
// Version: 3.0 — Complete
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
  AlarmClock, Timer, Hourglass,
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
  const candidates = allPosts.filter(p => !blockedUsers.includes(p.userEmail) && p.userEmail !== userEmail);

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
// SECTION 4: GLOBAL INTERACTION HELPERS
// ========================================

const getPostLikes = (postId) => {
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  return likedBy.length;
};

const hasUserLikedPost = (postId, userEmail) => {
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  return likedBy.includes(userEmail);
};

const addGlobalLike = (postId, userEmail) => {
  const likedBy = JSON.parse(localStorage.getItem(`post_${postId}_likedBy`) || '[]');
  if (likedBy.includes(userEmail)) return likedBy.length;

  likedBy.push(userEmail);
  localStorage.setItem(`post_${postId}_likedBy`, JSON.stringify(likedBy));

  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const updatedPosts = allPosts.map(p =>
    p.id === postId ? { ...p, likes: likedBy.length } : p
  );
  localStorage.setItem('allPosts', JSON.stringify(updatedPosts));

  const userLiked = JSON.parse(localStorage.getItem(`user_${userEmail}_likedPosts`) || '[]');
  if (!userLiked.includes(postId)) {
    userLiked.push(postId);
    localStorage.setItem(`user_${userEmail}_likedPosts`, JSON.stringify(userLiked));
  }

  return likedBy.length;
};

const getPostComments = (postId) => {
  return JSON.parse(localStorage.getItem(`post_${postId}_comments`) || '[]');
};

const fetchCommentsFromServer = async (postId) => {
  const res = await api.get(`/api/social/posts/${postId}/comments`);
  if (res?.data?.success) {
    const cmts = res.data.comments || [];
    localStorage.setItem(`post_${postId}_comments`, JSON.stringify(cmts));
    const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
    localStorage.setItem('allPosts', JSON.stringify(
      all.map(p => p.id === postId ? { ...p, comments: cmts.filter(c => !c.parentId).length } : p)
    ));
    return cmts;
  }
  return getPostComments(postId);
};

const postCommentToServer = async (postId, commentData) => {
  const res = await api.post(`/api/social/posts/${postId}/comments`, commentData);
  if (res?.data?.success) {
    const cmts = res.data.comments || [];
    localStorage.setItem(`post_${postId}_comments`, JSON.stringify(cmts));
    const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
    localStorage.setItem('allPosts', JSON.stringify(
      all.map(p => p.id === postId ? { ...p, comments: cmts.filter(c => !c.parentId).length } : p)
    ));
    return cmts;
  }
  const cmts = getPostComments(postId);
  cmts.push(commentData);
  localStorage.setItem(`post_${postId}_comments`, JSON.stringify(cmts));
  const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
  localStorage.setItem('allPosts', JSON.stringify(
    all.map(p => p.id === postId ? { ...p, comments: cmts.filter(c => !c.parentId).length } : p)
  ));
  return cmts;
};

const incrementReshareCount = (postId) => {
  const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
  const updatedPosts = allPosts.map(p =>
    p.id === postId ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p
  );
  localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  return (updatedPosts.find(p => p.id === postId)?.reshareCount) || 0;
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

  const thirtySecsAgo = Date.now() - 30_000;
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
// SECTION 6: UTILITY FUNCTIONS
// ========================================

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (isNaN(diff)) return '';
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ========================================
// SECTION 7: NOTIFICATION TOAST COMPONENT
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

  const iconBgs = {
    like: 'bg-red-100', comment: 'bg-blue-100', mention: 'bg-amber-100',
    reshare: 'bg-indigo-100', follow: 'bg-green-100', invite: 'bg-purple-100',
    message: 'bg-emerald-100', join: 'bg-blue-100', leave: 'bg-red-100',
    review: 'bg-yellow-100', warning: 'bg-orange-100', success: 'bg-green-100',
    info: 'bg-blue-100',
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideDown">
      <div className={`rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden`}>
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
// SECTION 12: CREW PRESENCE HOOK
// ========================================

const useCrewPresence = (crewId, userId, userName) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const heartbeatRef = useRef(null);
  const PRESENCE_TTL = 30_000;
  const HEARTBEAT_INTV = 15_000;

  const markPresent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(
      `crew_${crewId}_presence_${userId}`,
      JSON.stringify({ userId, userName, ts: Date.now() })
    );
  }, [crewId, userId, userName]);

  const markAbsent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.removeItem(`crew_${crewId}_presence_${userId}`);
  }, [crewId, userId]);

  const getOnlineUsers = useCallback(() => {
    if (!crewId) return [];
    const now = Date.now();
    const online = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`crew_${crewId}_presence_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && now - data.ts < PRESENCE_TTL) {
            online.push(data);
          } else {
            localStorage.removeItem(key);
          }
        } catch (_) { localStorage.removeItem(key); }
      }
    }
    return online;
  }, [crewId]);

  useEffect(() => {
    if (!crewId || !userId) return;
    markPresent();
    const online = getOnlineUsers();
    setOnlineUsers(online);
    setOnlineCount(online.length);

    heartbeatRef.current = setInterval(() => {
      markPresent();
      const updated = getOnlineUsers();
      setOnlineUsers(updated);
      setOnlineCount(updated.length);
    }, HEARTBEAT_INTV);

    return () => { clearInterval(heartbeatRef.current); markAbsent(); };
  }, [crewId, userId, markPresent, markAbsent, getOnlineUsers]);

  return { onlineUsers, onlineCount };
};

// ========================================
// SECTION 13: TYPING INDICATOR HOOK
// ========================================

const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const TYPING_TTL = 3000;

  const broadcastTyping = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(
      `crew_${crewId}_typing_${userId}`,
      JSON.stringify({ userId, userName, ts: Date.now() })
    );
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
    }, TYPING_TTL);
  }, [crewId, userId, userName]);

  const stopTyping = useCallback(() => {
    if (!crewId || !userId) return;
    clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  }, [crewId, userId]);

  useEffect(() => {
    if (!crewId) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const typing = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`crew_${crewId}_typing_`) && !key.includes(`_${userId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && now - data.ts < TYPING_TTL) {
              typing.push(data.userName);
            } else {
              localStorage.removeItem(key);
            }
          } catch (_) { localStorage.removeItem(key); }
        }
      }
      setTypingUsers(typing);
    }, 1500);
    return () => { clearInterval(interval); stopTyping(); };
  }, [crewId, userId, stopTyping]);

  return { typingUsers, broadcastTyping, stopTyping };
};

// ========================================
// SECTION 14: READ RECEIPT HELPERS
// ========================================

const markCrewMessagesRead = (crewId, userId) => {
  if (!crewId || !userId) return;
  localStorage.setItem(`crew_${crewId}_lastRead_${userId}`, Date.now().toString());
};

const getReadStatus = (msgTimestamp, crewId, onlineCount) => {
  const msgTime = new Date(msgTimestamp).getTime();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`crew_${crewId}_lastRead_`)) {
      const lastRead = parseInt(localStorage.getItem(key) || '0');
      if (lastRead >= msgTime) return 'read';
    }
  }
  return onlineCount > 1 ? 'delivered' : 'sent';
};

// ========================================
// SECTION 15: BOOK DETAILS MODAL
// ========================================

const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => { fetchBookDetails(); }, [book]);

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const info = data.items?.[0]?.volumeInfo;
        if (info) {
          setDetails({
            title: info.title,
            subtitle: info.subtitle,
            authors: info.authors || [book.author],
            description: info.description || 'No description available.',
            pageCount: info.pageCount,
            publishedDate: info.publishedDate,
            publisher: info.publisher,
            categories: info.categories || [],
            averageRating: info.averageRating,
            ratingsCount: info.ratingsCount,
            previewLink: info.previewLink,
            infoLink: info.infoLink,
            language: info.language,
            isbn: info.industryIdentifiers,
          });
          setLoading(false);
          return;
        }
      }
    } catch (_) { }

    setDetails({
      title: book.title,
      authors: [book.author],
      description: 'Details temporarily unavailable.',
      categories: [],
    });
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Book Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : details ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <DynamicBookCover title={book.title} author={book.author} size="lg" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{details.title}</h2>
                {details.subtitle && <p className="text-sm text-gray-600 mt-1">{details.subtitle}</p>}
                <p className="text-gray-500 text-sm mt-1">by {details.authors?.join(', ') || book.author}</p>
                {details.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}
                {details.averageRating && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(details.averageRating)} size="xs" readonly />
                    <span className="text-xs text-gray-600">{details.averageRating.toFixed(1)} ({details.ratingsCount || 0} ratings)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              {['description', 'details'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition capitalize ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {(details.description || '').replace(/<[^>]*>/g, '') || 'No description available.'}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-3">
                {[
                  ['Pages', details.pageCount],
                  ['Published', details.publishedDate ? new Date(details.publishedDate).toLocaleDateString() : null],
                  ['Publisher', details.publisher],
                  ['Language', details.language?.toUpperCase()],
                  ['ISBN', details.isbn?.[0]?.identifier],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-sm">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => { onCreateCrew(book); onClose(); }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition"
              >
                <Users className="w-4 h-4" />
                Create Crew
              </button>
              {details.previewLink && (
                <a
                  href={details.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No details available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// SECTION 16: USER PROFILE MODAL (Quick View)
// ========================================

const UserProfileModal = ({
  userEmail, userName, currentUser, onClose,
  onFollow, isFollowing, onViewFullProfile, onBlock, isBlocked,
}) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, reviews: 0, followers: 0, following: 0 });
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => { loadUserData(); }, [userEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === userEmail);
    if (found) setUserData(found);

    const userFollowers = JSON.parse(localStorage.getItem(`user_${userEmail}_followers`) || '[]');
    const userFollowing = JSON.parse(localStorage.getItem(`user_${userEmail}_following`) || '[]');

    const withDetails = (emails) => emails.map(email => {
      const u = users.find(x => x.email === email);
      return { email, name: u?.name || email.split('@')[0], initials: (u?.name || email).slice(0, 2).toUpperCase() };
    });

    setFollowersList(withDetails(userFollowers));
    setFollowingList(withDetails(userFollowing));

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const posts = allPosts.filter(p => p.userEmail === userEmail).slice(0, 5);
    setUserPosts(posts);

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setStats({
      posts: allPosts.filter(p => p.userEmail === userEmail).length,
      reviews: allReviews.filter(r => r.userEmail === userEmail).length,
      followers: userFollowers.length,
      following: userFollowing.length,
    });
  };

  const UserListSheet = ({ title, users: list, onClose: closeList }) => (
    <div
      className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={closeList} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          {list.length === 0
            ? <p className="text-center text-gray-500 py-4">No users to show</p>
            : list.map(u => (
              <button
                key={u.email}
                onClick={() => { closeList(); onViewFullProfile(u.email, u.name); onClose(); }}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition mb-2"
              >
                <Avatar initials={u.initials} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">@{u.email.split('@')[0]}</p>
                </div>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      >
        <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="font-bold">User Profile</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <Avatar initials={userName} size="lg" src={userData?.profileImage} />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{userName}</h2>
                <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g, '')}</p>
                {userData?.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{userData.bio}</p>}
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setShowFollowersList(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-bold text-gray-900">{stats.followers}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button onClick={() => setShowFollowingList(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-bold text-gray-900">{stats.following}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[['Posts', stats.posts], ['Reviews', stats.reviews], ['Followers', stats.followers]].map(([label, val]) => (
                <div key={label} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{val}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {userEmail !== currentUser.email && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => onFollow(userEmail, userName)}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'}`}
                >
                  {isFollowing ? <><UserMinus className="w-4 h-4" />Unfollow</> : <><UserPlus className="w-4 h-4" />Follow</>}
                </button>
                <button
                  onClick={() => onBlock(userEmail, userName)}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                >
                  {isBlocked ? <><UserCheck className="w-4 h-4" />Unblock</> : <><UserMinus className="w-4 h-4" />Block</>}
                </button>
              </div>
            )}

            {userPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Posts</h3>
                <div className="space-y-3">
                  {userPosts.map(post => (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</p>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-3 h-3" />{post.likes || 0}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle className="w-3 h-3" />{post.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { onClose(); onViewFullProfile(userEmail, userName); }}
              className="w-full py-3 border border-orange-200 text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>

      {showFollowersList && (
        <UserListSheet title="Followers" users={followersList} onClose={() => setShowFollowersList(false)} />
      )}
      {showFollowingList && (
        <UserListSheet title="Following" users={followingList} onClose={() => setShowFollowingList(false)} />
      )}
    </>
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

const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
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
  };

  const deleteNotification = (id) => {
    const raw = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = raw.filter(n => n.id !== id);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
    updateNotificationCount?.();
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
                onClick={() => !notif.read && markOneAsRead(notif.id)}
                className={`p-4 transition cursor-pointer hover:bg-gray-50 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg[notif.type] || 'bg-gray-100'}`}>
                    {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.timestamp)}</p>
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
// SECTION 20: SHARE MODAL
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
// SECTION 21: RESHARE MODAL
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
              placeholder="What do you think about this?"
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
              {isPublic ? 'Visible to everyone' : 'Only visible to you'}
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
// SECTION 22: POST OPTIONS MODAL
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
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Post by <span className="font-semibold">{post.userName}</span>:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              </div>
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
                placeholder="Additional details (optional)..."
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
// SECTION 23: INLINE POST CARD
// ========================================

const InlinePostCard = React.memo(({
  post, user, profileSrc, updateNotificationCount,
  onShare, onReshareClick, onSaveToggle, isSaved,
  onDelete, onFollow, isFollowing, onBlock, isBlocked,
  onViewUserProfile, onViewBookDetails,
}) => {
  const [isLiked, setIsLiked] = useState(() => hasUserLikedPost(post.id, user.email));
  const [likeCount, setLikeCount] = useState(() => getPostLikes(post.id) || post.likes || 0);
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
  const inputRef = useRef(null);

  useEffect(() => {
    const realLikes = getPostLikes(post.id);
    if (realLikes !== likeCount) setLikeCount(realLikes);
    setIsLiked(hasUserLikedPost(post.id, user.email));
  }, [post.id]);

  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
  }, [user.email]);

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

  const handleLikePost = async () => {
    if (isLiked) return;

    const newCount = addGlobalLike(post.id, user.email);
    setIsLiked(true);
    setLikeCount(newCount);

    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your post`,
        postId: post.id,
      });
      updateNotificationCount?.();
    }

    try {
      await axios.post(`${API_URL}/api/social/posts/${post.id}/like`, { userEmail: user.email }, { timeout: 5000 });
    } catch (_) { }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

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

  const handleLikeComment = (commentId, commentUserEmail) => {
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
  const isPostAuthor = user.email === post.userEmail;

  const CommentRow = ({ comment, depth = 0 }) => {
    const replies = depth < 2 ? comments.filter(c => c.parentId === comment.id) : [];
    const isLikedCmt = likedComments.has(comment.id);
    const isOwn = comment.userEmail === user.email;

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

        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button
            onClick={handleLikePost}
            disabled={isLiked}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 scale-110' : ''} transition-transform`} />
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

        {showComments && (
          <>
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
                  <p className="text-xs text-orange-600 font-medium flex-1">
                    Replying to <span className="font-bold">{replyTo.userName}</span>
                  </p>
                  <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
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
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    placeholder={replyTo ? `Reply to @${replyTo.userName}...` : 'Write a comment... (@mention someone)'}
                  />
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${newComment.trim() ? 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Post
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 space-y-3 max-h-96 overflow-y-auto">
              {loadingComments ? (
                <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
              ) : visibleComments.length > 0 ? (
                visibleComments.map(comment => <CommentRow key={comment.id} comment={comment} depth={0} />)
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first!</p>
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
// SECTION 24: LOGIN PAGE
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

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
      id: generateId(),
      name: pendingUser.name || name,
      email: pendingUser.email || email,
      password: pendingUser.password || password,
      readingGoal,
      isVerified: true,
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [],
      readingList: [],
      savedPosts: [],
      bio: 'living in my main character era 📚',
      location: '',
      website: '',
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
            type="text"
            inputMode="numeric"
            value={otpInput}
            onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
            placeholder="000000"
            maxLength="6"
            autoFocus
          />
          <button
            onClick={handleVerifyOTP}
            disabled={otpInput.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
          >
            Verify & Continue →
          </button>
          <div className="flex justify-between">
            <button onClick={() => { setShowOTP(false); setError(''); setDevOtp(''); }} className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSendOTP} className="text-orange-500 text-sm font-semibold hover:text-orange-600">
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm">{resetSent ? 'Check your email for the reset link' : 'Enter your email address'}</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{error}</div>}
          {!resetSent ? (
            <>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Email address" type="email" />
              </div>
              <button
                onClick={() => { if (validateEmail(resetEmail)) { setLoading(true); setTimeout(() => { setResetSent(true); setLoading(false); }, 1500); } else { setError('Enter valid email'); } }}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700 text-center">✓ Reset link sent! Check your inbox.</p>
            </div>
          )}
          <button onClick={() => { setShowResetPassword(false); setResetEmail(''); setResetSent(false); setError(''); }} className="text-gray-500 text-sm flex items-center gap-1 mx-auto hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
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

          {isLogin && (
            <button onClick={() => setShowResetPassword(true)} className="text-sm text-orange-500 mt-2 hover:underline block">Forgot password?</button>
          )}

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
// SECTION 25: BOOK DATABASE & CLIENT-SIDE AI
// ========================================

const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.6, reason: 'Twisty, addictive, impossible to put down' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', rating: 4.5, reason: 'Jaw-dropping twist guaranteed' },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', rating: 4.6, reason: 'You will NOT see the ending coming' },
    { title: 'The Girl on the Train', author: 'Paula Hawkins', genre: 'Thriller', rating: 4.4, reason: 'Unreliable narrator at its best' },
    { title: 'Sharp Objects', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.5, reason: 'Dark, twisted, beautifully written' },
  ],
  fantasy: [
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', rating: 4.7, reason: 'Stunning prose and world-building' },
    { title: 'Mistborn', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.7, reason: 'Inventive magic system + satisfying plot' },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, reason: 'Fast-paced, romantic, absolutely addictive' },
    { title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.8, reason: 'Epic fantasy at its finest' },
    { title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', rating: 4.7, reason: 'Complex characters and political intrigue' },
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Witty, heartfelt and genuinely funny' },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', rating: 4.6, reason: 'Emotional, important and beautifully written' },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Nostalgic, swoony and deeply satisfying' },
    { title: 'The Love Hypothesis', author: 'Ali Hazelwood', genre: 'Romance', rating: 4.7, reason: 'STEM romance that will make you swoon' },
    { title: 'Red, White & Royal Blue', author: 'Casey McQuiston', genre: 'Romance', rating: 4.7, reason: 'Charming, witty and utterly delightful' },
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Most fun you\'ll have reading sci-fi' },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', rating: 4.8, reason: 'Foundation of all modern science fiction' },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Funny, clever and impossible to put down' },
    { title: 'Children of Time', author: 'Adrian Tchaikovsky', genre: 'Sci-Fi', rating: 4.7, reason: 'Mind-blowing concepts and world-building' },
    { title: 'The Three-Body Problem', author: 'Cixin Liu', genre: 'Sci-Fi', rating: 4.6, reason: 'Hard sci-fi at its absolute best' },
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, reason: 'Most practical habit book ever written' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, reason: 'Will change how you think about money' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, reason: 'Will change how you see humanity' },
    { title: 'Dare to Lead', author: 'Brené Brown', genre: 'Leadership', rating: 4.6, reason: 'Courageous leadership for everyone' },
    { title: 'The Power of Now', author: 'Eckhart Tolle', genre: 'Spirituality', rating: 4.6, reason: 'Life-changing perspective on presence' },
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', rating: 4.7, reason: 'Best-selling mystery of all time' },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Mystery', rating: 4.7, reason: 'Glamorous, emotional and unforgettable' },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', rating: 4.5, reason: 'Charming, funny and genuinely clever' },
    { title: 'The Guest List', author: 'Lucy Foley', genre: 'Mystery', rating: 4.4, reason: 'Perfect atmospheric thriller' },
    { title: 'One of Us Is Lying', author: 'Karen M. McManus', genre: 'Mystery', rating: 4.5, reason: 'Addictive YA mystery with great twists' },
  ],
  historical: [
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical Fiction', rating: 4.7, reason: 'Exquisitely written — Pulitzer Prize winner' },
    { title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical Fiction', rating: 4.8, reason: 'Utterly unique voice and unforgettable story' },
    { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical Fiction', rating: 4.8, reason: 'Devastating and triumphant — you will cry' },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', genre: 'Historical Fiction', rating: 4.8, reason: 'Emotional and powerful' },
    { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Historical Fiction', rating: 4.7, reason: 'Epic family saga spanning generations' },
  ],
  literary: [
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, reason: 'Beautiful, philosophical and profoundly hopeful' },
    { title: 'Normal People', author: 'Sally Rooney', genre: 'Literary Fiction', rating: 4.4, reason: 'Painfully accurate about modern relationships' },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, reason: 'Short, profound and endlessly re-readable' },
    { title: 'A Little Life', author: 'Hanya Yanagihara', genre: 'Literary Fiction', rating: 4.6, reason: 'Devastating and unforgettable' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', rating: 4.7, reason: 'Timeless masterpiece of American literature' },
  ],
};

const generateClientResponse = (text, previousBooks = []) => {
  const t = text.toLowerCase();
  const detect = () => {
    if (/thrille|suspens|crime|murder|dark|creepy|horror|detective|psycholog/i.test(t)) return 'thriller';
    if (/fantasy|magic|dragon|wizard|sword|epic|tolkien|harry potter|fae/i.test(t)) return 'fantasy';
    if (/romance|love|swoony|kiss|dating|enemies.to.lovers|trope/i.test(t)) return 'romance';
    if (/sci.?fi|space|future|robot|alien|tech|mars|nasa|dystop/i.test(t)) return 'scifi';
    if (/self.?help|habit|product|motivat|improve|success|mindset|business|finance|invest/i.test(t)) return 'selfhelp';
    if (/mystery|whodun|cozy|clue|puzzle|agatha|detective/i.test(t)) return 'mystery';
    if (/histor|period|war|ancient|medieval|century|wwii|world war/i.test(t)) return 'historical';
    return 'literary';
  };
  const cat = detect();
  const list = BOOK_DB[cat] || BOOK_DB.literary;
  const prev = new Set(previousBooks.map(b => b.title));
  const fresh = list.filter(b => !prev.has(b.title));
  const recs = (fresh.length >= 5 ? fresh : list).slice(0, 5);

  const intros = {
    thriller: "Here are 5 gripping thrillers you won't be able to put down! 🔪",
    fantasy: "5 magical worlds waiting for you to explore ✨",
    romance: "5 romance reads that will give you all the feels ❤️",
    scifi: "5 sci-fi journeys that will blow your mind 🚀",
    selfhelp: "5 books that will genuinely change how you think 💡",
    mystery: "5 mysteries that'll keep you guessing until the last page 🔍",
    historical: "5 historical novels that transport you completely 🏰",
    literary: "5 beautifully written books that will stay with you 📚",
  };
  return { reply: intros[cat] || "Here are 5 great picks for you! 📚", books: recs };
};

// ========================================
// SECTION 26: BOOK CARD COMPONENT
// ========================================

const BookCard = React.memo(({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md" onClick={() => onViewDetails?.(book)} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
        {book.reason && <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>}
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={Math.round(book.rating || 4)} size="xs" readonly />
          <span className="text-xs font-semibold text-gray-700">{book.rating || 4.0}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button onClick={() => onViewDetails?.(book)} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">View Details</button>
      <button onClick={onCreateCrew} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-600 transition">
        <Users className="w-4 h-4" />Create Crew
      </button>
    </div>
  </div>
));

// ========================================
// SECTION 27: POST PAGE
// ========================================

const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => { const t = e.target.value; setContent(t); setCharCount(t.length); };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setUploading(true);

    const postData = {
      id: generateId(),
      content: sanitizeText(content.trim()),
      bookName: bookName.trim() || undefined,
      author: author.trim() || undefined,
      image,
      isPublic,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      userInitials: user.name.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0,
    };

    try {
      const res = await axios.post(`${API_URL}/api/social/posts`, postData, { timeout: 8000 });
      onPost(res.data.success ? res.data.post : postData);
    } catch (_) {
      onPost(postData);
    }

    setUploading(false);
    setPage('home');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim() || uploading} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition">
          {uploading ? <LoadingSpinner size="sm" color="white" /> : 'Share'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={handleContentChange}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none"
              placeholder="What are you reading? Share your thoughts..."
              rows={6}
              maxLength={1000}
              autoFocus
            />
            <div className="flex justify-end">
              <span className={`text-xs ${charCount > 900 ? 'text-orange-500' : 'text-gray-400'}`}>{charCount}/1000</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e => setBookName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 transition" placeholder="📖 Book name (optional)" />
          <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 transition" placeholder="✍️ Author (optional)" />
        </div>

        {image && (
          <div className="relative mb-4">
            <img src={image} alt="preview" className="w-full rounded-xl max-h-64 object-cover" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70 transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition">
            <Camera className="w-4 h-4" /> Add Photo
          </button>
          <button onClick={() => setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${!isPublic ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
    </div>
  );
};

// ========================================
// SECTION 28: REVIEWS PAGE
// ========================================

const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState([]);
  const [newReview, setNewReview] = useState({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadReviews();
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(liked);
  }, [user.email]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/social/reviews`, { timeout: 8000 });
      if (res.data.success) { setReviews(res.data.reviews || []); localStorage.setItem('reviews', JSON.stringify(res.data.reviews)); }
    } catch (_) {
      setReviews(JSON.parse(localStorage.getItem('reviews') || '[]'));
    }
    setLoading(false);
  };

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;
    const updated = [...likedReviews, reviewId];
    setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    const updatedReviews = reviews.map(r => r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r);
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    if (review.userEmail !== user.email) {
      pushNotification(review.userEmail, { type: 'review', fromUser: user.name, fromUserEmail: user.email, message: `${user.name} liked your review of "${review.bookName}"` });
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) { alert('Please fill all required fields'); return; }
    const reviewData = { ...newReview, id: generateId(), userName: user.name, userEmail: user.email, userPhoto: user.profileImage, likes: 0, createdAt: new Date().toISOString() };
    try {
      const res = await axios.post(`${API_URL}/api/social/reviews`, reviewData, { timeout: 8000 });
      if (res.data.success) {
        const saved = res.data.review;
        const updatedReviews = [saved, ...reviews];
        setReviews(updatedReviews);
        localStorage.setItem('reviews', JSON.stringify(updatedReviews));
      }
    } catch (_) {
      const updatedReviews = [reviewData, ...reviews];
      setReviews(updatedReviews);
      localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    }
    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
  };

  const filtered = reviews
    .filter(r => r.bookName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.author?.toLowerCase().includes(searchQuery.toLowerCase()) || r.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onCreateCrew={() => { }} />}

      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">
          {showCreateForm ? 'Cancel' : '+ Write Review'}
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search reviews..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400">
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Spill the Tea ☕</h3>
            <div className="space-y-3 mb-4">
              <input type="text" value={newReview.bookName} onChange={e => setNewReview({ ...newReview, bookName: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title *" />
              <input type="text" value={newReview.author} onChange={e => setNewReview({ ...newReview, author: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author *" />
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Your Rating</label>
                <StarRating rating={newReview.rating} onChange={r => setNewReview({ ...newReview, rating: r })} size="md" />
              </div>
              <textarea value={newReview.review} onChange={e => setNewReview({ ...newReview, review: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="spill the tea on this book ☕... *" rows={4} />
              <div className="flex gap-2">
                {['positive', 'negative'].map(s => (
                  <button key={s} type="button" onClick={() => setNewReview({ ...newReview, sentiment: s })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${newReview.sentiment === s ? (s === 'positive' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === 'positive' ? '👍 Positive' : '👎 Negative'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateReview} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition">Submit Review</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{searchQuery ? `No reviews for "${searchQuery}"` : 'no reviews yet — spill the tea ☕. Be the first!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(review => {
              const isLiked = likedReviews.includes(review.id);
              return (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" onClick={() => setSelectedBook({ title: review.bookName, author: review.author })} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" readonly />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button onClick={() => onViewUserProfile(review.userEmail, review.userName)} className="flex items-center gap-2 hover:opacity-75 transition">
                      <Avatar initials={review.userName} size="xs" src={review.userPhoto} />
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleLikeReview(review.id, review)} disabled={isLiked} className={`flex items-center gap-1 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                        {review.likes || 0}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {review.sentiment === 'positive' ? '👍' : '👎'}
                      </span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// SECTION 29: EXPLORE PAGE
// ========================================

const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [tab, setTab] = useState('ai');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "bestie i got u 😭📚 tell me the VIBE — genre, mood, fave character type, or the last book that had u in ur feelings. no boring recs i promise 🤞",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelBook] = useState(null);
  const [charQuery, setCharQuery] = useState('');
  const [charBooks, setCharBooks] = useState([]);
  const [charLoading, setCharLoading] = useState(false);
  const [charDone, setCharDone] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libError, setLibError] = useState('');
  const [userLocation, setUserLoc] = useState(null);
  const endRef = useRef(null);
  const [sessionId] = useState(() => `s_${Date.now()}`);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', content: text, timestamp: new Date() }]);
    setLoading(true);
    let used = false;
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.reply) {
          setMessages(p => [...p, { role: 'assistant', content: d.reply, timestamp: new Date() }]);
          if (d.recommendations?.length) setBooks(d.recommendations);
          used = true;
        }
      }
    } catch (_) { }
    if (!used) {
      const { reply, books: recs } = generateClientResponse(text, books);
      setMessages(p => [...p, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (recs.length) setBooks(recs);
    }
    setLoading(false);
  };

  const fmt = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const searchByCharacter = async () => {
    if (!charQuery.trim()) return;
    setCharLoading(true); setCharDone(false); setCharBooks([]);
    try {
      const q = encodeURIComponent(`character "${charQuery.trim()}"`);
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=12&orderBy=relevance&langRestrict=en`);
      if (res.ok) {
        const d = await res.json();
        const results = (d.items || []).map(item => {
          const v = item.volumeInfo;
          const cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail;
          return {
            title: v.title || 'Unknown',
            author: v.authors?.[0] || 'Unknown',
            genre: v.categories?.[0] || 'Fiction',
            rating: v.averageRating || 4.0,
            description: v.description || '',
            coverUrl: cover ? cover.replace('http:', 'https:').replace('&edge=curl', '') : null,
            pageCount: v.pageCount,
            publishedDate: v.publishedDate,
          };
        }).filter(b => b.title !== 'Unknown');
        setCharBooks(results);
      }
    } catch (e) {
      setCharBooks([]);
    }
    setCharLoading(false); setCharDone(true);
  };

  const findNearbyLibraries = () => {
    setLibLoading(true); setLibError('');
    if (!navigator.geolocation) {
      setLibError("Geolocation not supported on this device.");
      setLibLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLoc({ lat, lng });
        try {
          const query = `[out:json][timeout:25];(node["amenity"="library"](around:5000,${lat},${lng});way["amenity"="library"](around:5000,${lat},${lng}););out center 15;`;
          const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
          });
          if (res.ok) {
            const data = await res.json();
            const libs = data.elements.map(el => {
              const clat = el.lat || el.center?.lat;
              const clng = el.lon || el.center?.lon;
              const dist = clat && clng ? Math.round(Math.sqrt(Math.pow((clat - lat) * 111, 2) + Math.pow((clng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)) * 10) / 10 : null;
              return {
                id: el.id,
                name: el.tags?.name || 'Public Library',
                address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'Address unavailable',
                phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                website: el.tags?.website || el.tags?.['contact:website'] || null,
                opening: el.tags?.opening_hours || null,
                lat: clat, lng: clng, dist,
                mapsUrl: `https://www.google.com/maps/search/?api=1&query=${clat},${clng}`,
              };
            }).filter(l => l.lat).sort((a, b) => (a.dist || 999) - (b.dist || 999));
            setLibraries(libs);
            if (libs.length === 0) setLibError("No libraries found within 5km. Try a bigger city!");
          }
        } catch (e) {
          setLibError("Couldn't load libraries rn. Check your connection and try again 😅");
        }
        setLibLoading(false);
      },
      (err) => {
        setLibError("Location access denied. Enable location to find nearby libraries 📍");
        setLibLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const quickPrompts = ['🔪 dark & twisty', '✨ main character energy', '❤️ slow burn romance', '🚀 sci-fi banger', '💡 big brain reads', '🏰 historical era', '🌙 cozy vibes', '😭 cry-worthy'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          main character reads ✨
        </h1>
        <p className="text-sm text-[#8B7968]">ur AI bestie has the hottest recs 🔥</p>
      </div>

      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {[
          { id: 'ai', em: '🤖', label: 'AI Chat' },
          { id: 'character', em: '🎭', label: 'By Character' },
          { id: 'libraries', em: '📍', label: 'Nearby Libraries' },
        ].map(({ id, em, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${tab === id ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
            <span>{em}</span><span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'ai' && (
        <>
          <div className="px-4 space-y-3 pb-44">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'}`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{fmt(m.timestamp)}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">{[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                </div>
              </div>
            )}
            {books.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-orange-200" />
                  <span className="text-xs text-orange-500 font-semibold">📚 NO-CAP RECS</span>
                  <div className="h-px flex-1 bg-orange-200" />
                </div>
                {books.map((b, i) => (
                  <BookCard key={i} book={b} onCreateCrew={() => { onCreateCrew(b); setPage('crews'); }} onViewDetails={setSelBook} />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {quickPrompts.map(q => (
                  <button key={q} onClick={() => setInput(q.substring(2))}
                    className="flex-shrink-0 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-xs text-orange-600 font-medium hover:bg-orange-50 whitespace-nowrap shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Tell me the vibe and I gotchu 📚✨"
                  className="flex-1 bg-transparent text-sm text-[#2D1F14] outline-none placeholder-gray-400"
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${input.trim() && !loading ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'character' && (
        <div className="px-4 py-2 pb-10">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-5">
            <h2 className="text-lg font-bold mb-1">Search by Character 🎭</h2>
            <p className="text-sm text-gray-500 mb-4">obsessed with a character? find the book they came from or books with similar vibes 👀</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={charQuery}
                  onChange={e => setCharQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchByCharacter(); }}
                  placeholder="e.g. Hermione, Heathcliff, Jay Gatsby…"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition"
                />
              </div>
              <button onClick={searchByCharacter} disabled={!charQuery.trim() || charLoading}
                className="px-5 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-orange-600 transition flex items-center gap-2">
                {charLoading ? <LoadingSpinner size="sm" color="white" /> : <Search className="w-4 h-4" />}
                {charLoading ? '' : 'Search'}
              </button>
            </div>
          </div>

          {charLoading && (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          )}

          {charDone && charBooks.length === 0 && !charLoading && (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">🤷</span>
              <p className="text-gray-600 font-medium">no books found for that character ngl</p>
              <p className="text-gray-400 text-sm mt-1">try a different spelling or a more famous character</p>
            </div>
          )}

          {charBooks.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600 mb-2">found {charBooks.length} books featuring or inspired by <span className="text-orange-500">"{charQuery}"</span> ✨</p>
              {charBooks.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex gap-4">
                    <DynamicBookCover title={b.title} author={b.author} size="md" onClick={() => setSelBook(b)} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{b.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">by {b.author}</p>
                      {b.genre && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{b.genre}</span>}
                      {b.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{b.description.replace(/<[^>]*>/g, '')}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={Math.round(b.rating || 4)} size="xs" readonly />
                        <span className="text-xs font-semibold text-gray-700">{(b.rating || 4).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setSelBook(b)} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">View Details</button>
                    <button onClick={() => { onCreateCrew(b); setPage('crews'); }} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-600 transition">
                      <Users className="w-4 h-4" />Crew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!charDone && !charLoading && charBooks.length === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {['Sherlock Holmes', 'Elizabeth Bennet', 'Katniss Everdeen', 'Atticus Finch', 'Holden Caulfield', 'Daenerys Targaryen'].map(char => (
                <button key={char} onClick={() => { setCharQuery(char); }} className="bg-white rounded-xl p-3 border border-gray-200 text-left hover:border-orange-300 hover:shadow-sm transition">
                  <span className="text-2xl block mb-1">📖</span>
                  <p className="text-sm font-semibold text-gray-800">{char}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'libraries' && (
        <div className="px-4 py-2 pb-10">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-5">
            <h2 className="text-lg font-bold mb-1">Nearby Libraries 📍</h2>
            <p className="text-sm text-gray-500 mb-4">find public libraries within 5km of ur location — because physical books are still iconic 📚</p>
            <button onClick={findNearbyLibraries} disabled={libLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
              {libLoading ? <><LoadingSpinner size="sm" color="white" /><span>Finding libraries...</span></> : <><Navigation className="w-5 h-5" /><span>Find Libraries Near Me</span></>}
            </button>
            {libError && <p className="text-red-500 text-sm mt-3 text-center">{libError}</p>}
          </div>

          {libLoading && (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          )}

          {libraries.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600 mb-2">found {libraries.length} libraries nearby 🎉</p>
              {libraries.map((lib, i) => (
                <div key={lib.id || i} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{lib.name}</h3>
                        {lib.dist && <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">{lib.dist} km</span>}
                      </div>
                      {lib.address && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{lib.address}</p>}
                      {lib.opening && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{lib.opening}</p>}
                      {lib.phone && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{lib.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <a href={lib.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600 transition">
                      <Navigation className="w-3.5 h-3.5" />Directions
                    </a>
                    {lib.website && (
                      <a href={lib.website.startsWith('http') ? lib.website : `https://${lib.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition">
                        <Globe className="w-3.5 h-3.5" />Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!libLoading && libraries.length === 0 && !libError && (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">📍</span>
              <p className="text-gray-600 font-medium">tap the button to find libraries near u</p>
              <p className="text-gray-400 text-sm mt-1">uses your device location — 100% private, not stored</p>
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <BookDetailsModal book={selectedBook} onClose={() => setSelBook(null)} onCreateCrew={onCreateCrew} />
      )}
    </div>
  );
};

// ========================================
// SECTION 30: HOME PAGE
// ========================================

const HomePage = ({
  user, posts, crews, setPage, updateNotificationCount,
  profileSrc, savedPosts, onSavePost, onResharePost, onDeletePost,
  onFollow, following, onBlock, blockedUsers,
  onViewUserProfile, onViewBookDetails,
  deepLinkPostId, onDeepLinkHandled,
}) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingProgress, setReadingProgress] = useState(0);
  const [feedRefreshed, setFeedRefreshed] = useState(false);

  useEffect(() => {
    if (!deepLinkPostId || feedPosts.length === 0) return;
    setTimeout(() => {
      const el = document.getElementById(`post-${deepLinkPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px #f97316';
        setTimeout(() => { el.style.boxShadow = ''; }, 2500);
      }
      onDeepLinkHandled?.();
    }, 400);
  }, [deepLinkPostId, feedPosts]);

  useEffect(() => {
    loadTrendingBooks();
    loadPersonalizedFeed();

    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    if (user?.readingGoal?.yearly > 0) {
      setReadingProgress(Math.min((savedStats.booksRead || 0) / user.readingGoal.yearly * 100, 100));
    }

    socket.on('new_post', (post) => {
      if (!blockedUsers.includes(post.userEmail)) {
        setFeedPosts(prev => [post, ...prev]);
      }
    });
    socket.on('post_deleted', ({ postId }) => setFeedPosts(prev => prev.filter(p => (p._id || p.id) !== postId)));
    socket.on('post_liked', ({ postId, likes }) => setFeedPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes } : p)));

    return () => { socket.off('new_post'); socket.off('post_deleted'); socket.off('post_liked'); };
  }, [user.email, blockedUsers]);

  useEffect(() => {
    loadPersonalizedFeed();
  }, [posts.length, following.length]);

  const POSTS_PER_PAGE = 10;
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(c => c + POSTS_PER_PAGE);
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [feedPosts.length]);

  const loadPersonalizedFeed = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/social/posts?userEmail=${user.email}`, { timeout: 8000 });
      if (res.data.success) {
        const serverPosts = res.data.posts || [];
        const allLocal = JSON.parse(localStorage.getItem('allPosts') || '[]');
        const merged = [...serverPosts];
        allLocal.forEach(lp => { if (!merged.find(sp => sp.id === lp.id)) merged.push(lp); });
        localStorage.setItem('allPosts', JSON.stringify(merged));

        const personalized = generatePersonalizedFeed(user.email, merged, blockedUsers);
        setFeedPosts(personalized);
        setFeedRefreshed(true);
        return;
      }
    } catch (_) { }

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const personalized = generatePersonalizedFeed(user.email, allPosts, blockedUsers);
    setFeedPosts(personalized);
    setFeedRefreshed(true);
  };

  const loadTrendingBooks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/books/trending?limit=8`, { timeout: 8000 });
      if (res.data.success) { setTrendingBooks(res.data.books); setLoadingTrending(false); return; }
    } catch (_) { }
    setTrendingBooks([
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
      { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8 },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6 },
      { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
      { title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7 },
      { title: 'It Ends with Us', author: 'Colleen Hoover', rating: 4.6 },
    ]);
    setLoadingTrending(false);
  };

  const handleReshareClick = (post) => { setShowReshare(post); };
  const handleReshare = (post, comment, isPublic) => {
    onResharePost(post, comment, isPublic);
    setShowReshare(null);
  };

  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id) || JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]').includes(c.id));
  const hasReadingGoal = user?.readingGoal?.yearly > 0;
  const notifCount = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read && n.type !== 'message').length;

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

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900">Personalized for you</p>
            <p className="text-xs text-blue-600">Feed ranked by your likes, follows & reading interests</p>
          </div>
          <button onClick={loadPersonalizedFeed} className="p-1.5 hover:bg-blue-100 rounded-lg transition">
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </button>
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" />Trending Books</h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold hover:underline">Explore All</button>
          </div>
          {loadingTrending ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {trendingBooks.map((book, i) => (
                <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedBook(book)}>
                  <DynamicBookCover title={book.title} author={book.author} size="md" />
                  <p className="text-sm font-semibold text-gray-900 mt-2 leading-tight line-clamp-2">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  {book.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{book.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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

        <button onClick={() => setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition">
          {profileSrc ? <img src={profileSrc} alt="profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <Avatar initials={user?.name} size="sm" />}
          <span className="text-gray-400 text-sm flex-1 text-left">What's your current read? spill 👀</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              {following.length > 0 ? 'Your Feed' : 'Community Feed'}
            </h2>
            <button onClick={loadPersonalizedFeed} className="text-xs text-gray-400 flex items-center gap-1 hover:text-orange-500 transition">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
          </div>

          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">no posts yet — be the main character 🌟</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition">Create Post</button>
              </div>
            ) : (
              feedPosts.slice(0, visibleCount).map((post, idx) => (
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
            {feedPosts.length > visibleCount && (
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
// SECTION 31: PROFILE PAGE
// ========================================

const ProfilePage = ({
  user, posts, setPage, onLogout, onUpdateUser,
  profileSrc, setProfileSrc, savedPosts, following, followers,
}) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly: 0, monthly: 0 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);
  const [books, setBooks] = useState([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5, notes: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const fileInputRef = useRef(null);

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);
  const savedPostsList = posts.filter(p => savedPosts?.includes(p.id));
  const joinedCrewIds = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
  const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
  const myCrews = allCrews.filter(c => joinedCrewIds.includes(c.id) || joinedCrewIds.includes(String(c.id)));

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    const savedBooks = JSON.parse(localStorage.getItem(`user_${user.email}_readingList`) || '[]');
    setBooks(savedBooks);
  }, [user.email]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgData = ev.target.result;
      setProfileSrc(imgData);
      localStorage.setItem(`user_${user.email}_profile_image`, imgData);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? { ...u, profileImage: imgData } : u)));
      const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...cu, profileImage: imgData }));
      onUpdateUser?.({ ...user, profileImage: imgData });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, bio: editBio, location: editLocation, website: editWebsite };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? updatedUser : u)));
    onUpdateUser?.(updatedUser);
    setEditingProfile(false);
  };

  const handleSaveGoal = () => {
    const updatedUser = { ...user, readingGoal: editGoal };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
    onUpdateUser?.(updatedUser);
  };

  const handleAddBook = () => {
    if (!newBook.title) { alert('Enter book title'); return; }
    const book = { id: generateId(), ...newBook, addedAt: new Date().toISOString() };
    const updatedBooks = [book, ...books];
    setBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updatedBooks));
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setStats(updatedStats);
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));
    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
  };

  const handleDeleteBook = (bookId) => {
    if (!window.confirm('Remove this book?')) return;
    const updatedBooks = books.filter(b => b.id !== bookId);
    setBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updatedBooks));
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setStats(updatedStats);
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));
  };

  const FollowerModal = ({ title, users: list, onClose: closeModal }) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    return (
      <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="font-bold">{title} ({list.length})</h3>
            <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4">
            {list.length === 0
              ? <p className="text-center text-gray-500 py-4">No users to show</p>
              : list.map(email => {
                const u = allUsers.find(x => x.email === email);
                return (
                  <div key={email} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition mb-2">
                    <Avatar initials={u?.name || email} size="sm" src={u?.profileImage} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{u?.name || email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">@{email.split('@')[0]}</p>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews', 'Saved'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {showFollowers && <FollowerModal title="Followers" users={followers} onClose={() => setShowFollowers(false)} />}
      {showFollowing && <FollowerModal title="Following" users={following} onClose={() => setShowFollowing(false)} />}

      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>My Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5 text-gray-600" /></button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? (
              <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <Avatar initials={user?.name} size="xl" />
            )}
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600 transition">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Your name" />
                <input value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Location" />
                <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Website" />
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Your bio..." rows={2} />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                {user?.location && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location}</p>}
                {user?.website && (
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 mt-1 flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" />{user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <p className="text-sm text-gray-600 mt-2 italic">"{user?.bio || 'living in my main character era 📚'}"</p>
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setShowFollowers(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-bold text-gray-900">{followers?.length || 0}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button onClick={() => setShowFollowing(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-bold text-gray-900">{following?.length || 0}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </button>
                </div>
                <button onClick={() => setEditingProfile(true)} className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" />Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-sm">Reading Goal {new Date().getFullYear()}</h3>
            </div>
            <button onClick={() => setShowEditGoal(!showEditGoal)} className="text-sm text-orange-500 font-medium">{showEditGoal ? 'Cancel' : 'Edit'}</button>
          </div>
          {showEditGoal ? (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Yearly Goal</label>
                  <input type="number" value={editGoal.yearly} onChange={e => setEditGoal({ ...editGoal, yearly: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="100" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Monthly Goal</label>
                  <input type="number" value={editGoal.monthly} onChange={e => setEditGoal({ ...editGoal, monthly: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="20" />
                </div>
              </div>
              <button onClick={handleSaveGoal} className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">Save Goal</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">{readingGoal.yearly > 0 ? `${stats.booksRead}/${readingGoal.yearly} books` : 'No goal set'}</span>
              </div>
              {readingGoal.yearly > 0 && (
                <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.booksRead / readingGoal.yearly) * 100, 100)}%` }} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600' },
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">no posts rn — start ur era 📸</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition">Create First Post</button>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" />}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{getPostLikes(post.id) || post.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{getPostComments(post.id).filter(c => !c.parentId).length || post.comments || 0}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">no reviews yet — spill the tea ☕</p>
                <button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition">Spill the Tea ☕</button>
              </div>
            ) : myReviews.map(review => (
              <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                  <div className="flex-1"><h3 className="font-semibold text-sm">{review.bookName}</h3><p className="text-xs text-gray-500">by {review.author}</p><StarRating rating={review.rating} size="xs" readonly /></div>
                </div>
                <p className="text-sm text-gray-700">{review.review}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Books Read' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">{books.length} books read</p>
              <button onClick={() => setShowAddBook(!showAddBook)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">
                <Plus className="w-4 h-4" />{showAddBook ? 'Cancel' : 'Add Book'}
              </button>
            </div>
            {showAddBook && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <input value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title *" />
                  <input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
                  <div><label className="text-xs text-gray-600 mb-1 block">Your Rating</label><StarRating rating={newBook.rating} onChange={r => setNewBook({ ...newBook, rating: r })} size="md" /></div>
                  <textarea value={newBook.notes} onChange={e => setNewBook({ ...newBook, notes: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Notes..." rows={2} />
                  <button onClick={handleAddBook} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition">Add to My Books</button>
                </div>
              </div>
            )}
            {books.length === 0
              ? <div className="text-center py-8"><BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No books tracked yet</p></div>
              : books.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                  <DynamicBookCover title={book.title} author={book.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <StarRating rating={book.rating} size="xs" readonly />
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteBook(book.id)} className="p-1 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {myCrews.length === 0
              ? <div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">no crews yet — find ur people 👯</p><button onClick={() => setPage('crews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Browse Crews</button></div>
              : myCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Saved' && (
          <div className="space-y-4">
            {savedPostsList.length === 0
              ? <div className="text-center py-8"><Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No saved posts yet</p></div>
              : savedPostsList.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <span className="text-xs text-gray-400">by {post.userName}</span>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// SECTION 32: CREW CHAT VIEW
// ========================================

const CrewChatView = ({ crew, user, crewMembers, onBack, updateNotificationCount, onViewUserProfile, isJoined, joinCrew }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selBook, setSelBook] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { onlineCount } = useCrewPresence(crew.id, user.id, user.name);
  const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(crew.id, user.id, user.name);
  const hasJoined = isJoined(crew.id);

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
    setMessages(cached.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));

    socket.emit('join_crew_room', crew.id);
    socket.on('new_crew_message', d => {
      if (String(d.crewId) === String(crew.id)) {
        setMessages(prev => [...prev, { ...d.message, timestamp: new Date(d.message.timestamp) }]);
      }
    });
    return () => { socket.emit('leave_crew_room', crew.id); socket.off('new_crew_message'); };
  }, [crew.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { markCrewMessagesRead(crew.id, user.id); }, [messages.length]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasJoined) return;
    stopTyping();
    const msg = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name?.slice(0, 2).toUpperCase(),
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    setNewMessage('');

    try {
      const res = await axios.post(`${API_URL}/api/social/crews/${crew.id}/messages`, msg, { timeout: 8000 });
      if (res.data.success) {
        setMessages(prev => [...prev, { ...res.data.message, timestamp: new Date(res.data.message.timestamp) }]);
      }
    } catch (_) {
      const localMsg = { id: `msg_${Date.now()}`, ...msg };
      const existing = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      existing.push(localMsg);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...localMsg, timestamp: new Date() }]);
    }

    crewMembers.filter(m => m.email !== user.email).forEach(m => {
      pushNotification(m.email, { type: 'message', fromUser: user.name, fromUserEmail: user.email, message: `${user.name} sent a message in "${crew.name}"`, crewId: crew.id, crewName: crew.name });
    });
    updateNotificationCount?.();
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !hasJoined) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const msg = { id: `msg_${Date.now()}`, userId: user.id, userName: user.name, userEmail: user.email, userInitials: user.name?.slice(0, 2).toUpperCase(), content: ev.target.result, timestamp: new Date().toISOString(), type: 'image' };
      const existing = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      existing.push(msg);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      crewMembers.filter(m => m.email !== user.email).forEach(m => {
        pushNotification(m.email, { type: 'message', fromUser: user.name, fromUserEmail: user.email, message: `${user.name} shared an image in "${crew.name}"`, crewId: crew.id, crewName: crew.name });
      });
      updateNotificationCount?.();
    };
    reader.readAsDataURL(file);
  };

  const formatMsgTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return new Date(ts).toLocaleDateString();
  };

  const groupsByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  if (!hasJoined) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#e5ddd5] overflow-hidden"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" />
          <div><p className="font-semibold text-gray-900">{crew.name}</p><p className="text-xs text-gray-500">{crewMembers.length} members</p></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-4">Join this crew to chat</p>
            <button onClick={() => joinCrew(crew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition">Join to Chat</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] overflow-hidden"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" onClick={() => setSelBook({ title: crew.name, author: crew.author })} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{crew.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  {onlineCount} online
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setShowShare(true)} className="p-2 hover:bg-gray-100 rounded-full" title="Invite friends"><Share2 className="w-5 h-5 text-gray-600" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">no messages yet — break the ice bestie 🧊</p>
          </div>
        )}

        {Object.entries(groupsByDate).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {msgs.map(msg => {
              const isOwn = msg.userId === user.id || msg.userEmail === user.email;
              return (
                <div key={msg.id || msg.timestamp} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <button onClick={() => onViewUserProfile(msg.userEmail, msg.userName)} className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition">
                        {msg.userInitials || '??'}
                      </button>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                      {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                      {msg.type === 'image' ? (
                        <img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60 cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />
                      ) : (
                        <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>
                      )}
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">
                        {formatMsgTime(msg.timestamp)}
                        {isOwn && (() => {
                          const s = getReadStatus(msg.timestamp, crew.id, onlineCount);
                          if (s === 'read') return <span className="ml-1 text-blue-400">✓✓</span>;
                          if (s === 'delivered') return <span className="ml-1 text-gray-400">✓✓</span>;
                          return <span className="ml-1 text-gray-300">✓</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500 italic bg-transparent">
          {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing...` : `${typingUsers.length} people are typing...`}
        </div>
      )}

      <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
          <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-orange-500" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage} />
          <input
            type="text"
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); broadcastTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stopTyping(); sendMessage(); } }}
            onBlur={stopTyping}
            className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            placeholder="say something bestie... 💬"
          />
          <button
            onClick={() => { stopTyping(); sendMessage(); }}
            disabled={!newMessage.trim()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selBook && <BookDetailsModal book={selBook} onClose={() => setSelBook(null)} onCreateCrew={() => { }} />}
      {showShare && <ShareModal crewInvite={crew} onClose={() => setShowShare(false)} />}
    </div>
  );
};

// ========================================
// SECTION 33: CREWS PAGE
// ========================================

const CrewSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-pulse">
    <div className="flex items-center px-4 gap-4 py-3">
      <div className="w-16 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded-full w-20 mt-1" />
      </div>
    </div>
  </div>
);

const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile, deepLinkCrewId, onDeepLinkHandled }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({ name: '', author: '', genre: '' });
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [showShareModal, setShowShareModal] = useState(null);
  const [loadingCrews, setLoadingCrews] = useState(true);

  const loadCrews = useCallback(async () => {
    setLoadingCrews(true);
    const res = await api.get('/api/social/crews');
    let allCrews = [];
    if (res?.data?.success) {
      allCrews = res.data.crews || [];
    } else {
      const saved = JSON.parse(localStorage.getItem('crews') || '[]');
      allCrews = [...saved];
    }
    initialCrews.forEach(ic => { if (!allCrews.find(c => String(c.id) === String(ic.id))) allCrews.push(ic); });
    const local = JSON.parse(localStorage.getItem('crews') || '[]');
    local.forEach(lc => { if (!allCrews.find(c => String(c.id) === String(lc.id))) allCrews.push(lc); });
    localStorage.setItem('crews', JSON.stringify(allCrews));
    setCrews(allCrews);
    setLoadingCrews(false);
  }, [user.email]);

  useEffect(() => {
    loadCrews();
    const joined = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(joined);
    const notifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const crewMsgs = notifs.filter(n => n.type === 'message' && !n.read);
    const counts = {};
    crewMsgs.forEach(n => { if (n.crewId) counts[n.crewId] = (counts[n.crewId] || 0) + 1; });
    setUnreadMessages(counts);
  }, [user.email, loadCrews]);

  useEffect(() => {
    if (!deepLinkCrewId || crews.length === 0) return;
    const target = crews.find(c => String(c.id) === String(deepLinkCrewId) || c.slug === deepLinkCrewId);
    if (target) { setSelectedCrew(target); setView('detail'); onDeepLinkHandled?.(); }
  }, [deepLinkCrewId, crews]);

  const isJoined = (crewId) => joinedCrews.includes(crewId) || joinedCrews.includes(String(crewId));

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const joinCrew = (crew) => {
    if (isJoined(crew.id)) return;
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    showToast(`🔥 locked in with "${crew.name}"!`);
    if (crew.createdBy !== user.email) {
      pushNotification(crew.createdBy, { type: 'join', fromUser: user.name, fromUserEmail: user.email, message: `${user.name} joined your crew "${crew.name}"`, crewId: crew.id });
      updateNotificationCount?.();
    }
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave "${crew.name}"?`)) return;
    const updated = joinedCrews.filter(id => id !== crew.id && id !== String(crew.id));
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1) } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    if (selectedCrew?.id === crew.id) { setView('list'); setSelectedCrew(null); }
    showToast(`Left "${crew.name}"`);
  };

  const createCrew = async () => {
    if (!newCrewData.name || !newCrewData.author) { alert('bestie fill in the book name and author first 👀'); return; }
    const existing = crews.find(c =>
      c.name.trim().toLowerCase() === newCrewData.name.trim().toLowerCase() &&
      c.author.trim().toLowerCase() === newCrewData.author.trim().toLowerCase()
    );
    if (existing) {
      alert(`A crew for "${existing.name}" already exists! Taking you there now.`);
      if (!isJoined(existing.id)) joinCrew(existing);
      setShowCreateForm(false);
      setNewCrewData({ name: '', author: '', genre: '' });
      setSelectedCrew(existing);
      setView('detail');
      return;
    }

    const newCrew = { id: generateId(), ...newCrewData, members: 1, chats: 0, createdBy: user.email, createdByName: user.name, createdAt: new Date().toISOString() };
    const res = await api.post('/api/social/crews', newCrew);
    const saved = res?.data?.success ? res.data.crew : newCrew;
    const updatedCrews = [saved, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    const updated = [...joinedCrews, saved.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    setShowCreateForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
    showToast(`🎉 Created "${saved.name}"!`);
  };

  useEffect(() => {
    if (!selectedCrew) return;
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const members = allUsers
      .filter(u => { const j = JSON.parse(localStorage.getItem(`user_${u.email}_joinedCrews`) || '[]'); return j.includes(selectedCrew.id) || j.includes(String(selectedCrew.id)); })
      .map(u => ({ id: u.id, name: u.name, email: u.email, initials: u.name?.slice(0, 2), isCreator: u.email === selectedCrew.createdBy }));
    if (!members.find(m => m.email === selectedCrew.createdBy)) {
      members.push({ id: selectedCrew.createdBy, name: selectedCrew.createdByName || 'Creator', email: selectedCrew.createdBy, initials: (selectedCrew.createdByName || 'CR').slice(0, 2), isCreator: true });
    }
    setCrewMembers(members);
  }, [selectedCrew]);

  const filtered = crews.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.author?.toLowerCase().includes(searchQuery.toLowerCase()) || c.genre?.toLowerCase().includes(searchQuery.toLowerCase()));
  const joinedList = filtered.filter(c => isJoined(c.id));
  const discoverList = filtered.filter(c => !isJoined(c.id));

  const Toast = () => toastMessage ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center animate-slideDown">{toastMessage}</div>
  ) : null;

  if (view === 'chat' && selectedCrew) {
    return <CrewChatView crew={selectedCrew} user={user} crewMembers={crewMembers} onBack={() => setView('detail')} updateNotificationCount={updateNotificationCount} onViewUserProfile={onViewUserProfile} isJoined={isJoined} joinCrew={joinCrew} />;
  }

  if (view === 'detail' && selectedCrew) {
    const joined = isJoined(selectedCrew.id);
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <Toast />
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-semibold flex-1">Crew Info</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" onClick={() => setSelectedBook({ title: selectedCrew.name, author: selectedCrew.author })} />
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{selectedCrew.name}</h1>
              <p className="text-gray-500">by {selectedCrew.author}</p>
              {selectedCrew.genre && <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{selectedCrew.genre}</span>}
              <div className="flex gap-8 mt-4">
                <div className="text-center"><p className="text-xl font-bold">{crewMembers.length}</p><p className="text-xs text-gray-500">Members</p></div>
              </div>
              <div className="flex gap-3 mt-5 w-full">
                {!joined ? (
                  <button onClick={() => joinCrew(selectedCrew)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Join Crew</button>
                ) : (
                  <button onClick={() => setView('chat')} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />Open Chat
                  </button>
                )}
                <button
                  onClick={() => setShowShareModal(selectedCrew)}
                  className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-1.5 text-gray-600 text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" /> Invite
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold mb-3">Members ({crewMembers.length})</h3>
            <div className="space-y-3">
              {crewMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <button onClick={() => onViewUserProfile(member.email, member.name)} className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold hover:opacity-80 transition">
                    {member.initials}
                  </button>
                  <div className="flex-1">
                    <button onClick={() => onViewUserProfile(member.email, member.name)} className="font-semibold hover:underline text-sm">{member.name}</button>
                    <p className="text-xs text-gray-500">{member.isCreator ? '👑 Creator' : 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {joined && (
            <div className="p-4 pt-0">
              <button onClick={() => leaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition">Leave Crew</button>
            </div>
          )}
        </div>

        {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onCreateCrew={() => { }} />}
        {showShareModal && <ShareModal crewInvite={showShareModal} onClose={() => setShowShareModal(null)} />}
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <Toast />
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</span>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">+ Create Crew</button>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search crews..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Create New Crew</h3>
            {newCrewData.name && <div className="flex justify-center mb-4"><DynamicBookCover title={newCrewData.name} author={newCrewData.author} size="lg" /></div>}
            <div className="space-y-3">
              <input value={newCrewData.name} onChange={e => setNewCrewData({ ...newCrewData, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title *" />
              <input value={newCrewData.author} onChange={e => setNewCrewData({ ...newCrewData, author: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author *" />
              <input value={newCrewData.genre} onChange={e => setNewCrewData({ ...newCrewData, genre: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Genre (optional)" />
              <div className="flex gap-2">
                <button onClick={createCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">Create</button>
                <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loadingCrews ? (
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4].map(i => <CrewSkeleton key={i} />)}
          </div>
        ) : null}
        <div className="mb-6" style={{ display: loadingCrews ? 'none' : 'block' }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />My Crews ({joinedList.length})</h2>
          {joinedList.length === 0
            ? <div className="bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">no crews yet — find ur people 👯. Explore below!</p></div>
            : joinedList.map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3 hover:shadow-md transition" onClick={() => { setSelectedCrew(crew); setView('detail'); }}>
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">Joined</span>
                      {unreadMessages[crew.id] > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{unreadMessages[crew.id]}</span>}
                    </div>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                      <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                  <button onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); }} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 transition flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />Open Chat
                  </button>
                  <button onClick={e => { e.stopPropagation(); setShowShareModal(crew); }} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition flex items-center gap-1">
                    <Share2 className="w-3 h-3" />Invite
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews ({discoverList.length})</h2>
          <div className="space-y-3">
            {discoverList.length === 0
              ? <div className="bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">No crews to discover</p></div>
              : discoverList.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => { setSelectedCrew(crew); setView('detail'); }}>
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                    <button onClick={e => { e.stopPropagation(); joinCrew(crew); }} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">Join</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onCreateCrew={() => { }} />}
      {showShareModal && <ShareModal crewInvite={showShareModal} onClose={() => setShowShareModal(null)} />}
    </div>
  );
};

// ========================================
// SECTION 34: FULL USER PROFILE PAGE
// ========================================

const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setReviews] = useState([]);
  const [userBooks, setBooks] = useState([]);
  const [userCrews, setCrews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });

  useEffect(() => { loadData(); }, [viewedUserEmail]);

  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === viewedUserEmail);
    if (found) setUserData(found);

    const fwers = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_followers`) || '[]');
    const fwing = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_following`) || '[]');
    setFollowers(fwers);
    setFollowing(fwing);

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    setUserPosts(allPosts.filter(p => p.userEmail === viewedUserEmail));

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(allReviews.filter(r => r.userEmail === viewedUserEmail));

    setBooks(JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_readingList`) || '[]'));

    const joinedIds = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_joinedCrews`) || '[]');
    const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(allCrews.filter(c => joinedIds.includes(c.id) || joinedIds.includes(String(c.id))));

    const st = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_stats`) || '{}');
    setStats({ booksRead: st.booksRead || 0, reviewsGiven: st.reviewsGiven || 0, postsCreated: st.postsCreated || 0, crewsJoined: st.crewsJoined || 0 });
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900 flex-1 truncate">{viewedUserName}'s Profile</h2>
        <div className="w-6" />
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <Avatar initials={viewedUserName} size="xl" src={userData?.profileImage} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{viewedUserName}</h2>
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g, '')}</p>
            {userData?.bio && <p className="text-sm text-gray-600 mt-1 italic">"{userData.bio}"</p>}
            {userData?.location && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{userData.location}</p>}

            <div className="flex gap-4 mt-2">
              <div className="text-center"><p className="font-bold text-gray-900">{followers.length}</p><p className="text-xs text-gray-500">Followers</p></div>
              <div className="text-center"><p className="font-bold text-gray-900">{following.length}</p><p className="text-xs text-gray-500">Following</p></div>
            </div>

            {viewedUserEmail !== currentUser.email && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onFollow(viewedUserEmail, viewedUserName)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'}`}
                >
                  {isFollowing ? <><UserMinus className="w-4 h-4" />Unfollow</> : <><UserPlus className="w-4 h-4" />Follow</>}
                </button>
                <button
                  onClick={() => onBlock(viewedUserEmail, viewedUserName)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600' },
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}
            >{tab}</button>
          ))}
        </div>

        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {userPosts.length === 0
              ? <div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">no posts rn — start ur era 📸</p></div>
              : userPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" />}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{getPostLikes(post.id) || post.likes || 0}</span>
                    <span className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5" />{post.reshareCount || 0}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {userReviews.length === 0
              ? <div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">no reviews yet — spill the tea ☕</p></div>
              : userReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1"><h3 className="font-semibold text-sm">{review.bookName}</h3><p className="text-xs text-gray-500">by {review.author}</p><StarRating rating={review.rating} size="xs" readonly /></div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Books Read' && (
          <div className="space-y-3">
            {userBooks.length === 0
              ? <div className="text-center py-8"><BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No books tracked yet</p></div>
              : userBooks.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                  <DynamicBookCover title={book.title} author={book.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <StarRating rating={book.rating} size="xs" readonly />
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {userCrews.length === 0
              ? <div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">no crews yet — find ur people 👯</p></div>
              : userCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// SECTION 35: MAIN APP COMPONENT
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
    incrementReshareCount(originalPost.id);

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
  }, [currentUser, checkForNewNotifications]);

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

  const filteredPosts = React.useMemo(() => posts.filter(p => !blockedUsers.includes(p.userEmail)), [posts, blockedUsers]);

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
                posts={filteredPosts}
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
                onViewBookDetails={() => { }}
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
                  const nc = { id: generateId(), name: book.title, author: book.author, genre: book.genre || 'General', members: 1, chats: 0, createdBy: currentUser.email, createdByName: currentUser.name, createdAt: new Date().toISOString() };
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
                posts={filteredPosts}
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
// SECTION 36: GLOBAL STYLES
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