// ========================================
// READCREWW - Social Reading Platform
// Version: 4.0 "Gen Z Edition" 
// Features: Global Crews, AI Chat, Character Search, Nearby Libraries
// Performance: Optimized for 10,000+ concurrent users
// ========================================

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo, lazy, Suspense,
  startTransition, useDeferredValue, useTransition
} from 'react';

// ========================================
// SECTION 1: ICONS (Optimized imports)
// ========================================
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Heart,
  MessageCircle, Bookmark, Share2, Star, Plus, X, Send, Image,
  ChevronLeft, LogOut, Camera, MoreHorizontal, Sparkles, Lock,
  Eye, EyeOff, UserPlus, Trash2, Edit, Check, ArrowLeft, Clock,
  TrendingUp, RefreshCw, Globe, ChevronDown, Mail, Link2,
  AtSign, Flag, Repeat, UserCheck, UserMinus, AlertCircle,
  CheckCircle, Info, MapPin, ExternalLink, Navigation, Menu,
  MessageSquare, Target, BookMarked, PlusCircle, Wifi, WifiOff,
  Loader2, Zap, Flame, Crown, Gift, Coffee, Music, Film,
  Video, Download, Upload, Maximize2, Minimize2, Circle, Square,
  Sun, Moon, Cloud, Thermometer, Compass, Anchor, Rocket, Satellite,
  Briefcase, Building, Headphones, Speaker, Tv, Monitor, Laptop,
  Tablet, Smartphone, Watch, AlarmClock, Timer, Hourglass,
  Feather, Anchor as AnchorIcon, Award, Calendar
} from 'lucide-react';

// ========================================
// SECTION 2: CONFIGURATION & CONSTANTS
// ========================================

const APP_NAME = 'READCREWW';
const APP_TAGLINE = "no cap, this slaps different 📚✨";
const APP_VERSION = '4.0.0';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'rcreww_users_v4',
  CURRENT_USER: 'rcreww_current_v4',
  GLOBAL_CREWS: 'rcreww_global_crews_v4',
  GLOBAL_POSTS: 'rcreww_global_posts_v4',
  GLOBAL_REVIEWS: 'rcreww_global_reviews_v4',
  NOTIFICATIONS: (email) => `rcreww_notifs_${email}`,
  FOLLOWING: (email) => `rcreww_following_${email}`,
  FOLLOWERS: (email) => `rcreww_followers_${email}`,
  BLOCKED: (email) => `rcreww_blocked_${email}`,
  SAVED_POSTS: (email) => `rcreww_saved_${email}`,
  LIKED_POSTS: (email) => `rcreww_liked_posts_${email}`,
  READING_LIST: (email) => `rcreww_books_${email}`,
  STATS: (email) => `rcreww_stats_${email}`,
  JOINED_CREWS: (email) => `rcreww_joined_${email}`,
  PROFILE_IMAGE: (email) => `rcreww_pic_${email}`,
  CHAT_MESSAGES: (crewId) => `rcreww_chat_${crewId}`,
  POST_LIKES: (postId) => `rcreww_likes_${postId}`,
  POST_COMMENTS: (postId) => `rcreww_cmts_${postId}`,
};

// Gen Z Placeholders & Prompts
const GEN_Z_PLACEHOLDERS = [
  "spill the tea on what you're reading rn ☕",
  "bestie what book got you in your feels?",
  "slay or flop? drop your hot take 🔥",
  "no cap, what's your current hyperfixation?",
  "it's giving main character energy — what's your book?",
  "serving looks AND book recs 📚",
  "POV: you just finished a banger, share it",
  "lowkey obsessed with this book, NGL...",
  "the vibes are immaculate rn, what u reading?",
  "this book ate and left no crumbs, wyd?",
];

const GEN_Z_EXPLORE_PROMPTS = [
  "🔪 dark academia vibes",
  "✨ fantasy but make it unhinged",
  "❤️ enemies to lovers szn",
  "🚀 sci-fi that hits different",
  "💡 main character energy self-help",
  "🏰 period drama but slay",
  "🐛 cozy mystery bestie",
  "💀 thriller that ate and left no crumbs",
  "🖤 morally grey characters only",
  "🌈 found family trope supremacy",
];

// Genre categories for AI recommendations
const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.6, reason: 'bestie this one eats NO crumbs 🔪', year: 2012, pages: 432 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', rating: 4.5, reason: 'the twist SENT me to another dimension', year: 2019, pages: 336 },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', rating: 4.6, reason: 'not okay after reading this, never will be', year: 2018, pages: 336 },
    { title: 'The Girl on the Train', author: 'Paula Hawkins', genre: 'Thriller', rating: 4.4, reason: 'unreliable narrator ate and left no crumbs', year: 2015, pages: 416 },
    { title: 'Sharp Objects', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.5, reason: 'dark academia but make it unhinged 🖤', year: 2006, pages: 336 },
    { title: 'Behind Closed Doors', author: 'B.A. Paris', genre: 'Thriller', rating: 4.3, reason: 'psychological thriller that will have you shook', year: 2016, pages: 304 },
    { title: 'The Woman in the Window', author: 'A.J. Finn', genre: 'Thriller', rating: 4.2, reason: 'agoraphobia meets murder mystery', year: 2018, pages: 448 },
    { title: 'Then She Was Gone', author: 'Lisa Jewell', genre: 'Thriller', rating: 4.4, reason: 'emotional rollercoaster with a twist', year: 2017, pages: 368 },
    { title: 'The Couple Next Door', author: 'Shari Lapena', genre: 'Thriller', rating: 4.1, reason: 'domestic thriller done RIGHT', year: 2016, pages: 320 },
    { title: 'I Let You Go', author: 'Clare Mackintosh', genre: 'Thriller', rating: 4.4, reason: 'the twist will break your brain', year: 2014, pages: 400 },
  ],
  fantasy: [
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, reason: 'living in my enemies-to-lovers era bc of this', year: 2023, pages: 528 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', rating: 4.7, reason: 'kvothe is lowkey the GOAT ngl', year: 2007, pages: 662 },
    { title: 'Mistborn', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.7, reason: 'magic system hits different fr', year: 2006, pages: 672 },
    { title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.8, reason: '3000 pages and i would read 3000 more', year: 2010, pages: 1008 },
    { title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', rating: 4.7, reason: 'chaos era but make it political', year: 1996, pages: 694 },
    { title: 'The Priory of the Orange Tree', author: 'Samantha Shannon', genre: 'Fantasy', rating: 4.5, reason: 'dragons, queerness, and political intrigue', year: 2019, pages: 848 },
    { title: 'The Poppy War', author: 'R.F. Kuang', genre: 'Fantasy', rating: 4.5, reason: 'dark, brutal, and absolutely incredible', year: 2018, pages: 544 },
    { title: 'The Blade Itself', author: 'Joe Abercrombie', genre: 'Fantasy', rating: 4.4, reason: 'grimdark fantasy at its finest', year: 2006, pages: 544 },
    { title: 'The Lies of Locke Lamora', author: 'Scott Lynch', genre: 'Fantasy', rating: 4.6, reason: 'heist fantasy that slaps', year: 2006, pages: 512 },
    { title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', rating: 4.7, reason: 'greek mythology from a feminist lens', year: 2018, pages: 416 },
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'enemies-to-lovers szn is upon us ☀️', year: 2020, pages: 384 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', rating: 4.6, reason: 'i sobbed. main character energy 💀', year: 2016, pages: 384 },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'friends-to-lovers slowburn hits different', year: 2021, pages: 384 },
    { title: 'The Love Hypothesis', author: 'Ali Hazelwood', genre: 'Romance', rating: 4.7, reason: 'STEM girlies this one is YOURS', year: 2021, pages: 384 },
    { title: 'Red White & Royal Blue', author: 'Casey McQuiston', genre: 'Romance', rating: 4.7, reason: 'chaotic bi energy and i am HERE for it', year: 2019, pages: 448 },
    { title: 'The Hating Game', author: 'Sally Thorne', genre: 'Romance', rating: 4.5, reason: 'office rivalry done RIGHT', year: 2016, pages: 384 },
    { title: 'Love & Other Words', author: 'Christina Lauren', genre: 'Romance', rating: 4.5, reason: 'childhood friends to lovers', year: 2018, pages: 432 },
    { title: 'The Unhoneymooners', author: 'Christina Lauren', genre: 'Romance', rating: 4.5, reason: 'fake dating but make it fun', year: 2019, pages: 416 },
    { title: 'Book Lovers', author: 'Emily Henry', genre: 'Romance', rating: 4.7, reason: 'for the book girlies', year: 2022, pages: 400 },
    { title: 'Happy Place', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'second chance romance', year: 2023, pages: 400 },
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'bestest book of all time no cap 🚀', year: 2021, pages: 496 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', rating: 4.8, reason: 'literally built different, no notes', year: 1965, pages: 896 },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'funny + smart = slay combo', year: 2011, pages: 384 },
    { title: 'Children of Time', author: 'Adrian Tchaikovsky', genre: 'Sci-Fi', rating: 4.7, reason: 'spiders that hit different (in a good way)', year: 2015, pages: 608 },
    { title: 'The Three-Body Problem', author: 'Cixin Liu', genre: 'Sci-Fi', rating: 4.6, reason: 'hard sci-fi ate and devoured', year: 2008, pages: 416 },
    { title: 'Foundation', author: 'Isaac Asimov', genre: 'Sci-Fi', rating: 4.7, reason: 'the OG of all sci-fi', year: 1951, pages: 256 },
    { title: 'Neuromancer', author: 'William Gibson', genre: 'Sci-Fi', rating: 4.4, reason: 'cyberpunk invented here', year: 1984, pages: 288 },
    { title: 'Hyperion', author: 'Dan Simmons', genre: 'Sci-Fi', rating: 4.6, reason: 'space opera that slaps', year: 1989, pages: 512 },
    { title: 'The Expanse: Leviathan Wakes', author: 'James S.A. Corey', genre: 'Sci-Fi', rating: 4.6, reason: 'best space opera of the decade', year: 2011, pages: 592 },
    { title: 'Snow Crash', author: 'Neal Stephenson', genre: 'Sci-Fi', rating: 4.5, reason: 'cyberpunk + linguistics = perfection', year: 1992, pages: 480 },
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, reason: 'actually changed my life no hyperbole', year: 2018, pages: 320 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, reason: 'money trauma healed in 200 pages', year: 2020, pages: 256 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, reason: 'we been in our delusional era for 300k years', year: 2011, pages: 464 },
    { title: 'Dare to Lead', author: 'Brené Brown', genre: 'Leadership', rating: 4.6, reason: 'vulnerability is the main character trait', year: 2018, pages: 320 },
    { title: 'The Power of Now', author: 'Eckhart Tolle', genre: 'Spirituality', rating: 4.6, reason: 'mindfulness but make it slay', year: 1997, pages: 256 },
    { title: 'Can\'t Hurt Me', author: 'David Goggins', genre: 'Self-Help', rating: 4.7, reason: 'motivation that will make you run through walls', year: 2018, pages: 384 },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', genre: 'Self-Help', rating: 4.5, reason: 'no filter life advice', year: 2016, pages: 224 },
    { title: 'Think Like a Monk', author: 'Jay Shetty', genre: 'Self-Help', rating: 4.4, reason: 'inner peace but make it modern', year: 2020, pages: 352 },
    { title: 'The 5 AM Club', author: 'Robin Sharma', genre: 'Self-Help', rating: 4.3, reason: 'morning routine that slaps', year: 2018, pages: 336 },
    { title: 'Good Vibes, Good Life', author: 'Vex King', genre: 'Self-Help', rating: 4.5, reason: 'manifestation era activated', year: 2018, pages: 304 },
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', rating: 4.7, reason: 'grandma of all mysteries, respect the OG', year: 1939, pages: 272 },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Fiction', rating: 4.7, reason: 'i would die for evelyn hugo literally', year: 2017, pages: 400 },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', rating: 4.5, reason: 'retirement home girlies are the real detectives', year: 2020, pages: 384 },
    { title: 'One of Us Is Lying', author: 'Karen M. McManus', genre: 'Mystery', rating: 4.5, reason: 'tiktok made me read this and i am grateful', year: 2017, pages: 384 },
    { title: 'The Guest List', author: 'Lucy Foley', genre: 'Mystery', rating: 4.4, reason: 'atmosphere was EVERYTHING 🌧️', year: 2020, pages: 384 },
    { title: 'The Maid', author: 'Nita Prose', genre: 'Mystery', rating: 4.4, reason: 'cozy mystery that warms your heart', year: 2022, pages: 304 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Mystery', rating: 4.5, reason: 'psychological thriller masterpiece', year: 2019, pages: 336 },
    { title: 'The Woman in the Library', author: 'Sulari Gentill', genre: 'Mystery', rating: 4.3, reason: 'meta mystery that blows your mind', year: 2022, pages: 288 },
    { title: 'The Paris Apartment', author: 'Lucy Foley', genre: 'Mystery', rating: 4.3, reason: 'locked room mystery in paris', year: 2022, pages: 384 },
    { title: 'The Last Thing He Told Me', author: 'Laura Dave', genre: 'Mystery', rating: 4.4, reason: 'emotional thriller with a twist', year: 2021, pages: 320 },
  ],
  historical: [
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical', rating: 4.7, reason: 'WWII novel that will break you', year: 2014, pages: 544 },
    { title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical', rating: 4.8, reason: 'narrated by Death itself', year: 2005, pages: 576 },
    { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical', rating: 4.8, reason: 'sisters in WWII France', year: 2015, pages: 448 },
    { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Historical', rating: 4.7, reason: 'Korean family saga across generations', year: 2017, pages: 512 },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', genre: 'Historical', rating: 4.8, reason: 'devastating and beautiful', year: 2003, pages: 384 },
    { title: 'A Thousand Splendid Suns', author: 'Khaled Hosseini', genre: 'Historical', rating: 4.8, reason: 'women in Afghanistan', year: 2007, pages: 432 },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', rating: 4.7, reason: 'the American Dream delusion', year: 1925, pages: 180 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Classic', rating: 4.8, reason: 'justice and childhood innocence', year: 1960, pages: 336 },
    { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Classic', rating: 4.8, reason: 'enemies to lovers ORIGINAL', year: 1813, pages: 432 },
    { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', genre: 'Dystopian', rating: 4.7, reason: 'terrifying and prophetic', year: 1985, pages: 336 },
  ],
  contemporary: [
    { title: 'Normal People', author: 'Sally Rooney', genre: 'Contemporary', rating: 4.4, reason: 'painfully accurate about modern relationships', year: 2018, pages: 288 },
    { title: 'Conversations with Friends', author: 'Sally Rooney', genre: 'Contemporary', rating: 4.3, reason: 'messy and real', year: 2017, pages: 336 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Contemporary', rating: 4.6, reason: 'philosophical and hopeful', year: 2020, pages: 304 },
    { title: 'Eleanor Oliphant Is Completely Fine', author: 'Gail Honeyman', genre: 'Contemporary', rating: 4.6, reason: 'quirky and heartbreaking', year: 2017, pages: 384 },
    { title: 'Where\'d You Go, Bernadette', author: 'Maria Semple', genre: 'Contemporary', rating: 4.4, reason: 'funny and unique format', year: 2012, pages: 336 },
    { title: 'Such a Fun Age', author: 'Kiley Reid', genre: 'Contemporary', rating: 4.3, reason: 'race and privilege explored', year: 2019, pages: 320 },
    { title: 'The Vanishing Half', author: 'Brit Bennett', genre: 'Contemporary', rating: 4.7, reason: 'identity and family', year: 2020, pages: 352 },
    { title: 'Little Fires Everywhere', author: 'Celeste Ng', genre: 'Contemporary', rating: 4.6, reason: 'suburbia secrets unravel', year: 2017, pages: 352 },
    { title: 'An American Marriage', author: 'Tayari Jones', genre: 'Contemporary', rating: 4.6, reason: 'love and injustice', year: 2018, pages: 320 },
    { title: 'The Dutch House', author: 'Ann Patchett', genre: 'Contemporary', rating: 4.5, reason: 'family saga with Tom Hanks narration', year: 2019, pages: 352 },
  ]
};

// ========================================
// SECTION 3: UTILITY FUNCTIONS
// ========================================

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (isNaN(diff)) return '';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
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
    .replace(/'/g, '&#39;');
};

const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ========================================
// SECTION 4: STORAGE HELPERS (with cross-tab sync)
// ========================================

// BroadcastChannel for cross-tab real-time sync
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('readcreww_sync') 
  : null;

const getLS = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Broadcast to other tabs
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'storage_update', key, value: JSON.stringify(value) });
    }
    return true;
  } catch {
    return false;
  }
};

const removeLS = (key) => {
  try {
    localStorage.removeItem(key);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'storage_remove', key });
    }
    return true;
  } catch {
    return false;
  }
};

// Listen for cross-tab updates
const addStorageListener = (callback) => {
  const handleStorage = (event) => {
    if (event.key && event.newValue !== null) {
      try {
        const value = JSON.parse(event.newValue);
        callback(event.key, value);
      } catch {
        callback(event.key, event.newValue);
      }
    }
  };
  
  const handleBroadcast = (event) => {
    if (event.data?.type === 'storage_update') {
      try {
        const value = JSON.parse(event.data.value);
        callback(event.data.key, value);
      } catch {
        callback(event.data.key, event.data.value);
      }
    } else if (event.data?.type === 'storage_remove') {
      callback(event.data.key, null);
    }
  };
  
  window.addEventListener('storage', handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  
  return () => {
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
};

// ========================================
// SECTION 5: GLOBAL DATA HELPERS
// ========================================

// Crews - Global, one book = one crew
const getGlobalCrews = () => getLS(STORAGE_KEYS.GLOBAL_CREWS, []);

const saveGlobalCrews = (crews) => {
  setLS(STORAGE_KEYS.GLOBAL_CREWS, crews);
};

const getOrCreateCrew = (bookTitle, bookAuthor, bookGenre, userEmail, userName) => {
  const crews = getGlobalCrews();
  const normalize = (str) => (str || '').trim().toLowerCase();
  const existing = crews.find(c => 
    normalize(c.name) === normalize(bookTitle) && 
    normalize(c.author) === normalize(bookAuthor)
  );
  
  if (existing) {
    return { crew: existing, created: false };
  }
  
  const newCrew = {
    id: generateId(),
    name: bookTitle,
    author: bookAuthor,
    genre: bookGenre || 'General',
    members: 1,
    createdBy: userEmail,
    createdByName: userName,
    createdAt: new Date().toISOString(),
    joinedEmails: [userEmail],
    chats: 0,
    coverImage: null,
  };
  
  const updated = [newCrew, ...crews];
  saveGlobalCrews(updated);
  return { crew: newCrew, created: true };
};

// Posts
const getGlobalPosts = () => getLS(STORAGE_KEYS.GLOBAL_POSTS, []);

const saveGlobalPost = (post) => {
  const posts = getGlobalPosts();
  posts.unshift(post);
  // Keep last 5000 posts for performance
  if (posts.length > 5000) posts.length = 5000;
  setLS(STORAGE_KEYS.GLOBAL_POSTS, posts);
};

const deleteGlobalPost = (postId) => {
  const posts = getGlobalPosts().filter(p => p.id !== postId);
  setLS(STORAGE_KEYS.GLOBAL_POSTS, posts);
};

// Reviews
const getGlobalReviews = () => getLS(STORAGE_KEYS.GLOBAL_REVIEWS, []);

const saveGlobalReview = (review) => {
  const reviews = getGlobalReviews();
  reviews.unshift(review);
  if (reviews.length > 2000) reviews.length = 2000;
  setLS(STORAGE_KEYS.GLOBAL_REVIEWS, reviews);
};

// Post Likes
const getPostLikes = (postId) => {
  const likes = getLS(STORAGE_KEYS.POST_LIKES(postId), []);
  return likes.length;
};

const hasUserLikedPost = (postId, userEmail) => {
  const likes = getLS(STORAGE_KEYS.POST_LIKES(postId), []);
  return likes.includes(userEmail);
};

const addPostLike = (postId, userEmail) => {
  const likes = getLS(STORAGE_KEYS.POST_LIKES(postId), []);
  if (!likes.includes(userEmail)) {
    likes.push(userEmail);
    setLS(STORAGE_KEYS.POST_LIKES(postId), likes);
  }
  return likes.length;
};

// Comments
const getPostComments = (postId) => getLS(STORAGE_KEYS.POST_COMMENTS(postId), []);

const addPostComment = (postId, comment) => {
  const comments = getPostComments(postId);
  comments.push(comment);
  setLS(STORAGE_KEYS.POST_COMMENTS(postId), comments);
  return comments;
};

// Notifications
const pushNotification = (targetEmail, notification) => {
  if (!targetEmail) return;
  const key = STORAGE_KEYS.NOTIFICATIONS(targetEmail);
  const list = getLS(key, []);
  
  const full = {
    id: generateId(),
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  // Deduplicate similar notifications in last 30 seconds
  const thirtySecsAgo = Date.now() - 30000;
  const isDuplicate = list.some(n => 
    n.type === full.type &&
    n.fromEmail === full.fromEmail &&
    n.postId === full.postId &&
    new Date(n.timestamp).getTime() > thirtySecsAgo
  );
  
  if (isDuplicate) return;
  
  list.unshift(full);
  if (list.length > 200) list.length = 200;
  setLS(key, list);
};

// User stats
const updateUserStats = (userEmail, updates) => {
  const stats = getLS(STORAGE_KEYS.STATS(userEmail), {
    booksRead: 0,
    reviewsGiven: 0,
    postsCreated: 0,
    crewsJoined: 0,
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    readingStreak: 0,
    lastActive: null,
  });
  
  Object.assign(stats, updates);
  setLS(STORAGE_KEYS.STATS(userEmail), stats);
  return stats;
};

// ========================================
// SECTION 6: SEED DATA
// ========================================

const SEED_CREWS = [
  { id: 'seed_atomic', name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', members: 124, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_fourth', name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 342, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_hailmary', name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 218, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_midnight', name: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', members: 189, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_sapiens', name: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', members: 156, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_silent', name: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', members: 233, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_gonegirl', name: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', members: 201, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_alchemist', name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', members: 287, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_becoming', name: 'Becoming', author: 'Michelle Obama', genre: 'Memoir', members: 167, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_psychology', name: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', members: 143, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_verity', name: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', members: 298, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
  { id: 'seed_beach', name: 'The Beach', author: 'Alex Garland', genre: 'Fiction', members: 95, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01', joinedEmails: [] },
];

const initGlobalData = () => {
  // Initialize crews
  const existingCrews = getGlobalCrews();
  if (existingCrews.length === 0) {
    saveGlobalCrews(SEED_CREWS);
  }
  
  // Initialize posts if empty
  const existingPosts = getGlobalPosts();
  if (existingPosts.length === 0) {
    const samplePosts = [
      {
        id: generateId(),
        content: "just finished Atomic Habits and my life is CHANGED bestie! no cap, this book ate 🔥",
        userName: "BookBestie",
        userEmail: "bookbestie@readcreww.com",
        createdAt: new Date().toISOString(),
        likes: 45,
        commentCount: 12,
        bookName: "Atomic Habits",
        author: "James Clear",
      },
      {
        id: generateId(),
        content: "Fourth Wing got me in my enemies-to-lovers era and i'm not recovering 😭❤️",
        userName: "FantasyQueen",
        userEmail: "fantasy@readcreww.com",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        likes: 89,
        commentCount: 23,
        bookName: "Fourth Wing",
        author: "Rebecca Yarros",
      },
    ];
    samplePosts.forEach(post => saveGlobalPost(post));
  }
};

// ========================================
// SECTION 7: COMPONENTS (Memoized for performance)
// ========================================

// Loading Spinner
const LoadingSpinner = memo(({ size = 'md', fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className={`${sizes[size]} border-4 border-t-orange-500 border-gray-200 rounded-full animate-spin`} />
      </div>
    );
  }
  return <div className={`${sizes[size]} border-4 border-t-orange-500 border-gray-200 rounded-full animate-spin`} />;
});

// Avatar Component
const Avatar = memo(({ initials, size = 'md', src, onClick, online = false }) => {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  
  const gradients = [
    'from-orange-400 to-pink-500',
    'from-violet-500 to-purple-600',
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-rose-400 to-red-500',
    'from-amber-400 to-orange-500',
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
          {(initials || '?').slice(0, 2).toUpperCase()}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
});

// Star Rating Component
const StarRating = memo(({ rating = 0, onChange, size = 'sm', readonly = false }) => {
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
});

// Book Cover Component with caching
const bookCoverCache = new Map();

const BookCover = memo(({ title, author, size = 'md', onClick }) => {
  const sizeMap = {
    xs: 'w-10 h-14',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-44',
    xl: 'w-40 h-52',
  };
  const cls = sizeMap[size] || sizeMap.md;
  const cacheKey = `${title}|${author}`;
  const [url, setUrl] = useState(bookCoverCache.get(cacheKey) || null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!bookCoverCache.has(cacheKey));
  
  useEffect(() => {
    if (bookCoverCache.has(cacheKey)) {
      setUrl(bookCoverCache.get(cacheKey));
      setLoading(false);
      return;
    }
    if (!title) {
      setError(true);
      setLoading(false);
      return;
    }
    
    let mounted = true;
    const query = encodeURIComponent(`${title} ${author || ''}`);
    
    const fetchCover = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&projection=lite`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok && mounted) {
          const data = await res.json();
          const links = data?.items?.[0]?.volumeInfo?.imageLinks;
          if (links) {
            const raw = links.extraLarge || links.large || links.medium || links.thumbnail;
            if (raw) {
              const imageUrl = raw.replace('http:', 'https:').replace('&edge=curl', '');
              bookCoverCache.set(cacheKey, imageUrl);
              setUrl(imageUrl);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Fall through to fallback
      }
      
      // Fallback: try Open Library
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${query}&limit=1`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok && mounted) {
          const data = await res.json();
          const book = data.docs?.[0];
          if (book?.cover_i) {
            const imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
            bookCoverCache.set(cacheKey, imageUrl);
            setUrl(imageUrl);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fall through to color fallback
      }
      
      if (mounted) {
        setError(true);
        setLoading(false);
      }
    };
    
    fetchCover();
    return () => { mounted = false; };
  }, [title, author, cacheKey]);
  
  const getFallbackColor = () => {
    const colors = ['#7C3AED', '#DC2626', '#059669', '#2563EB', '#D97706', '#DB2777', '#8B5CF6', '#EC4899'];
    const hash = (title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const initials = (title || 'BK').slice(0, 2).toUpperCase();
  
  if (loading) {
    return <div className={`${cls} bg-gray-100 rounded-xl animate-pulse`} onClick={onClick} />;
  }
  
  if (error || !url) {
    return (
      <div
        className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform shadow`}
        style={{ backgroundColor: getFallbackColor() }}
        onClick={onClick}
      >
        <span className="text-xl">{initials}</span>
        <BookOpen className="w-4 h-4 mt-1 opacity-60" />
      </div>
    );
  }
  
  return (
    <div className={`${cls} rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`} onClick={onClick}>
      <img
        src={url}
        alt={`Cover of ${title}`}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
});

// Toast Notification Component
const Toast = memo(({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    follow: <UserCheck className="w-4 h-4 text-green-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    info: <Info className="w-4 h-4 text-orange-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
  };
  
  const backgrounds = {
    like: 'bg-red-50 border-red-200',
    comment: 'bg-blue-50 border-blue-200',
    follow: 'bg-green-50 border-green-200',
    reshare: 'bg-indigo-50 border-indigo-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-orange-50 border-orange-200',
    warning: 'bg-amber-50 border-amber-200',
  };
  
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-slideDown">
      <div className={`rounded-2xl shadow-2xl border-2 p-3 flex items-center gap-3 ${backgrounds[notification.type] || 'bg-white border-gray-200'}`}>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          {icons[notification.type] || <Bell className="w-4 h-4 text-gray-500" />}
        </div>
        <p className="text-sm font-medium text-gray-900 flex-1 leading-snug">{notification.message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// ========================================
// SECTION 8: LOGIN PAGE
// ========================================

const LoginPage = memo(({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  
  const handleSendOTP = () => {
    setError('');
    if (!isLogin && name.trim().length < 2) {
      setError('Drop your name bestie 👀');
      return;
    }
    if (!validateEmail(email)) {
      setError('That email ain\'t it chief 😬');
      return;
    }
    if (!isLogin && !agreeToTerms) {
      setError('Gotta agree to the terms bestie');
      return;
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setDevOtp(otpCode);
    setLS('rcreww_pending_otp', otpCode);
    setLS('rcreww_pending_user', { email, name: name || email.split('@')[0], password: password || 'password123', readingGoal });
    setShowOtp(true);
  };
  
  const handleVerifyOTP = () => {
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit code bestie');
      return;
    }
    const savedOtp = getLS('rcreww_pending_otp', '');
    const pendingUser = getLS('rcreww_pending_user', {});
    
    if (otp !== savedOtp) {
      setError('Wrong code bestie 😭');
      return;
    }
    
    const userData = {
      id: generateId(),
      name: pendingUser.name || name,
      email: pendingUser.email || email,
      password: pendingUser.password || password,
      readingGoal: pendingUser.readingGoal || readingGoal,
      bio: 'living my best bookish era 📚',
      createdAt: new Date().toISOString(),
      profileImage: null,
    };
    
    const users = getLS(STORAGE_KEYS.USERS, []);
    const existingIndex = users.findIndex(u => u.email === userData.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users.push(userData);
    }
    setLS(STORAGE_KEYS.USERS, users);
    setLS(STORAGE_KEYS.CURRENT_USER, userData);
    
    // Initialize user data structures
    const initArrays = ['following', 'followers', 'blocked', 'saved_posts', 'liked_posts', 'reading_list'];
    initArrays.forEach(key => {
      const storageKey = STORAGE_KEYS[key.toUpperCase()]?.(userData.email) || `rcreww_${key}_${userData.email}`;
      if (!getLS(storageKey, null)) setLS(storageKey, []);
    });
    
    // Initialize stats
    if (!getLS(STORAGE_KEYS.STATS(userData.email), null)) {
      setLS(STORAGE_KEYS.STATS(userData.email), {
        booksRead: 0,
        reviewsGiven: 0,
        postsCreated: 0,
        crewsJoined: 0,
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
        readingStreak: 1,
        lastActive: new Date().toISOString(),
      });
    }
    
    removeLS('rcreww_pending_otp');
    removeLS('rcreww_pending_user');
    setShowOtp(false);
    onLogin(userData);
  };
  
  const handleLogin = () => {
    setError('');
    if (!validateEmail(email)) {
      setError('Enter a valid email bestie');
      return;
    }
    if (!password.trim()) {
      setError('Password is mandatory no cap');
      return;
    }
    
    setLoading(true);
    const users = getLS(STORAGE_KEYS.USERS, []);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      if (found.password === password) {
        setLS(STORAGE_KEYS.CURRENT_USER, found);
        setLoading(false);
        onLogin(found);
        return;
      } else {
        setError('Wrong password bestie 🫣');
      }
    } else {
      setError('No account found — sign up first!');
    }
    setLoading(false);
  };
  
  if (showOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">check your email bestie</h2>
            <p className="text-gray-500 text-sm mt-1">sent a vibe-check code to <strong>{email}</strong></p>
          </div>
          {devOtp && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center mb-4">
              <p className="text-xs text-amber-700 font-semibold mb-1">🔒 demo mode — your code:</p>
              <p className="text-4xl font-black text-amber-800 tracking-widest">{devOtp}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="w-full px-4 py-4 border-2 border-gray-200 focus:border-orange-400 rounded-xl text-center text-3xl tracking-widest font-mono outline-none mb-4"
            placeholder="000000"
            maxLength={6}
            autoFocus
          />
          <button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black disabled:opacity-40 mb-3"
          >
            it's giving verified ✅
          </button>
          <button
            onClick={() => { setShowOtp(false); setError(''); setDevOtp(''); }}
            className="w-full text-gray-500 text-sm flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-1">{APP_TAGLINE}</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-5">
            {isLogin ? 'welcome back bestie 👋' : 'join the crew fr 🔥'}
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            {!isLogin && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="your name (no cap)"
                  autoComplete="name"
                />
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                placeholder="email address"
                type="email"
                autoComplete="email"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                type={showPassword ? 'text' : 'password'}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                placeholder={isLogin ? 'password' : 'create password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            
            {!isLogin && (
              <>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-orange-500" /> Reading Goals
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly books</label>
                      <input
                        type="number"
                        value={readingGoal.yearly}
                        onChange={e => setReadingGoal({ ...readingGoal, yearly: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                        min="0"
                        max="200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly books</label>
                      <input
                        type="number"
                        value={readingGoal.monthly}
                        onChange={e => setReadingGoal({ ...readingGoal, monthly: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                        min="0"
                        max="30"
                      />
                    </div>
                  </div>
                </div>
                
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={e => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5 accent-orange-500"
                  />
                  <span className="text-xs text-gray-500">i agree to terms & privacy policy (the grown up stuff)</span>
                </label>
              </>
            )}
          </div>
          
          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black disabled:opacity-50 hover:opacity-90 transition"
          >
            {loading ? <LoadingSpinner size="sm" /> : (isLogin ? 'log in bestie 🚀' : 'create account fr →')}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "don't have an account? " : "already one of us? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setEmail(''); setPassword(''); setName(''); }}
              className="text-orange-500 font-black"
            >
              {isLogin ? 'sign up' : 'log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
});

// ========================================
// SECTION 9: BOTTOM NAVIGATION
// ========================================

const BottomNav = memo(({ active, setPage, unreadMessages = 0 }) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'reviews', icon: Star, label: 'Reviews' },
    { id: 'crews', icon: Users, label: 'Crews' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 shadow-lg">
      <div className="flex items-center justify-around py-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative ${active === id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full -mt-5 flex items-center justify-center shadow-lg ${active === id ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {id === 'crews' && unreadMessages > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
            <span className={`text-[10px] font-semibold ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

// ========================================
// SECTION 10: TOP BAR
// ========================================

const TopBar = memo(({ user, setPage, notificationCount = 0, profileSrc }) => {
  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-black text-gray-900 text-lg tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          {APP_NAME}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage('notifications')}
          className="relative p-2 hover:bg-gray-100 rounded-xl transition"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          <Avatar initials={user?.name} size="sm" src={profileSrc} />
        </button>
      </div>
    </header>
  );
});

// ========================================
// SECTION 11: POST CARD (with all interactions)
// ========================================

const PostCard = memo(({
  post,
  user,
  profileSrc,
  onViewUser,
  onSave,
  isSaved,
  onDelete,
  onFollow,
  isFollowing,
  onBlock,
  isBlocked,
  onViewBookDetails,
  onToast,
}) => {
  const [liked, setLiked] = useState(() => hasUserLikedPost(post.id, user.email));
  const [likes, setLikes] = useState(() => getPostLikes(post.id));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const isOwn = post.userEmail === user.email;
  
  const loadComments = useCallback(() => {
    setComments(getPostComments(post.id));
  }, [post.id]);
  
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, loadComments]);
  
  const handleLike = useCallback(() => {
    if (liked) return;
    const newCount = addPostLike(post.id, user.email);
    setLiked(true);
    setLikes(newCount);
    
    if (!isOwn) {
      pushNotification(post.userEmail, {
        type: 'like',
        fromEmail: user.email,
        fromName: user.name,
        message: `${user.name} vibed with your post ❤️`,
        postId: post.id,
      });
    }
  }, [liked, post.id, post.userEmail, user.email, user.name, isOwn]);
  
  const handleComment = useCallback(() => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: generateId(),
      userEmail: user.email,
      userName: user.name,
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    
    const updated = addPostComment(post.id, comment);
    setComments(updated);
    setNewComment('');
    
    if (!isOwn) {
      pushNotification(post.userEmail, {
        type: 'comment',
        fromEmail: user.email,
        fromName: user.name,
        message: `${user.name} dropped a comment: "${newComment.trim().slice(0, 50)}"`,
        postId: post.id,
      });
    }
  }, [newComment, post.id, user, isOwn]);
  
  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.userName}`,
        text: post.content,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      onToast({ type: 'success', message: 'link copied bestie 🔗' });
    }
  };
  
  return (
    <>
      {showOptions && (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-end justify-center" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
          <div className="bg-white rounded-t-3xl w-full p-4 space-y-1">
            <p className="text-center text-xs text-gray-400 font-semibold mb-3">POST OPTIONS</p>
            <button
              onClick={() => { onSave(post); setShowOptions(false); }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl text-sm font-semibold"
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'text-orange-500' : 'text-gray-500'}`} />
              {isSaved ? 'unsave this fr' : 'save for later'}
            </button>
            {!isOwn && (
              <>
                <button
                  onClick={() => { onFollow(post.userEmail, post.userName); setShowOptions(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl text-sm font-semibold"
                >
                  {isFollowing ? <UserMinus className="w-5 h-5 text-red-500" /> : <UserPlus className="w-5 h-5 text-green-500" />}
                  {isFollowing ? 'unfollow 💀' : 'follow bestie 👋'}
                </button>
                <button
                  onClick={() => { onBlock(post.userEmail); setShowOptions(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl text-sm font-semibold"
                >
                  {isBlocked ? <UserCheck className="w-5 h-5 text-green-500" /> : <UserMinus className="w-5 h-5 text-red-500" />}
                  {isBlocked ? 'unblock' : 'block user 🚫'}
                </button>
              </>
            )}
            {isOwn && (
              <button
                onClick={() => { if (window.confirm('delete this post fr?')) { onDelete(post); setShowOptions(false); } }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 rounded-xl text-sm font-semibold text-red-500"
              >
                <Trash2 className="w-5 h-5" /> delete post 🗑️
              </button>
            )}
            <button onClick={() => setShowOptions(false)} className="w-full px-4 py-3 text-sm text-gray-400 font-semibold hover:bg-gray-50 rounded-xl">
              nvm, cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-start gap-3">
          <button onClick={() => onViewUser(post.userEmail, post.userName)}>
            <Avatar initials={post.userName} size="md" src={post.userPhoto} />
          </button>
          <div className="flex-1 min-w-0">
            <button onClick={() => onViewUser(post.userEmail, post.userName)} className="font-bold text-sm text-gray-900 hover:underline">
              {post.userName}
            </button>
            {post.isReshare && <span className="ml-2 text-xs text-gray-400">🔁 reshared</span>}
            <p className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</p>
            {post.bookName && (
              <button
                onClick={() => onViewBookDetails?.({ title: post.bookName, author: post.author })}
                className="flex items-center gap-1 text-xs text-orange-500 font-medium mt-0.5 hover:underline"
              >
                <BookOpen className="w-3 h-3" /> {post.bookName}{post.author && ` · ${post.author}`}
              </button>
            )}
          </div>
          <button onClick={() => setShowOptions(true)} className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-3">
          {post.image && (
            <img
              src={post.image}
              alt=""
              className="w-full rounded-xl mb-3 max-h-80 object-cover cursor-pointer"
              onClick={() => window.open(post.image, '_blank')}
              loading="lazy"
            />
          )}
          <p className="text-gray-800 text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {post.content}
          </p>
        </div>
        
        {/* Actions */}
        <div className="px-4 py-2.5 border-t border-gray-50 flex items-center gap-5">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center gap-1.5 text-sm font-bold transition ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''} transition-transform ${liked ? 'scale-110' : ''}`} />
            {likes}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-sm font-bold transition ${showComments ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
          >
            <MessageCircle className="w-5 h-5" />
            {comments.length || post.commentCount || 0}
          </button>
          <button
            onClick={() => onSave(post)}
            className={`flex items-center gap-1.5 text-sm font-bold transition ${isSaved ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
          </button>
          <button onClick={handleShare} className="ml-auto text-gray-400 hover:text-orange-400 transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-50">
            <div className="px-4 py-3 flex items-center gap-2 bg-gray-50/60">
              <Avatar initials={user.name} size="xs" src={profileSrc} />
              <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-2 focus-within:border-orange-400 transition">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(); } }}
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                  placeholder="add your take..."
                />
              </div>
              <button
                onClick={handleComment}
                disabled={!newComment.trim()}
                className={`px-3 py-1.5 rounded-full text-sm font-black transition ${newComment.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                post
              </button>
            </div>
            <div className="px-4 py-2 space-y-3 max-h-72 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">no comments yet, be the main character 🎬</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar initials={c.userName} size="xs" />
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-xs font-bold text-gray-900">{c.userName}</p>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(c.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
});

// ========================================
// SECTION 12: HOME PAGE (with personalized feed)
// ========================================

const HomePage = memo(({
  user,
  profileSrc,
  savedPosts,
  onSave,
  onDelete,
  onFollow,
  following,
  onBlock,
  blockedUsers,
  onViewUser,
  onViewBookDetails,
  onToast,
  setPage,
}) => {
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingProgress, setReadingProgress] = useState(0);
  
  const loadFeed = useCallback(() => {
    const allPosts = getGlobalPosts().filter(p => !blockedUsers.includes(p.userEmail));
    // Personalized: show following posts first, then others by recency
    const followingPosts = allPosts.filter(p => following.includes(p.userEmail));
    const otherPosts = allPosts.filter(p => !following.includes(p.userEmail));
    setPosts([...followingPosts, ...otherPosts].slice(0, 100));
  }, [following, blockedUsers]);
  
  useEffect(() => {
    loadFeed();
    
    // Load trending books
    const trendingBooks = [
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6 },
      { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8 },
      { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
      { title: 'Verity', author: 'Colleen Hoover', rating: 4.6 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', rating: 4.7 },
    ];
    setTrending(trendingBooks);
    
    // Load user stats
    const userStats = getLS(STORAGE_KEYS.STATS(user.email), {
      booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0
    });
    setStats(userStats);
    
    if (user.readingGoal?.yearly > 0) {
      setReadingProgress(Math.min((userStats.booksRead / user.readingGoal.yearly) * 100, 100));
    }
    
    // Listen for new posts from other tabs
    const handleStorage = (key) => {
      if (key === STORAGE_KEYS.GLOBAL_POSTS) {
        loadFeed();
      }
    };
    
    const unsubscribe = addStorageListener(handleStorage);
    return () => unsubscribe();
  }, [user.email, user.readingGoal, loadFeed]);
  
  const placeholderText = GEN_Z_PLACEHOLDERS[Math.floor(Date.now() / 600000) % GEN_Z_PLACEHOLDERS.length];
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar user={user} setPage={setPage} notificationCount={0} profileSrc={profileSrc} />
      
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={onViewBookDetails}
          currentUser={user}
        />
      )}
      
      <div className="px-4 py-4 space-y-5">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-3xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">hey {user?.name?.split(' ')[0]} 🔥</h2>
              <p className="text-orange-100 text-sm mt-0.5">your vibe feed is loading bestie</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              ['📚', stats.booksRead, 'read'],
              ['⭐', stats.reviewsGiven, 'reviews'],
              ['✍️', stats.postsCreated, 'posts'],
              ['👥', stats.crewsJoined, 'crews'],
            ].map(([emoji, value, label]) => (
              <div key={label} className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm">
                <p className="text-base">{emoji}</p>
                <p className="font-black text-lg leading-tight">{value || 0}</p>
                <p className="text-[10px] text-orange-100">{label}</p>
              </div>
            ))}
          </div>
          {user.readingGoal?.yearly > 0 && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Reading Goal</span>
                <span className="font-semibold">{stats.booksRead}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${readingProgress}%` }} />
              </div>
            </div>
          )}
        </div>
        
        {/* Trending Books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" /> trending rn 🔥
            </h2>
            <button onClick={() => setPage('explore')} className="text-orange-500 text-sm font-bold">
              see all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {trending.map((book, i) => (
              <div key={i} className="flex-shrink-0 w-24 cursor-pointer" onClick={() => setSelectedBook(book)}>
                <BookCover title={book.title} author={book.author} size="md" />
                <p className="text-xs font-bold text-gray-900 mt-1.5 line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[10px] text-gray-500 truncate">{book.author}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Create Post CTA */}
        <button
          onClick={() => setPage('post')}
          className="w-full bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition"
        >
          <Avatar initials={user?.name} size="sm" src={profileSrc} />
          <span className="text-gray-400 text-sm flex-1 text-left">{placeholderText}</span>
          <span className="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>
        
        {/* Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" /> your feed
            </h2>
            <button onClick={loadFeed} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500">
              <RefreshCw className="w-3.5 h-3.5" /> refresh
            </button>
          </div>
          
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-gray-500 font-semibold">no posts yet bestie</p>
              <p className="text-gray-400 text-sm mt-1">be the main character and post first</p>
              <button onClick={() => setPage('post')} className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition">
                create post 🔥
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <PostCard
                  key={post.id || idx}
                  post={post}
                  user={user}
                  profileSrc={profileSrc}
                  onViewUser={onViewUser}
                  onSave={onSave}
                  isSaved={savedPosts.includes(post.id)}
                  onDelete={onDelete}
                  onFollow={onFollow}
                  isFollowing={following.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers.includes(post.userEmail)}
                  onViewBookDetails={setSelectedBook}
                  onToast={onToast}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ========================================
// SECTION 13: POST PAGE
// ========================================

const PostPage = memo(({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);
  const charCount = content.length;
  const placeholder = GEN_Z_PLACEHOLDERS[Math.floor(Math.random() * GEN_Z_PLACEHOLDERS.length)];
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    
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
      createdAt: new Date().toISOString(),
      likes: 0,
      commentCount: 0,
      reshareCount: 0,
    };
    
    saveGlobalPost(postData);
    onPost(postData);
    
    // Update stats
    const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    setLS(STORAGE_KEYS.STATS(user.email), stats);
    
    setPosting(false);
    setPage('home');
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB bestie');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="fixed inset-0 bg-white z-[55] flex flex-col" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-xl">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-black text-gray-900">create post</h2>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || posting}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black disabled:opacity-40 hover:opacity-90 transition"
        >
          {posting ? <LoadingSpinner size="sm" /> : 'slay 🔥'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none leading-relaxed"
              placeholder={placeholder}
              rows={7}
              maxLength={1000}
              autoFocus
            />
            <p className={`text-right text-xs ${charCount > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
              {charCount}/1000
            </p>
          </div>
        </div>
        
        {image && (
          <div className="relative mb-4">
            <img src={image} alt="" className="w-full rounded-2xl max-h-64 object-cover" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        
        <div className="space-y-3 mb-4">
          <input
            value={bookName}
            onChange={e => setBookName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 transition"
            placeholder="📖 book name (optional)"
          />
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 transition"
            placeholder="✍️ author (optional)"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            <Camera className="w-4 h-4" /> add pic
          </button>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${isPublic ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-white'}`}
          >
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'public' : 'private'}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
    </div>
  );
});

// ========================================
// SECTION 14: BOOK DETAILS MODAL (Full description)
// ========================================

const BookDetailsModal = memo(({ book, onClose, onCreateCrew, currentUser }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  
  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
      
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`,
          { signal: AbortSignal.timeout(10000) }
        );
        
        if (res.ok && mounted) {
          const data = await res.json();
          const info = data?.items?.[0]?.volumeInfo;
          
          if (info) {
            setDetails({
              title: info.title,
              subtitle: info.subtitle,
              authors: info.authors || [book.author],
              description: info.description ? info.description.replace(/<[^>]*>/g, '') : 
                'No description available for this title yet. Check the author\'s official site or Goodreads for more details.',
              pageCount: info.pageCount,
              publishedDate: info.publishedDate,
              publisher: info.publisher,
              categories: info.categories || [],
              averageRating: info.averageRating,
              ratingsCount: info.ratingsCount,
              previewLink: info.previewLink,
              language: info.language,
              isbn: info.industryIdentifiers,
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fall through to fallback
      }
      
      if (mounted) {
        setDetails({
          title: book.title,
          authors: [book.author || 'Unknown'],
          description: 'We couldn\'t fetch the full description right now, but trust us — this one\'s a vibe. Hit up Goodreads for the full tea ☕',
          categories: [],
        });
        setLoading(false);
      }
    };
    
    fetchDetails();
    return () => { mounted = false; };
  }, [book.title, book.author]);
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-3xl">
          <h3 className="font-bold text-lg text-gray-900">Book Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : details ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <BookCover title={book.title} author={book.author} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{details.title}</h2>
                {details.subtitle && <p className="text-sm text-gray-500 mt-0.5">{details.subtitle}</p>}
                <p className="text-gray-500 text-sm mt-1">by {details.authors?.join(', ')}</p>
                {details.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}
                {details.averageRating && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <StarRating rating={Math.round(details.averageRating)} size="xs" readonly />
                    <span className="text-xs text-gray-600">{details.averageRating.toFixed(1)} ({details.ratingsCount?.toLocaleString() || 0})</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {['description', 'details'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold border-b-2 transition capitalize ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {activeTab === 'description' && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4">
                {/* FULL description - no truncation */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {details.description}
                </p>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="space-y-0 divide-y divide-gray-100">
                {[
                  ['Pages', details.pageCount],
                  ['Published', details.publishedDate ? new Date(details.publishedDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : null],
                  ['Publisher', details.publisher],
                  ['Language', details.language?.toUpperCase()],
                  ['ISBN', details.isbn?.[0]?.identifier],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { onCreateCrew(book); onClose(); }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95"
              >
                <Users className="w-4 h-4" /> Create Crew
              </button>
              {details.previewLink && (
                <a
                  href={details.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

// ========================================
// SECTION 15: EXPLORE PAGE (AI Chat + Character Search + Nearby Libraries)
// ========================================

// AI Chat Message Component
const ChatMessage = memo(({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'}`}>
        {message.content}
      </div>
    </div>
  );
});

// Character Search Component
const CharacterSearch = memo(({ onViewDetails, onCreateCrew }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const q = encodeURIComponent(`character ${query} book`);
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&projection=lite`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const books = (data?.items || []).map(item => ({
        title: item.volumeInfo?.title,
        author: item.volumeInfo?.authors?.[0] || 'Unknown',
        genre: item.volumeInfo?.categories?.[0] || 'Fiction',
        rating: item.volumeInfo?.averageRating || 4.0,
        reason: `contains "${query}" as a character`,
      })).filter(b => b.title);
      setResults(books);
    } catch (err) {
      // Fallback to local DB
      const allBooks = Object.values(BOOK_DB).flat();
      const filtered = allBooks.filter(b => 
        b.title.toLowerCase().includes(query.toLowerCase()) || 
        b.author.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }
    setLoading(false);
  };
  
  return (
    <div>
      <h2 className="font-black text-gray-900 text-lg mb-3 flex items-center gap-2">🎭 search by character</h2>
      <p className="text-sm text-gray-500 mb-4">type a character name and we'll find the book bestie</p>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 focus-within:border-orange-400 transition">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(); }}
            className="flex-1 py-3 text-sm outline-none bg-transparent"
            placeholder="e.g. Hermione, Jay Gatsby, Kvothe..."
          />
        </div>
        <button
          onClick={search}
          disabled={!query.trim() || loading}
          className="px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-black disabled:opacity-40 hover:bg-orange-600 transition"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'go'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-semibold">BOOKS WITH "{query.toUpperCase()}"</p>
          {results.map((book, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex gap-3">
                <BookCover title={book.title} author={book.author} size="sm" onClick={() => onViewDetails(book)} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 text-sm leading-tight">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
                  {book.genre && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{book.genre}</span>}
                  {book.reason && <p className="text-xs text-gray-500 mt-1 italic">"{book.reason}"</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <StarRating rating={Math.round(book.rating || 4)} size="xs" readonly />
                    <span className="text-xs font-bold text-gray-700">{book.rating || 4.0}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => onViewDetails(book)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition">
                  View Details
                </button>
                <button onClick={() => onCreateCrew(book)} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:opacity-90 transition">
                  <Users className="w-3.5 h-3.5" /> Join Crew
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Nearby Libraries Component
const NearbyLibraries = memo(() => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  
  const findLibraries = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError("Location not supported bestie 😭");
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Use OpenStreetMap Nominatim to find nearby libraries
        fetch(`https://nominatim.openstreetmap.org/search?q=library&format=json&limit=5&bounded=1&viewbox=${longitude - 0.1},${latitude + 0.1},${longitude + 0.1},${latitude - 0.1}`)
          .then(res => res.json())
          .then(data => {
            const results = data.map(lib => ({
              name: lib.display_name.split(',')[0],
              address: lib.display_name,
              lat: parseFloat(lib.lat),
              lng: parseFloat(lib.lon),
            }));
            
            if (results.length) {
              setLibraries(results);
            } else {
              setLibraries([{
                name: 'Search Libraries Near You',
                address: 'Try Google Maps for more options!',
                lat: latitude,
                lng: longitude,
              }]);
            }
            setLoading(false);
          })
          .catch(() => {
            setLibraries([{
              name: 'Search Libraries Near You',
              address: 'Open Google Maps to find libraries',
              lat: latitude,
              lng: longitude,
            }]);
            setLoading(false);
          });
      },
      () => {
        setError("Blocked location fr — enable it in browser settings");
        setLoading(false);
      }
    );
  };
  
  return (
    <div>
      <h2 className="font-black text-gray-900 text-lg mb-2 flex items-center gap-2">🗺️ nearby libraries</h2>
      <p className="text-sm text-gray-500 mb-4">find where to cop your next read IRL bestie</p>
      
      <button
        onClick={findLibraries}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition mb-4"
      >
        {loading ? <><LoadingSpinner size="sm" /> locating...</> : <><Navigation className="w-4 h-4" /> find libraries near me</>}
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center mb-3">
          {error}
        </div>
      )}
      
      {libraries.length > 0 && (
        <div className="space-y-3">
          {libraries.map((lib, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">{lib.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lib.address}</p>
                  <a
                    href={`https://maps.google.com/?q=${lib.lat},${lib.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline"
                  >
                    <Navigation className="w-3 h-3" /> open in maps
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {libraries.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">📍</p>
          <p className="text-sm font-semibold">tap the button to find libraries near u</p>
        </div>
      )}
    </div>
  );
});

// Explore Book Card Component
const ExploreBookCard = memo(({ book, onCreateCrew, onViewDetails }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex gap-3">
        <BookCover title={book.title} author={book.author} size="sm" onClick={() => onViewDetails(book)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-sm leading-tight">{book.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
          {book.genre && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{book.genre}</span>}
          {book.reason && <p className="text-xs text-gray-500 mt-1 italic">"{book.reason}"</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <StarRating rating={Math.round(book.rating || 4)} size="xs" readonly />
            <span className="text-xs font-bold text-gray-700">{book.rating || 4.0}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <button onClick={() => onViewDetails(book)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition">
          View Details
        </button>
        <button onClick={() => onCreateCrew(book)} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:opacity-90 transition">
          <Users className="w-3.5 h-3.5" /> Join Crew
        </button>
      </div>
    </div>
  );
});

// AI Chat Response Generator
const detectGenreForAI = (text) => {
  const t = text.toLowerCase();
  if (/thriller|suspense|crime|murder|dark|horror|detective|psychological|creepy/i.test(t)) return 'thriller';
  if (/fantasy|magic|dragon|wizard|enemies.to.lovers|fae|romantasy|sword|epic/i.test(t)) return 'fantasy';
  if (/romance|love|swoony|kiss|dating|trope|spicy|bookboyfriend|heartfelt/i.test(t)) return 'romance';
  if (/sci.?fi|space|future|robot|alien|tech|mars|nasa|dystopian|cyberpunk/i.test(t)) return 'scifi';
  if (/self.?help|habit|productivity|motivation|improve|success|mindset|business|finance|invest|money|growth/i.test(t)) return 'selfhelp';
  if (/mystery|whodunit|cozy|clue|puzzle|agatha|detective|investigation/i.test(t)) return 'mystery';
  if (/historical|period|war|ancient|medieval|century|wwii|victorian|regency/i.test(t)) return 'historical';
  return 'contemporary';
};

const generateAIResponse = (userMessage, previousBooks = []) => {
  const genre = detectGenreForAI(userMessage);
  const books = BOOK_DB[genre] || BOOK_DB.contemporary;
  const fresh = books.filter(b => !previousBooks.some(pb => pb.title === b.title));
  const recommendations = (fresh.length >= 5 ? fresh : books).slice(0, 5);
  
  const intros = {
    thriller: "okay bestie the dark academia villain era is CALLING 🔪 here are your thrills:",
    fantasy: "fantasy girlie/guy/bestie era has been activated ✨ these ones ate:",
    romance: "enemies-to-lovers szn is upon us ❤️ ur heart is not ready:",
    scifi: "we're going full nerd and i'm HERE for it 🚀 these slap:",
    selfhelp: "main character development arc activated 💡 these will literally change ur life:",
    mystery: "okay detective mode: ON 🔍 these will have you guessing:",
    historical: "period drama but make it slay 🏰 these transported me:",
    contemporary: "real life but make it ✨ aesthetic ✨ these hit different:",
  };
  
  return {
    reply: intros[genre] || "okay fr these books ate 📚 trust the process bestie:",
    books: recommendations,
  };
};

// Main Explore Page Component
const ExplorePage = memo(({ user, setPage, onCreateCrew }) => {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "heyyy bestie! 👋 i'm Page Turner, your AI book bestie. spill what vibe you're in — genre, mood, last book you were obsessed with. let's find your next hyperfixation 📚✨",
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: Date.now() }]);
    setLoading(true);
    
    // Try Anthropic API if available, otherwise use local AI
    let usedAPI = false;
    try {
      // Using a free/fallback API endpoint - you can replace with your own
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are Page Turner, a Gen Z AI book recommendation bestie for READCREWW. Use Gen Z language (bestie, slay, no cap, fr, hits different, ate, lowkey, it's giving, main character energy). Recommend 3-5 specific books with authors. Keep responses under 150 words. End with an emoji.`,
          messages: [...messages.slice(-6).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userText }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const reply = data?.content?.[0]?.text;
        if (reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }]);
          usedAPI = true;
        }
      }
    } catch (err) {
      // Fall through to local AI
    }
    
    if (!usedAPI) {
      const { reply, books } = generateAIResponse(userText, recommendations);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }]);
      if (books.length) setRecommendations(books);
    }
    
    setLoading(false);
  };
  
  const handleCreateCrew = (book) => {
    onCreateCrew(book);
    setPage('crews');
  };
  
  const tabs = [
    { id: 'chat', label: '✨ AI Chat', icon: MessageSquare },
    { id: 'character', label: '🎭 By Character', icon: Search },
    { id: 'libraries', label: '🗺️ Nearby Libraries', icon: Navigation },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>explore 🔍</h1>
        <p className="text-sm text-gray-500">find your next hyperfixation</p>
      </div>
      
      {/* Mode Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition ${mode === id ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={handleCreateCrew}
          currentUser={user}
        />
      )}
      
      {/* AI CHAT TAB */}
      {mode === 'chat' && (
        <>
          <div className="px-4 space-y-3 pb-40">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} isUser={msg.role === 'user'} />
            ))}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {recommendations.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-orange-200" />
                  <span className="text-xs text-orange-500 font-black">📚 RECS FOR U</span>
                  <div className="h-px flex-1 bg-orange-200" />
                </div>
                {recommendations.map((book, i) => (
                  <ExploreBookCard
                    key={i}
                    book={book}
                    onViewDetails={setSelectedBook}
                    onCreateCrew={handleCreateCrew}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {GEN_Z_EXPLORE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt.substring(2))}
                    className="flex-shrink-0 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-xs text-orange-600 font-semibold hover:bg-orange-50 transition whitespace-nowrap shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Input */}
          <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="spill what vibe you're after bestie..."
                  className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${input.trim() && !loading ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* CHARACTER SEARCH TAB */}
      {mode === 'character' && (
        <div className="px-4">
          <CharacterSearch onViewDetails={setSelectedBook} onCreateCrew={handleCreateCrew} />
        </div>
      )}
      
      {/* NEARBY LIBRARIES TAB */}
      {mode === 'libraries' && (
        <div className="px-4">
          <NearbyLibraries />
        </div>
      )}
    </div>
  );
});

// ========================================
// SECTION 16: REVIEWS PAGE
// ========================================

const ReviewsPage = memo(({ user, setPage, onToast, onViewUser }) => {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    bookName: '',
    author: '',
    rating: 5,
    review: '',
    sentiment: 'positive',
  });
  const [likedReviews, setLikedReviews] = useState(() => getLS(`rcreww_liked_reviews_${user.email}`, []));
  
  useEffect(() => {
    setReviews(getGlobalReviews());
    
    const handleStorage = (key) => {
      if (key === STORAGE_KEYS.GLOBAL_REVIEWS) {
        setReviews(getGlobalReviews());
      }
    };
    
    const unsubscribe = addStorageListener(handleStorage);
    return () => unsubscribe();
  }, []);
  
  const handleSubmit = () => {
    if (!form.bookName || !form.author || !form.review) {
      onToast({ type: 'info', message: 'fill everything in bestie 👀' });
      return;
    }
    
    const review = {
      id: generateId(),
      ...form,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    
    const allReviews = [review, ...getGlobalReviews()];
    setLS(STORAGE_KEYS.GLOBAL_REVIEWS, allReviews);
    setReviews(allReviews);
    setShowForm(false);
    setForm({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
    
    // Update stats
    const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    setLS(STORAGE_KEYS.STATS(user.email), stats);
    
    onToast({ type: 'success', message: 'review dropped bestie 🔥' });
  };
  
  const handleLike = (review) => {
    if (likedReviews.includes(review.id)) return;
    
    const updatedLikes = [...likedReviews, review.id];
    setLikedReviews(updatedLikes);
    setLS(`rcreww_liked_reviews_${user.email}`, updatedLikes);
    
    const allReviews = getGlobalReviews().map(r => 
      r.id === review.id ? { ...r, likes: (r.likes || 0) + 1 } : r
    );
    setLS(STORAGE_KEYS.GLOBAL_REVIEWS, allReviews);
    setReviews(allReviews);
  };
  
  const filtered = reviews.filter(r => 
    (r.bookName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.author || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.userName || '').toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <h2 className="font-black text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-orange-500" /> reviews
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition"
        >
          {showForm ? 'cancel' : '+ write'}
        </button>
      </div>
      
      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            placeholder="search reviews..."
          />
        </div>
        
        {showForm && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-black mb-3">drop your review bestie 📝</h3>
            <div className="space-y-3">
              <input
                value={form.bookName}
                onChange={e => setForm({ ...form, bookName: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300"
                placeholder="book title *"
              />
              <input
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300"
                placeholder="author *"
              />
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">your rating</p>
                <StarRating rating={form.rating} onChange={r => setForm({ ...form, rating: r })} size="md" />
              </div>
              <textarea
                value={form.review}
                onChange={e => setForm({ ...form, review: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 resize-none"
                rows={4}
                placeholder="spill the tea on this book... *"
              />
              <div className="flex gap-2">
                {['positive', 'negative'].map(s => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, sentiment: s })}
                    className={`flex-1 py-2 rounded-xl text-sm font-black transition ${form.sentiment === s ? (s === 'positive' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-600'}`}
                  >
                    {s === 'positive' ? '👍 slay' : '👎 flop'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition"
              >
                drop it 🔥
              </button>
            </div>
          </div>
        )}
        
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-500 font-semibold">no reviews yet bestie</p>
          </div>
        ) : (
          filtered.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <BookCover title={review.bookName} author={review.author} size="sm" />
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 text-sm">{review.bookName}</h3>
                  <p className="text-xs text-gray-500">by {review.author}</p>
                  <StarRating rating={review.rating} size="xs" readonly />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {review.sentiment === 'positive' ? '👍 slay' : '👎 flop'}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.review}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <button onClick={() => onViewUser(review.userEmail, review.userName)} className="flex items-center gap-2 hover:opacity-75">
                  <Avatar initials={review.userName} size="xs" />
                  <span className="text-xs text-gray-600 font-semibold hover:underline">{review.userName}</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(review)}
                    disabled={likedReviews.includes(review.id)}
                    className={`flex items-center gap-1 text-xs font-bold transition ${likedReviews.includes(review.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedReviews.includes(review.id) ? 'fill-red-500' : ''}`} />
                    {review.likes || 0}
                  </button>
                  <span className="text-xs text-gray-400">{formatTimeAgo(review.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ========================================
// SECTION 17: CREWS PAGE (with global sync and chat)
// ========================================

const CrewsPage = memo(({ user, setPage, onToast, onViewUser }) => {
  const [crews, setCrews] = useState([]);
  const [joinedCrewIds, setJoinedCrewIds] = useState(() => getLS(STORAGE_KEYS.JOINED_CREWS(user.email), []));
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', author: '', genre: '' });
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [chatView, setChatView] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const loadCrews = useCallback(() => {
    setCrews(getGlobalCrews());
  }, []);
  
  useEffect(() => {
    initGlobalData();
    loadCrews();
    
    const handleStorage = (key) => {
      if (key === STORAGE_KEYS.GLOBAL_CREWS) {
        loadCrews();
      }
    };
    
    const unsubscribe = addStorageListener(handleStorage);
    return () => unsubscribe();
  }, [loadCrews]);
  
  useEffect(() => {
    if (chatView && selectedCrew) {
      const chatMessages = getLS(STORAGE_KEYS.CHAT_MESSAGES(selectedCrew.id), []);
      setMessages(chatMessages);
    }
  }, [chatView, selectedCrew]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const isJoined = (crewId) => joinedCrewIds.includes(crewId) || joinedCrewIds.includes(String(crewId));
  
  const joinCrew = (crew) => {
    if (isJoined(crew.id)) return;
    
    const updatedJoined = [...joinedCrewIds, crew.id];
    setJoinedCrewIds(updatedJoined);
    setLS(STORAGE_KEYS.JOINED_CREWS(user.email), updatedJoined);
    
    // Update crew member count
    const allCrews = getGlobalCrews().map(c => 
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1, joinedEmails: [...(c.joinedEmails || []), user.email] } : c
    );
    saveGlobalCrews(allCrews);
    setCrews(allCrews);
    
    // Update stats
    const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    setLS(STORAGE_KEYS.STATS(user.email), stats);
    
    onToast({ type: 'success', message: `joined "${crew.name}" bestie 🎉` });
  };
  
  const leaveCrew = (crew) => {
    if (!window.confirm(`leave "${crew.name}" fr?`)) return;
    
    const updatedJoined = joinedCrewIds.filter(id => id !== crew.id && id !== String(crew.id));
    setJoinedCrewIds(updatedJoined);
    setLS(STORAGE_KEYS.JOINED_CREWS(user.email), updatedJoined);
    
    const allCrews = getGlobalCrews().map(c => 
      c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1), joinedEmails: (c.joinedEmails || []).filter(e => e !== user.email) } : c
    );
    saveGlobalCrews(allCrews);
    setCrews(allCrews);
    
    if (selectedCrew?.id === crew.id) {
      setSelectedCrew(null);
      setChatView(false);
    }
    
    onToast({ type: 'info', message: `left "${crew.name}"` });
  };
  
  const createCrew = () => {
    if (!form.name || !form.author) {
      onToast({ type: 'info', message: 'need book name + author bestie' });
      return;
    }
    
    const { crew, created } = getOrCreateCrew(form.name, form.author, form.genre, user.email, user.name);
    setCrews(getGlobalCrews());
    
    if (!created) {
      onToast({ type: 'info', message: `crew already exists! taking you there bestie 📚` });
      if (!isJoined(crew.id)) joinCrew(crew);
      setSelectedCrew(crew);
      setShowForm(false);
      return;
    }
    
    const updatedJoined = [...joinedCrewIds, crew.id];
    setJoinedCrewIds(updatedJoined);
    setLS(STORAGE_KEYS.JOINED_CREWS(user.email), updatedJoined);
    
    const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    setLS(STORAGE_KEYS.STATS(user.email), stats);
    
    setShowForm(false);
    setForm({ name: '', author: '', genre: '' });
    setSelectedCrew(crew);
    onToast({ type: 'success', message: `created "${crew.name}" 🔥` });
  };
  
  const sendChatMessage = () => {
    if (!newMessage.trim() || !selectedCrew) return;
    
    const message = {
      id: generateId(),
      userEmail: user.email,
      userName: user.name,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    
    const existingMessages = getLS(STORAGE_KEYS.CHAT_MESSAGES(selectedCrew.id), []);
    const updatedMessages = [...existingMessages, message];
    setLS(STORAGE_KEYS.CHAT_MESSAGES(selectedCrew.id), updatedMessages);
    setMessages(updatedMessages);
    setNewMessage('');
    
    // Notify other crew members
    const crewMembers = crews.find(c => c.id === selectedCrew.id)?.joinedEmails || [];
    crewMembers.forEach(memberEmail => {
      if (memberEmail !== user.email) {
        pushNotification(memberEmail, {
          type: 'message',
          fromEmail: user.email,
          fromName: user.name,
          message: `${user.name} sent a message in "${selectedCrew.name}"`,
          crewId: selectedCrew.id,
          crewName: selectedCrew.name,
        });
      }
    });
  };
  
  const filtered = crews.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.author || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.genre || '').toLowerCase().includes(search.toLowerCase())
  );
  const myCrews = filtered.filter(c => isJoined(c.id));
  const discoverCrews = filtered.filter(c => !isJoined(c.id));
  
  // Count unread crew messages for badge
  const unreadMessages = getLS(STORAGE_KEYS.NOTIFICATIONS(user.email), [])
    .filter(n => n.type === 'message' && !n.read).length;
  
  // Chat View
  if (chatView && selectedCrew) {
    const isMember = isJoined(selectedCrew.id);
    
    if (!isMember) {
      return (
        <div className="fixed inset-0 flex flex-col z-[60]" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%', background: '#e5ddd5' }}>
          <div className="bg-white border-b px-4 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
            <button onClick={() => { setChatView(false); setSelectedCrew(null); }} className="p-1">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <BookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900 truncate">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">{selectedCrew.members || 1} members</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-4">Join this crew to chat</p>
              <button onClick={() => joinCrew(selectedCrew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-black hover:bg-orange-600 transition">
                Join to Chat
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 flex flex-col z-[60]" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%', background: '#e5ddd5' }}>
        <div className="bg-white border-b px-4 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button onClick={() => { setChatView(false); setSelectedCrew(null); }} className="p-1">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <BookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-gray-900 truncate">{selectedCrew.name}</p>
            <p className="text-xs text-gray-500">{selectedCrew.members || 1} members • global crew</p>
          </div>
          <button onClick={() => setChatView(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-gray-500 font-semibold">no messages yet bestie</p>
              <p className="text-xs text-gray-400 mt-1">be the first to start the convo!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.userEmail === user.email;
              return (
                <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex items-end gap-1.5 max-w-[78%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <button onClick={() => onViewUser(msg.userEmail, msg.userName)} className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                        {(msg.userName || '?').slice(0, 2).toUpperCase()}
                      </button>
                    )}
                    <div className={`rounded-2xl px-3 py-2 shadow-sm ${isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                      {!isOwn && <p className="text-[10px] font-black text-orange-500 mb-0.5">{msg.userName}</p>}
                      <p className="text-sm text-gray-900 leading-relaxed break-words">{msg.content}</p>
                      <p className="text-[9px] text-gray-400 text-right mt-0.5">{formatTimeAgo(msg.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="bg-white border-t px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 py-2.5 border border-gray-100 focus-within:border-orange-300 transition">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } }}
              className="flex-1 text-sm outline-none bg-transparent"
              placeholder="say something bestie..."
            />
          </div>
          <button
            onClick={sendChatMessage}
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
  
  // Crew Detail View
  if (selectedCrew && !chatView) {
    const isMember = isJoined(selectedCrew.id);
    const members = selectedCrew.joinedEmails || [];
    const memberCount = members.length || selectedCrew.members || 1;
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setSelectedCrew(null)} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black flex-1">crew info</span>
        </div>
        
        <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-8 pb-4 flex flex-col items-center text-center">
          <BookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" />
          <h1 className="text-2xl font-black text-gray-900 mt-4">{selectedCrew.name}</h1>
          <p className="text-gray-500">by {selectedCrew.author}</p>
          {selectedCrew.genre && (
            <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-black">{selectedCrew.genre}</span>
          )}
          <div className="mt-4 flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-black">{memberCount}</p>
              <p className="text-xs text-gray-500">members</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5 w-full">
            {!isMember ? (
              <button onClick={() => joinCrew(selectedCrew)} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition">
                join the crew 🔥
              </button>
            ) : (
              <button onClick={() => setChatView(true)} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> open chat
              </button>
            )}
          </div>
          {isMember && (
            <button onClick={() => leaveCrew(selectedCrew)} className="mt-3 text-sm text-red-500 font-semibold hover:underline">
              leave crew
            </button>
          )}
        </div>
        
        <div className="px-4 pb-6">
          <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> members ({memberCount})
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">no members synced yet — join to show up here!</p>
          ) : (
            members.slice(0, 20).map((email, i) => {
              const users = getLS(STORAGE_KEYS.USERS, []);
              const member = users.find(u => u.email === email);
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                  <Avatar initials={member?.name || email} size="sm" />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{member?.name || email.split('@')[0]}</p>
                    {selectedCrew.createdBy === email && <p className="text-xs text-orange-500 font-semibold">👑 creator</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
  
  // List View
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <h2 className="font-black text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" /> reading crews
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition">
          {showForm ? 'cancel' : '+ create'}
        </button>
      </div>
      
      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            placeholder="search crews globally..."
          />
        </div>
        
        {showForm && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-black mb-1">start a new crew 🔥</h3>
            <p className="text-xs text-gray-400 mb-3">one book = one crew globally — we'll connect you if it exists!</p>
            {form.name && (
              <div className="flex justify-center mb-4">
                <BookCover title={form.name} author={form.author} size="md" />
              </div>
            )}
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300"
                placeholder="book title *"
              />
              <input
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300"
                placeholder="author *"
              />
              <input
                value={form.genre}
                onChange={e => setForm({ ...form, genre: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300"
                placeholder="genre (optional)"
              />
              <div className="flex gap-2">
                <button onClick={createCrew} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-black text-sm hover:bg-orange-600 transition">
                  create/join crew 🚀
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                  nah
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* My Crews */}
        <div>
          <h2 className="font-black text-gray-900 text-lg mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" /> my crews ({myCrews.length})
          </h2>
          {myCrews.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-gray-400 text-sm">join a crew below bestie!</p>
            </div>
          ) : (
            myCrews.map(crew => (
              <div key={crew.id} className="bg-white rounded-2xl border border-green-200 shadow-sm mb-3 overflow-hidden">
                <div className="flex items-center px-4 py-3 gap-3 cursor-pointer" onClick={() => setSelectedCrew(crew)}>
                  <BookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 text-sm truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold flex-shrink-0">joined</span>
                    </div>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{crew.members || 1}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2.5 border-t border-gray-50 flex gap-2 justify-end">
                  <button onClick={() => { setSelectedCrew(crew); setChatView(true); }} className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-xl text-xs font-black hover:bg-orange-200 transition flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Discover Crews */}
        <div>
          <h2 className="font-black text-gray-900 text-lg mb-3">discover crews 🔍 <span className="text-sm text-gray-400 font-normal">({discoverCrews.length} global)</span></h2>
          <div className="space-y-3">
            {discoverCrews.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">no crews to discover</p>
              </div>
            ) : (
              discoverCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition" onClick={() => setSelectedCrew(crew)}>
                  <div className="flex items-center px-4 py-3 gap-3">
                    <BookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{crew.members || 1}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-50 flex justify-end">
                    <button onClick={e => { e.stopPropagation(); joinCrew(crew); }} className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black hover:opacity-90 transition">
                      join fr 🔥
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ========================================
// SECTION 18: PROFILE PAGE
// ========================================

const ProfilePage = memo(({ user, onLogout, onUpdateUser, profileSrc, setProfileSrc, following, followers, onToast, setPage }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [books, setBooks] = useState(() => getLS(STORAGE_KEYS.READING_LIST(user.email), []));
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5, notes: '' });
  const fileInputRef = useRef(null);
  
  const myPosts = getGlobalPosts().filter(p => p.userEmail === user.email);
  const myReviews = getGlobalReviews().filter(r => r.userEmail === user.email);
  const savedPostsIds = getLS(STORAGE_KEYS.SAVED_POSTS(user.email), []);
  const savedPosts = getGlobalPosts().filter(p => savedPostsIds.includes(p.id));
  const stats = getLS(STORAGE_KEYS.STATS(user.email), {
    booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0
  });
  const joinedCrewIds = getLS(STORAGE_KEYS.JOINED_CREWS(user.email), []);
  const myCrews = getGlobalCrews().filter(c => joinedCrewIds.includes(c.id) || joinedCrewIds.includes(String(c.id)));
  
  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, bio: editBio, location: editLocation, website: editWebsite };
    const users = getLS(STORAGE_KEYS.USERS, []).map(u => u.email === user.email ? updatedUser : u);
    setLS(STORAGE_KEYS.USERS, users);
    setLS(STORAGE_KEYS.CURRENT_USER, updatedUser);
    onUpdateUser(updatedUser);
    setEditing(false);
    onToast({ type: 'success', message: 'profile updated bestie ✨' });
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onToast({ type: 'warning', message: 'max 5MB bestie' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      setProfileSrc(imageData);
      setLS(STORAGE_KEYS.PROFILE_IMAGE(user.email), imageData);
      const updatedUser = { ...user, profileImage: imageData };
      const users = getLS(STORAGE_KEYS.USERS, []).map(u => u.email === user.email ? updatedUser : u);
      setLS(STORAGE_KEYS.USERS, users);
      setLS(STORAGE_KEYS.CURRENT_USER, updatedUser);
      onUpdateUser(updatedUser);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAddBook = () => {
    if (!newBook.title) return;
    const book = { id: generateId(), ...newBook, addedAt: new Date().toISOString() };
    const updatedBooks = [book, ...books];
    setBooks(updatedBooks);
    setLS(STORAGE_KEYS.READING_LIST(user.email), updatedBooks);
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setLS(STORAGE_KEYS.STATS(user.email), updatedStats);
    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
    onToast({ type: 'success', message: 'book added to your shelf 📚' });
  };
  
  const handleDeleteBook = (bookId) => {
    const updatedBooks = books.filter(b => b.id !== bookId);
    setBooks(updatedBooks);
    setLS(STORAGE_KEYS.READING_LIST(user.email), updatedBooks);
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setLS(STORAGE_KEYS.STATS(user.email), updatedStats);
    onToast({ type: 'info', message: 'book removed from shelf' });
  };
  
  const tabs = ['posts', 'reviews', 'books', 'crews', 'saved'];
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black" style={{ fontFamily: 'Georgia, serif' }}>my profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <div className="px-4 py-5">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? (
              <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <Avatar initials={user?.name} size="xl" />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600 transition"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="name"
                />
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none"
                  rows={2}
                  placeholder="bio"
                />
                <input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="location"
                />
                <input
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="website"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-black">
                    save ✅
                  </button>
                  <button onClick={() => setEditing(false)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    nah
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-400">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                {user?.location && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {user.location}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1 italic">"{user?.bio || 'living my best bookish era 📚'}"</p>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="font-black text-gray-900">{followers?.length || 0}</p>
                    <p className="text-xs text-gray-500">followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-900">{following?.length || 0}</p>
                    <p className="text-xs text-gray-500">following</p>
                  </div>
                </div>
                <button onClick={() => setEditing(true)} className="mt-2 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-xl text-sm font-black hover:bg-orange-50 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> edit profile
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 bg-white rounded-2xl p-3 border border-gray-100 mb-5">
          {[
            ['📚', stats.booksRead, 'books'],
            ['⭐', stats.reviewsGiven, 'reviews'],
            ['✍️', stats.postsCreated, 'posts'],
            ['👥', stats.crewsJoined, 'crews'],
          ].map(([emoji, value, label]) => (
            <div key={label} className="text-center">
              <p className="text-lg">{emoji}</p>
              <p className="text-lg font-black text-gray-900">{value || 0}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-black border-b-2 transition ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">✍️</p>
                <p className="text-gray-500">no posts yet bestie</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-black">
                  drop a post
                </button>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-700">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500 mt-1">📖 {post.bookName}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{getPostLikes(post.id)}</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">⭐</p>
                <p className="text-gray-500">no reviews yet bestie</p>
                <button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-black">
                  write a review
                </button>
              </div>
            ) : (
              myReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex gap-3 mb-2">
                    <BookCover title={review.bookName} author={review.author} size="sm" />
                    <div>
                      <h3 className="font-black text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" readonly />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-700">{books.length} books on your shelf</p>
              <button onClick={() => setShowAddBook(!showAddBook)} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 transition flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> {showAddBook ? 'cancel' : 'add book'}
              </button>
            </div>
            
            {showAddBook && (
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
                <input
                  value={newBook.title}
                  onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                  placeholder="book title *"
                />
                <input
                  value={newBook.author}
                  onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                  placeholder="author"
                />
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">rating</p>
                  <StarRating rating={newBook.rating} onChange={r => setNewBook({ ...newBook, rating: r })} size="sm" />
                </div>
                <textarea
                  value={newBook.notes}
                  onChange={e => setNewBook({ ...newBook, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none resize-none"
                  rows={2}
                  placeholder="your thoughts..."
                />
                <button onClick={handleAddBook} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition">
                  add to shelf 📚
                </button>
              </div>
            )}
            
            {books.length === 0 && !showAddBook ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📚</p>
                <p className="text-gray-500 text-sm">no books tracked yet bestie</p>
              </div>
            ) : (
              books.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex gap-3">
                  <BookCover title={book.title} author={book.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <StarRating rating={book.rating} size="xs" readonly />
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                  </div>
                  <button onClick={() => handleDeleteBook(book.id)} className="p-1 text-gray-200 hover:text-red-400 transition flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Crews Tab */}
        {activeTab === 'crews' && (
          <div className="space-y-3">
            {myCrews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-gray-500">no crews joined yet</p>
                <button onClick={() => setPage('crews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-black">
                  browse crews
                </button>
              </div>
            ) : (
              myCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex gap-3">
                  <BookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{crew.name}</p>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-3">
            {savedPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🔖</p>
                <p className="text-gray-500 text-sm">no saved posts yet bestie</p>
              </div>
            ) : (
              savedPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-700">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500 mt-1">📖 {post.bookName}</p>}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>by {post.userName}</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ========================================
// SECTION 19: NOTIFICATIONS PAGE
// ========================================

const NotificationsPage = memo(({ user, onClose, onRefreshCount }) => {
  const key = STORAGE_KEYS.NOTIFICATIONS(user.email);
  const [notifications, setNotifications] = useState(() => {
    const all = getLS(key, []);
    return all.filter(n => n.type !== 'message').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });
  
  const markAllAsRead = () => {
    const all = getLS(key, []).map(n => ({ ...n, read: true }));
    setLS(key, all);
    setNotifications(all.filter(n => n.type !== 'message'));
    onRefreshCount?.();
  };
  
  const deleteNotification = (id) => {
    const all = getLS(key, []).filter(n => n.id !== id);
    setLS(key, all);
    setNotifications(all.filter(n => n.type !== 'message'));
    onRefreshCount?.();
  };
  
  const markAsRead = (id) => {
    const all = getLS(key, []).map(n => n.id === id ? { ...n, read: true } : n);
    setLS(key, all);
    setNotifications(all.filter(n => n.type !== 'message'));
    onRefreshCount?.();
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    follow: <UserCheck className="w-4 h-4 text-green-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    info: <Info className="w-4 h-4 text-orange-500" />,
  };
  
  const backgrounds = {
    like: 'bg-red-100',
    comment: 'bg-blue-100',
    follow: 'bg-green-100',
    reshare: 'bg-indigo-100',
    success: 'bg-green-100',
    info: 'bg-orange-100',
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="font-black">notifs</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-black">{unreadCount}</span>
          )}
        </div>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className={`text-sm font-black transition ${unreadCount > 0 ? 'text-orange-500' : 'text-gray-300 cursor-not-allowed'}`}
        >
          mark all read
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-500 font-semibold">no notifs yet bestie</p>
            <p className="text-gray-400 text-sm mt-1">activity will show up here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`px-4 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition ${notif.read ? '' : 'bg-orange-50'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${backgrounds[notif.type] || 'bg-gray-100'}`}>
                  {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-snug">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(notif.timestamp)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.read && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="p-1 text-gray-200 hover:text-red-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ========================================
// SECTION 20: USER PROFILE MODAL
// ========================================

const UserProfileModal = memo(({ email, name, currentUser, onClose, onFollow, isFollowing, onBlock, isBlocked }) => {
  const users = getLS(STORAGE_KEYS.USERS, []);
  const userData = users.find(u => u.email === email);
  const posts = getGlobalPosts().filter(p => p.userEmail === email);
  const followers = getLS(STORAGE_KEYS.FOLLOWERS(email), []);
  const following = getLS(STORAGE_KEYS.FOLLOWING(email), []);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-3xl">
          <h3 className="font-black">profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar initials={name} size="lg" src={userData?.profileImage || getLS(STORAGE_KEYS.PROFILE_IMAGE(email), null)} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black">{name}</h2>
              <p className="text-sm text-gray-400">@{name?.toLowerCase().replace(/\s/g, '')}</p>
              {userData?.bio && <p className="text-sm text-gray-600 mt-1 italic">"{userData.bio}"</p>}
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <p className="font-black">{followers.length}</p>
                  <p className="text-xs text-gray-500">followers</p>
                </div>
                <div className="text-center">
                  <p className="font-black">{following.length}</p>
                  <p className="text-xs text-gray-500">following</p>
                </div>
                <div className="text-center">
                  <p className="font-black">{posts.length}</p>
                  <p className="text-xs text-gray-500">posts</p>
                </div>
              </div>
            </div>
          </div>
          
          {email !== currentUser.email && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => onFollow(email, name)}
                className={`flex-1 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition ${isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'}`}
              >
                {isFollowing ? <><UserMinus className="w-4 h-4" /> unfollow</> : <><UserPlus className="w-4 h-4" /> follow</>}
              </button>
              <button
                onClick={() => onBlock(email)}
                className={`flex-1 py-2.5 rounded-2xl font-black text-sm transition ${isBlocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {isBlocked ? 'unblock 👍' : 'block 🚫'}
              </button>
            </div>
          )}
          
          <h3 className="font-black text-sm text-gray-900 mb-3">recent posts</h3>
          {posts.slice(0, 3).map(post => (
            <div key={post.id} className="bg-gray-50 rounded-xl p-3 mb-2">
              <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(post.createdAt)}</p>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">no posts yet bestie</p>
          )}
        </div>
      </div>
    </div>
  );
});

// ========================================
// SECTION 21: MAIN APP COMPONENT
// ========================================

export default function App() {
  const [user, setUser] = useState(null);
  const [profileSrc, setProfileSrc] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [toast, setToast] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationCount, setNotificationCount] = useState(0);
  const toastTimeoutRef = useRef(null);
  
  const showToast = useCallback((toastData) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(toastData);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);
  
  const refreshNotificationCount = useCallback(() => {
    if (!user) return;
    const notifs = getLS(STORAGE_KEYS.NOTIFICATIONS(user.email), []);
    const unreadSocial = notifs.filter(n => !n.read && n.type !== 'message').length;
    setNotificationCount(unreadSocial);
  }, [user]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    initGlobalData();
    const storedUser = getLS(STORAGE_KEYS.CURRENT_USER, null);
    if (storedUser) {
      setUser(storedUser);
      setSavedPosts(getLS(STORAGE_KEYS.SAVED_POSTS(storedUser.email), []));
      setFollowing(getLS(STORAGE_KEYS.FOLLOWING(storedUser.email), []));
      setFollowers(getLS(STORAGE_KEYS.FOLLOWERS(storedUser.email), []));
      setBlockedUsers(getLS(STORAGE_KEYS.BLOCKED(storedUser.email), []));
      const profileImg = getLS(STORAGE_KEYS.PROFILE_IMAGE(storedUser.email), null);
      if (profileImg) setProfileSrc(profileImg);
    }
    setLoading(false);
    
    // Listen for cross-tab updates
    const handleStorage = (key, value) => {
      if (key === STORAGE_KEYS.GLOBAL_POSTS || key === STORAGE_KEYS.GLOBAL_REVIEWS) {
        // Force re-render of relevant components
        setUser(prev => prev ? { ...prev } : null);
      }
      if (user && key === STORAGE_KEYS.NOTIFICATIONS(user.email)) {
        refreshNotificationCount();
      }
    };
    
    const unsubscribe = addStorageListener(handleStorage);
    return () => unsubscribe();
  }, [refreshNotificationCount]);
  
  useEffect(() => {
    if (user) {
      refreshNotificationCount();
      const interval = setInterval(refreshNotificationCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotificationCount]);
  
  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setSavedPosts(getLS(STORAGE_KEYS.SAVED_POSTS(userData.email), []));
    setFollowing(getLS(STORAGE_KEYS.FOLLOWING(userData.email), []));
    setFollowers(getLS(STORAGE_KEYS.FOLLOWERS(userData.email), []));
    setBlockedUsers(getLS(STORAGE_KEYS.BLOCKED(userData.email), []));
    const profileImg = getLS(STORAGE_KEYS.PROFILE_IMAGE(userData.email), null);
    if (profileImg) setProfileSrc(profileImg);
    setCurrentPage('home');
  }, []);
  
  const handleLogout = useCallback(() => {
    setUser(null);
    setProfileSrc(null);
    setCurrentPage('home');
    removeLS(STORAGE_KEYS.CURRENT_USER);
  }, []);
  
  const handleUpdateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    setLS(STORAGE_KEYS.CURRENT_USER, updatedUser);
  }, []);
  
  const handlePost = useCallback((postData) => {
    const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    setLS(STORAGE_KEYS.STATS(user.email), stats);
    showToast({ type: 'success', message: 'posted bestie, you ate 🔥' });
  }, [user, showToast]);
  
  const handleSavePost = useCallback((post) => {
    const current = getLS(STORAGE_KEYS.SAVED_POSTS(user.email), []);
    const updated = current.includes(post.id) 
      ? current.filter(id => id !== post.id) 
      : [...current, post.id];
    setLS(STORAGE_KEYS.SAVED_POSTS(user.email), updated);
    setSavedPosts(updated);
    showToast({ type: 'success', message: updated.includes(post.id) ? 'saved for later 🔖' : 'unsaved' });
  }, [user, showToast]);
  
  const handleDeletePost = useCallback((post) => {
    const allPosts = getGlobalPosts().filter(p => p.id !== post.id);
    setLS(STORAGE_KEYS.GLOBAL_POSTS, allPosts);
    showToast({ type: 'info', message: 'post deleted bestie 🗑️' });
  }, [showToast]);
  
  const handleFollow = useCallback((targetEmail, targetName) => {
    const currentFollowing = getLS(STORAGE_KEYS.FOLLOWING(user.email), []);
    
    if (currentFollowing.includes(targetEmail)) {
      // Unfollow
      const updated = currentFollowing.filter(e => e !== targetEmail);
      setLS(STORAGE_KEYS.FOLLOWING(user.email), updated);
      setFollowing(updated);
      const targetFollowers = getLS(STORAGE_KEYS.FOLLOWERS(targetEmail), []);
      setLS(STORAGE_KEYS.FOLLOWERS(targetEmail), targetFollowers.filter(e => e !== user.email));
    } else {
      // Follow
      const updated = [...currentFollowing, targetEmail];
      setLS(STORAGE_KEYS.FOLLOWING(user.email), updated);
      setFollowing(updated);
      const targetFollowers = getLS(STORAGE_KEYS.FOLLOWERS(targetEmail), []);
      if (!targetFollowers.includes(user.email)) {
        setLS(STORAGE_KEYS.FOLLOWERS(targetEmail), [...targetFollowers, user.email]);
        pushNotification(targetEmail, {
          type: 'follow',
          fromEmail: user.email,
          fromName: user.name,
          message: `${user.name} started following you 🔥`,
        });
        refreshNotificationCount();
      }
      showToast({ type: 'success', message: `following ${targetName} bestie 👋` });
    }
  }, [user, showToast, refreshNotificationCount]);
  
  const handleBlockUser = useCallback((targetEmail) => {
    const current = getLS(STORAGE_KEYS.BLOCKED(user.email), []);
    const updated = current.includes(targetEmail) 
      ? current.filter(e => e !== targetEmail) 
      : [...current, targetEmail];
    setLS(STORAGE_KEYS.BLOCKED(user.email), updated);
    setBlockedUsers(updated);
    
    // Also unfollow if following
    if (!current.includes(targetEmail)) {
      const followingList = getLS(STORAGE_KEYS.FOLLOWING(user.email), []);
      const newFollowing = followingList.filter(e => e !== targetEmail);
      setLS(STORAGE_KEYS.FOLLOWING(user.email), newFollowing);
      setFollowing(newFollowing);
    }
  }, [user]);
  
  const handleCreateCrew = useCallback((book) => {
    if (!user) return;
    const { crew, created } = getOrCreateCrew(book.title, book.author, book.genre, user.email, user.name);
    const joined = getLS(STORAGE_KEYS.JOINED_CREWS(user.email), []);
    if (!joined.includes(crew.id)) {
      const updated = [...joined, crew.id];
      setLS(STORAGE_KEYS.JOINED_CREWS(user.email), updated);
      const stats = getLS(STORAGE_KEYS.STATS(user.email), {});
      stats.crewsJoined = (stats.crewsJoined || 0) + 1;
      setLS(STORAGE_KEYS.STATS(user.email), stats);
    }
    showToast({ type: 'success', message: created ? `crew "${crew.name}" created + joined 🎉` : `joined existing crew "${crew.name}" 📚` });
    setCurrentPage('crews');
  }, [user, showToast]);
  
  const handleViewUser = useCallback((email, name) => {
    setViewingUser({ email, name });
  }, []);
  
  const handleCloseUserModal = useCallback(() => {
    setViewingUser(null);
  }, []);
  
  const handleUpdateProfileSrc = useCallback((src) => {
    setProfileSrc(src);
  }, []);
  
  const unreadMessages = user ? getLS(STORAGE_KEYS.NOTIFICATIONS(user.email), []).filter(n => n.type === 'message' && !n.read).length : 0;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }
  
  return (
    <div className="flex justify-center min-h-screen bg-gray-300">
      {toast && <Toast notification={toast} onClose={() => setToast(null)} />}
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-amber-500 text-white text-center py-1.5 text-xs z-[300] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" /> you're offline bestie — some things may not work
        </div>
      )}
      
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden">
        {/* User Profile Modal */}
        {viewingUser && (
          <UserProfileModal
            email={viewingUser.email}
            name={viewingUser.name}
            currentUser={user}
            onClose={handleCloseUserModal}
            onFollow={handleFollow}
            isFollowing={following.includes(viewingUser.email)}
            onBlock={handleBlockUser}
            isBlocked={blockedUsers.includes(viewingUser.email)}
          />
        )}
        
        {/* Pages */}
        {currentPage === 'home' && (
          <HomePage
            user={user}
            profileSrc={profileSrc}
            savedPosts={savedPosts}
            onSave={handleSavePost}
            onDelete={handleDeletePost}
            onFollow={handleFollow}
            following={following}
            onBlock={handleBlockUser}
            blockedUsers={blockedUsers}
            onViewUser={handleViewUser}
            onViewBookDetails={handleCreateCrew}
            onToast={showToast}
            setPage={setCurrentPage}
          />
        )}
        
        {currentPage === 'explore' && (
          <ExplorePage
            user={user}
            setPage={setCurrentPage}
            onCreateCrew={handleCreateCrew}
          />
        )}
        
        {currentPage === 'post' && (
          <PostPage
            user={user}
            onPost={handlePost}
            setPage={setCurrentPage}
          />
        )}
        
        {currentPage === 'reviews' && (
          <ReviewsPage
            user={user}
            setPage={setCurrentPage}
            onToast={showToast}
            onViewUser={handleViewUser}
          />
        )}
        
        {currentPage === 'crews' && (
          <CrewsPage
            user={user}
            setPage={setCurrentPage}
            onToast={showToast}
            onViewUser={handleViewUser}
          />
        )}
        
        {currentPage === 'profile' && (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            profileSrc={profileSrc}
            setProfileSrc={handleUpdateProfileSrc}
            following={following}
            followers={followers}
            onToast={showToast}
            setPage={setCurrentPage}
          />
        )}
        
        {currentPage === 'notifications' && (
          <NotificationsPage
            user={user}
            onClose={() => { setCurrentPage('home'); refreshNotificationCount(); }}
            onRefreshCount={refreshNotificationCount}
          />
        )}
        
        {currentPage !== 'post' && (
          <BottomNav
            active={currentPage}
            setPage={setCurrentPage}
            unreadMessages={unreadMessages}
          />
        )}
      </div>
      
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -110%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce { animation: bounce 1s infinite; }
        
        .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
        .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
        
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}