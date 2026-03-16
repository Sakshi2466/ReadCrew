// routes/socialRoutes.js
// ─── COMPLETE SOCIAL ROUTES WITH GLOBAL SHARING AND PRIVACY ───────────────────
// 
// FEATURES:
// 1. Posts, likes, comments - GLOBALLY VISIBLE to all users (server memory)
// 2. Profile photos - one upload, visible to everyone
// 3. User profiles - public info visible, private data protected
// 4. Real-time notifications
// 5. Crew chat with socket.io support
// 6. Follow/unfollow system
//
// PRIVACY RULES:
// - Posts, reviews, crews: PUBLIC (visible to all users)
// - Saved posts: PRIVATE (only visible to the user who saved them)
// - Reading lists: PRIVATE (only visible to the user)
// - Profile photos: PUBLIC (visible to all)
// - User bios/names: PUBLIC (visible to all)

'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_POSTS = 500;
const MAX_COMMENTS_PER_POST = 500;
const MAX_REVIEWS = 200;
const MAX_NOTIFICATIONS_PER_USER = 150;
const PRESENCE_TTL = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 15000; // 15 seconds

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

const nowISO = () => new Date().toISOString();
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/** Toggle a value inside an array (like a Set). Returns a new array. */
const toggleInArray = (arr = [], val) => {
  const s = new Set(arr);
  s.has(val) ? s.delete(val) : s.add(val);
  return [...s];
};

/** Validate email format */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/** Sanitize text to prevent XSS */
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/** Extract mentions from text (@username) */
const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

// ─── IN-MEMORY DATA STORES ────────────────────────────────────────────────────
// All data stored in server memory = globally visible to all users

// ── POSTS ────────────────────────────────────────────────────────────────────
let posts = [
  {
    id: 'post_demo1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@readcrew.app',
    userPhoto: null,
    userInitials: 'SJ',
    content: "Just finished 'Atomic Habits' and my mind is blown 🤯 The 1% improvement concept is life-changing. If you haven't read it yet, what are you waiting for?",
    bookName: 'Atomic Habits',
    author: 'James Clear',
    image: null,
    likes: 24,
    likedBy: ['demo_user2@readcrew.app', 'demo_user3@readcrew.app'],
    comments: 5,
    shares: 3,
    reshareCount: 2,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    isPublic: true,
    isReshare: false,
    tags: ['selfhelp', 'habits']
  },
  {
    id: 'post_demo2',
    userName: 'Mike Chen',
    userEmail: 'mike@readcrew.app',
    userPhoto: null,
    userInitials: 'MC',
    content: "The ending of 'Project Hail Mary' had me in tears. Andy Weir is a genius. Rocky is the best fictional character ever created 🛸",
    bookName: 'Project Hail Mary',
    author: 'Andy Weir',
    image: null,
    likes: 41,
    likedBy: ['demo_user1@readcrew.app', 'demo_user3@readcrew.app'],
    comments: 12,
    shares: 7,
    reshareCount: 3,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    isPublic: true,
    isReshare: false,
    tags: ['scifi', 'andyweir']
  },
  {
    id: 'post_demo3',
    userName: 'Priya Sharma',
    userEmail: 'priya@readcrew.app',
    userPhoto: null,
    userInitials: 'PS',
    content: "3 AM and I can't stop reading 'The Silent Patient'. The twist… I did NOT see that coming 😱",
    bookName: 'The Silent Patient',
    author: 'Alex Michaelides',
    image: null,
    likes: 67,
    likedBy: ['demo_user1@readcrew.app', 'demo_user2@readcrew.app'],
    comments: 23,
    shares: 11,
    reshareCount: 5,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    isPublic: true,
    isReshare: false,
    tags: ['thriller', 'mystery']
  }
];

// ── COMMENTS: Map<postId, Comment[]> ─────────────────────────────────────────
const commentsByPost = new Map();

// Seed comments
(function seedComments() {
  const seed = [
    { 
      id: 'cmt_demo1', 
      postId: 'post_demo1', 
      userName: 'Alex Rivera', 
      userEmail: 'alex@readcrew.app', 
      userInitials: 'AR', 
      content: "Completely agree! The 1% rule changed my reading habit too.", 
      parentId: null, 
      likes: 5, 
      likedBy: [], 
      mentions: [],
      timestamp: new Date(Date.now() - 3600000).toISOString() 
    },
    { 
      id: 'cmt_demo2', 
      postId: 'post_demo1', 
      userName: 'Emma Watson', 
      userEmail: 'emma@readcrew.app', 
      userInitials: 'EW', 
      content: "Which chapter hit you hardest? I loved the Habit Stacking part! @sarah", 
      parentId: null, 
      likes: 3, 
      likedBy: [], 
      mentions: ['sarah'],
      timestamp: new Date(Date.now() - 1800000).toISOString() 
    },
    { 
      id: 'cmt_demo3', 
      postId: 'post_demo2', 
      userName: 'Tom Hardy', 
      userEmail: 'tom@readcrew.app', 
      userInitials: 'TH', 
      content: "Rocky is the best! The first communication scene made me cry 😭", 
      parentId: null, 
      likes: 8, 
      likedBy: [], 
      mentions: [],
      timestamp: new Date(Date.now() - 7200000).toISOString() 
    },
    { 
      id: 'cmt_demo4', 
      postId: 'post_demo3', 
      userName: 'Lisa Wong', 
      userEmail: 'lisa@readcrew.app', 
      userInitials: 'LW', 
      content: "That twist ruined my sleep for a week! Still not over it 🔥", 
      parentId: null, 
      likes: 12, 
      likedBy: [], 
      mentions: [],
      timestamp: new Date(Date.now() - 21600000).toISOString() 
    }
  ];
  
  seed.forEach(c => {
    const arr = commentsByPost.get(c.postId) || [];
    arr.push({ ...c, userPhoto: null });
    commentsByPost.set(c.postId, arr);
  });
})();

// ── REVIEWS ────────────────────────────────────────────────────────────────────
let reviews = [
  { 
    id: 'rev1', 
    bookName: 'Atomic Habits', 
    author: 'James Clear', 
    rating: 5, 
    review: "This book permanently changed how I think about self-improvement.", 
    sentiment: 'positive', 
    userName: 'Sarah Johnson', 
    userEmail: 'sarah@readcrew.app', 
    userPhoto: null, 
    userInitials: 'SJ', 
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), 
    likes: 28, 
    likedBy: [] 
  },
  { 
    id: 'rev2', 
    bookName: 'The Silent Patient', 
    author: 'Alex Michaelides', 
    rating: 5, 
    review: "The psychological thriller genre has a new king.", 
    sentiment: 'positive', 
    userName: 'Mike Chen', 
    userEmail: 'mike@readcrew.app', 
    userPhoto: null, 
    userInitials: 'MC', 
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), 
    likes: 45, 
    likedBy: [] 
  },
  { 
    id: 'rev3', 
    bookName: 'Project Hail Mary', 
    author: 'Andy Weir', 
    rating: 5, 
    review: "The friendship at the heart of the book made me cry.", 
    sentiment: 'positive', 
    userName: 'Priya Sharma', 
    userEmail: 'priya@readcrew.app', 
    userPhoto: null, 
    userInitials: 'PS', 
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), 
    likes: 61, 
    likedBy: [] 
  }
];

// ── CREWS ──────────────────────────────────────────────────────────────────────
let crews = [
  { 
    id: 'crew1', 
    name: 'Atomic Habits', 
    author: 'James Clear', 
    genre: 'Self-Help', 
    members: 47, 
    memberEmails: ['sarah@readcrew.app', 'mike@readcrew.app'], 
    chats: 283, 
    createdBy: 'system', 
    createdByName: 'ReadCrew', 
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), 
    description: 'Building better habits together, one tiny change at a time!',
    isPrivate: false,
    coverImage: null
  },
  { 
    id: 'crew2', 
    name: 'Project Hail Mary', 
    author: 'Andy Weir', 
    genre: 'Sci-Fi', 
    members: 38, 
    memberEmails: ['priya@readcrew.app', 'tom@readcrew.app'], 
    chats: 195, 
    createdBy: 'system', 
    createdByName: 'ReadCrew', 
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), 
    description: 'Rocky fan club & science nerd discussion group 🛸',
    isPrivate: false,
    coverImage: null
  },
  { 
    id: 'crew3', 
    name: 'Fourth Wing', 
    author: 'Rebecca Yarros', 
    genre: 'Fantasy', 
    members: 91, 
    memberEmails: ['emma@readcrew.app', 'lisa@readcrew.app'], 
    chats: 512, 
    createdBy: 'system', 
    createdByName: 'ReadCrew', 
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), 
    description: 'Dragon riders unite! Discussing all things Basgiath War College 🐉',
    isPrivate: false,
    coverImage: null
  }
];

// ── CREW MESSAGES: Map<crewId, Message[]> ────────────────────────────────────
const crewMessages = new Map();

// ── USER PROFILES: Map<email, Profile> ───────────────────────────────────────
// Stores public profile information (visible to all users)
// Private data (saved posts, reading lists) stored separately per user
const userProfiles = new Map([
  ['sarah@readcrew.app', { 
    name: 'Sarah Johnson', 
    initials: 'SJ', 
    photo: null, 
    bio: 'Bookworm & coffee addict ☕', 
    followers: ['mike@readcrew.app'], 
    following: ['priya@readcrew.app'],
    location: 'New York',
    website: 'https://sarahreads.com',
    joinedAt: new Date(Date.now() - 180 * 86400000).toISOString()
  }],
  ['mike@readcrew.app', { 
    name: 'Mike Chen', 
    initials: 'MC', 
    photo: null, 
    bio: 'Sci-fi & history lover 🚀', 
    followers: ['priya@readcrew.app'], 
    following: ['sarah@readcrew.app'],
    location: 'San Francisco',
    website: null,
    joinedAt: new Date(Date.now() - 150 * 86400000).toISOString()
  }],
  ['priya@readcrew.app', { 
    name: 'Priya Sharma', 
    initials: 'PS', 
    photo: null, 
    bio: 'Thriller addict 🔪', 
    followers: ['sarah@readcrew.app', 'mike@readcrew.app'], 
    following: ['emma@readcrew.app'],
    location: 'London',
    website: 'https://priyareads.com',
    joinedAt: new Date(Date.now() - 120 * 86400000).toISOString()
  }],
  ['emma@readcrew.app', { 
    name: 'Emma Watson', 
    initials: 'EW', 
    photo: null, 
    bio: 'Fantasy & adventure lover ✨', 
    followers: ['priya@readcrew.app'], 
    following: ['lisa@readcrew.app'],
    location: 'Los Angeles',
    website: null,
    joinedAt: new Date(Date.now() - 90 * 86400000).toISOString()
  }],
  ['tom@readcrew.app', { 
    name: 'Tom Hardy', 
    initials: 'TH', 
    photo: null, 
    bio: 'Reading is my escape 📚', 
    followers: [], 
    following: ['mike@readcrew.app'],
    location: 'Chicago',
    website: null,
    joinedAt: new Date(Date.now() - 60 * 86400000).toISOString()
  }],
  ['lisa@readcrew.app', { 
    name: 'Lisa Wong', 
    initials: 'LW', 
    photo: null, 
    bio: 'Book club organizer 📖', 
    followers: ['emma@readcrew.app'], 
    following: ['sarah@readcrew.app'],
    location: 'Seattle',
    website: 'https://lisabooks.com',
    joinedAt: new Date(Date.now() - 30 * 86400000).toISOString()
  }]
]);

// ─── PRIVATE USER DATA (NOT SHARED GLOBALLY) ─────────────────────────────────
// These are stored separately and only accessible by the owning user

// Saved posts (private)
const userSavedPosts = new Map(); // Map<email, Set<postId>>

// Reading lists / books read (private)
const userReadingLists = new Map(); // Map<email, Book[]>

// User notifications (private)
const userNotifications = new Map(); // Map<email, Notification[]>

// Blocked users (private)
const userBlockedList = new Map(); // Map<email, Set<email>>

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────

/** Get public profile, returning a safe default if not found */
const getProfile = (email) => {
  if (!email) return { name: 'Anonymous', initials: 'AN', photo: null, bio: '', followers: [], following: [] };
  return userProfiles.get(email) || { 
    name: email.split('@')[0], 
    initials: email.slice(0, 2).toUpperCase(), 
    photo: null, 
    bio: '', 
    followers: [], 
    following: [],
    location: null,
    website: null,
    joinedAt: nowISO()
  };
};

/** Ensure a profile exists, creating one if needed */
const ensureProfile = (email, name) => {
  if (!email) return getProfile(null);
  if (!userProfiles.has(email)) {
    userProfiles.set(email, {
      name: name || email,
      initials: (name || email).slice(0, 2).toUpperCase(),
      photo: null,
      bio: '',
      followers: [],
      following: [],
      location: null,
      website: null,
      joinedAt: nowISO()
    });
  }
  return userProfiles.get(email);
};

/**
 * Attach public profile photo & initials to any object with userEmail
 * This ensures profile photos update globally across all content
 */
const withPublicProfile = (obj) => {
  if (!obj || !obj.userEmail) return obj;
  const profile = getProfile(obj.userEmail);
  return { 
    ...obj, 
    userPhoto: profile.photo, 
    userInitials: profile.initials || obj.userInitials 
  };
};

/** Propagate profile updates to all user content */
const propagateProfileUpdate = (email) => {
  const profile = getProfile(email);
  
  // Update posts
  posts.forEach(post => {
    if (post.userEmail === email) {
      post.userPhoto = profile.photo;
      post.userInitials = profile.initials;
    }
  });
  
  // Update comments
  for (const comments of commentsByPost.values()) {
    comments.forEach(comment => {
      if (comment.userEmail === email) {
        comment.userPhoto = profile.photo;
        comment.userInitials = profile.initials;
      }
    });
  }
  
  // Update reviews
  reviews.forEach(review => {
    if (review.userEmail === email) {
      review.userPhoto = profile.photo;
      review.userInitials = profile.initials;
    }
  });
  
  // Update crew messages
  for (const messages of crewMessages.values()) {
    messages.forEach(msg => {
      if (msg.userEmail === email) {
        msg.userPhoto = profile.photo;
        msg.userInitials = profile.initials;
      }
    });
  }
};

// ─── PRIVATE DATA HELPERS ───────────────────────────────────────────────────

/** Get user's saved posts (private) */
const getSavedPosts = (email) => {
  if (!email) return [];
  const saved = userSavedPosts.get(email);
  return saved ? Array.from(saved) : [];
};

/** Toggle saved post (private) */
const toggleSavedPost = (email, postId) => {
  if (!email) return [];
  
  if (!userSavedPosts.has(email)) {
    userSavedPosts.set(email, new Set());
  }
  
  const saved = userSavedPosts.get(email);
  if (saved.has(postId)) {
    saved.delete(postId);
  } else {
    saved.add(postId);
  }
  
  return Array.from(saved);
};

/** Get user's reading list (private) */
const getReadingList = (email) => {
  if (!email) return [];
  return userReadingLists.get(email) || [];
};

/** Add to reading list (private) */
const addToReadingList = (email, book) => {
  if (!email) return [];
  
  const list = userReadingLists.get(email) || [];
  const newBook = { ...book, id: uid(), addedAt: nowISO() };
  list.unshift(newBook);
  
  if (list.length > 200) list.length = 200;
  userReadingLists.set(email, list);
  
  return list;
};

/** Remove from reading list (private) */
const removeFromReadingList = (email, bookId) => {
  if (!email) return [];
  
  const list = userReadingLists.get(email) || [];
  const filtered = list.filter(book => book.id !== bookId);
  userReadingLists.set(email, filtered);
  
  return filtered;
};

/** Get user's blocked list (private) */
const getBlockedUsers = (email) => {
  if (!email) return [];
  const blocked = userBlockedList.get(email);
  return blocked ? Array.from(blocked) : [];
};

/** Toggle blocked user (private) */
const toggleBlockedUser = (email, targetEmail) => {
  if (!email || !targetEmail) return [];
  
  if (!userBlockedList.has(email)) {
    userBlockedList.set(email, new Set());
  }
  
  const blocked = userBlockedList.get(email);
  if (blocked.has(targetEmail)) {
    blocked.delete(targetEmail);
  } else {
    blocked.add(targetEmail);
  }
  
  return Array.from(blocked);
};

// ─── NOTIFICATION HELPER ─────────────────────────────────────────────────────

const addNotification = (targetEmail, data) => {
  if (!targetEmail) return;
  
  const notifs = userNotifications.get(targetEmail) || [];
  const notification = {
    id: uid(),
    ...data,
    timestamp: nowISO(),
    read: false
  };
  
  notifs.unshift(notification);
  
  // Keep only recent notifications
  if (notifs.length > MAX_NOTIFICATIONS_PER_USER) {
    notifs.length = MAX_NOTIFICATIONS_PER_USER;
  }
  
  userNotifications.set(targetEmail, notifs);
  
  // Emit via socket if available
  if (global.io) {
    global.io.to(targetEmail).emit('new_notification', notification);
  }
  
  return notification;
};

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────

/** Check if user is authenticated (based on email in request) */
const requireAuth = (req, res, next) => {
  const userEmail = req.body.userEmail || req.query.userEmail;
  if (!userEmail || !isValidEmail(userEmail)) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

/** Filter out blocked content for a user */
const filterBlockedContent = (content, userEmail) => {
  if (!userEmail || !content) return content;
  
  const blocked = getBlockedUsers(userEmail);
  if (blocked.length === 0) return content;
  
  if (Array.isArray(content)) {
    return content.filter(item => !blocked.includes(item.userEmail));
  }
  
  return content;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POSTS (GLOBALLY VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/posts
 * Get paginated feed (newest first) - GLOBALLY VISIBLE
 */
router.get('/posts', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;
  const userEmail = req.query.userEmail; // For filtering blocked content

  // Sort by newest first
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Apply pagination
  const paginatedPosts = sortedPosts.slice(start, start + limit);
  
  // Attach public profile photos and filter blocked content
  let postsWithProfiles = paginatedPosts.map(post => ({
    ...withPublicProfile(post),
    commentsCount: (commentsByPost.get(post.id) || []).length
  }));

  // Filter out blocked users' content if userEmail provided
  if (userEmail) {
    postsWithProfiles = filterBlockedContent(postsWithProfiles, userEmail);
  }

  res.json({ 
    success: true, 
    posts: postsWithProfiles, 
    total: sortedPosts.length, 
    page, 
    hasMore: start + limit < sortedPosts.length 
  });
});

/**
 * GET /api/social/posts/:id
 * Get single post by ID - GLOBALLY VISIBLE
 */
router.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  
  res.json({ 
    success: true, 
    post: { 
      ...withPublicProfile(post), 
      commentsCount: (commentsByPost.get(post.id) || []).length 
    } 
  });
});

/**
 * POST /api/social/posts
 * Create a new post - GLOBALLY VISIBLE
 */
router.post('/posts', requireAuth, (req, res) => {
  const { 
    content, bookName, author, image, isPublic, userName, userEmail,
    tags = [], isReshare = false, originalPost = null 
  } = req.body;

  if (!content?.trim() || !userName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Content and userName are required' 
    });
  }

  // Ensure profile exists
  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  // Check for duplicate (client-side retry protection)
  if (req.body.id) {
    const duplicate = posts.find(p => String(p.id) === String(req.body.id));
    if (duplicate) {
      return res.json({ 
        success: true, 
        post: withPublicProfile(duplicate), 
        duplicate: true 
      });
    }
  }

  // Extract mentions for notifications
  const mentions = extractMentions(content);
  const sanitizedContent = sanitizeText(content);

  const post = {
    id: req.body.id || `post_${uid()}`,
    content: sanitizedContent,
    bookName: bookName || '',
    author: author || '',
    image: image || null,
    isPublic: isPublic !== false,
    userName,
    userEmail,
    userPhoto: profile.photo,
    userInitials: profile.initials,
    likes: 0,
    likedBy: [],
    comments: 0,
    shares: 0,
    reshareCount: 0,
    createdAt: nowISO(),
    tags: tags || [],
    isReshare: isReshare || false,
    originalPost: originalPost || null
  };

  posts.unshift(post);
  
  // Limit total posts
  if (posts.length > MAX_POSTS) {
    posts = posts.slice(0, MAX_POSTS);
  }

  // Initialize comments array
  commentsByPost.set(post.id, []);

  // Send notifications for mentions
  mentions.forEach(mentionedUsername => {
    // Find user by username (simplified - in production, use proper user lookup)
    const mentionedUser = Array.from(userProfiles.entries()).find(
      ([email, profile]) => profile.name.toLowerCase().includes(mentionedUsername.toLowerCase())
    );
    
    if (mentionedUser && mentionedUser[0] !== userEmail) {
      addNotification(mentionedUser[0], {
        type: 'mention',
        fromUser: userName,
        fromEmail: userEmail,
        fromPhoto: profile.photo,
        message: `${userName} mentioned you in a post: "${content.substring(0, 50)}..."`,
        postId: post.id
      });
    }
  });

  // Emit via socket for real-time updates
  if (global.io) {
    global.io.emit('new_post', withPublicProfile(post));
  }

  res.json({ success: true, post: withPublicProfile(post) });
});

/**
 * POST /api/social/posts/:id/like
 * Toggle like on a post - GLOBALLY VISIBLE
 */
router.post('/posts/:id/like', requireAuth, (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const { userEmail, userName } = req.body;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  // Toggle like
  post.likedBy = toggleInArray(post.likedBy, userEmail);
  post.likes = post.likedBy.length;
  const liked = post.likedBy.includes(userEmail);

  // Send notification if liked and not own post
  if (liked && userEmail !== post.userEmail) {
    const liker = getProfile(userEmail);
    addNotification(post.userEmail, {
      type: 'like',
      fromUser: liker.name || userName || userEmail,
      fromEmail: userEmail,
      fromPhoto: liker.photo,
      message: `${liker.name || userName || userEmail} liked your post`,
      postId: post.id
    });
  }

  // Emit via socket
  if (global.io) {
    global.io.emit('post_liked', { 
      postId: post.id, 
      likes: post.likes, 
      likedBy: post.likedBy 
    });
  }

  res.json({ 
    success: true, 
    likes: post.likes, 
    likedBy: post.likedBy, 
    liked 
  });
});

/**
 * DELETE /api/social/posts/:id
 * Delete a post (author only)
 */
router.delete('/posts/:id', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  const index = posts.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  // Check if user is author
  if (posts[index].userEmail !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const deletedPost = posts[index];
  posts.splice(index, 1);
  commentsByPost.delete(req.params.id);

  // Emit via socket
  if (global.io) {
    global.io.emit('post_deleted', { postId: req.params.id });
  }

  res.json({ success: true, deletedPost });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  COMMENTS (GLOBALLY VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/posts/:id/comments
 * Get all comments for a post - GLOBALLY VISIBLE
 */
router.get('/posts/:id/comments', (req, res) => {
  const allComments = (commentsByPost.get(req.params.id) || [])
    .map(withPublicProfile)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Oldest first

  res.json({ success: true, comments: allComments, count: allComments.length });
});

/**
 * POST /api/social/posts/:id/comments
 * Add a comment to a post - GLOBALLY VISIBLE
 */
router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const { userName, userEmail, content, parentId } = req.body;

  if (!content?.trim() || !userName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Content and userName are required' 
    });
  }

  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const comments = commentsByPost.get(req.params.id) || [];

  // Check for duplicate
  if (req.body.id) {
    const duplicate = comments.find(c => String(c.id) === String(req.body.id));
    if (duplicate) {
      return res.json({ success: true, comment: withPublicProfile(duplicate), duplicate: true });
    }
  }

  // Ensure profile exists
  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  // Extract mentions
  const mentions = extractMentions(content);
  const sanitizedContent = sanitizeText(content);

  const comment = {
    id: req.body.id || `cmt_${uid()}`,
    postId: req.params.id,
    userName,
    userEmail,
    userPhoto: profile.photo,
    userInitials: profile.initials,
    content: sanitizedContent,
    timestamp: nowISO(),
    parentId: parentId || null,
    likes: 0,
    likedBy: [],
    mentions,
    isAuthor: userEmail === post.userEmail
  };

  comments.push(comment);
  
  // Limit comments per post
  if (comments.length > MAX_COMMENTS_PER_POST) {
    comments.splice(0, comments.length - MAX_COMMENTS_PER_POST);
  }
  
  commentsByPost.set(req.params.id, comments);
  post.comments = comments.filter(c => !c.parentId).length;

  // Send notifications for mentions
  mentions.forEach(mentionedUsername => {
    const mentionedUser = Array.from(userProfiles.entries()).find(
      ([email, profile]) => profile.name.toLowerCase().includes(mentionedUsername.toLowerCase())
    );
    
    if (mentionedUser && mentionedUser[0] !== userEmail) {
      addNotification(mentionedUser[0], {
        type: 'mention',
        fromUser: userName,
        fromEmail: userEmail,
        fromPhoto: profile.photo,
        message: `${userName} mentioned you in a comment: "${content.substring(0, 40)}..."`,
        postId: req.params.id,
        commentId: comment.id
      });
    }
  });

  // Notify post author
  if (userEmail !== post.userEmail) {
    addNotification(post.userEmail, {
      type: 'comment',
      fromUser: userName,
      fromEmail: userEmail,
      fromPhoto: profile.photo,
      message: `${userName} commented: "${content.substring(0, 50)}..."`,
      postId: req.params.id,
      commentId: comment.id
    });
  }

  // Emit via socket
  if (global.io) {
    global.io.emit('new_comment', { 
      postId: req.params.id, 
      comment: withPublicProfile(comment) 
    });
  }

  res.json({ success: true, comment: withPublicProfile(comment) });
});

/**
 * POST /api/social/comments/:id/like
 * Toggle like on a comment - GLOBALLY VISIBLE
 */
router.post('/comments/:id/like', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  let foundComment = null;
  let foundPostId = null;

  // Find comment across all posts
  for (const [postId, comments] of commentsByPost.entries()) {
    const comment = comments.find(c => c.id === req.params.id);
    if (comment) {
      foundComment = comment;
      foundPostId = postId;
      break;
    }
  }

  if (!foundComment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  // Toggle like
  foundComment.likedBy = toggleInArray(foundComment.likedBy, userEmail);
  foundComment.likes = foundComment.likedBy.length;
  const liked = foundComment.likedBy.includes(userEmail);

  // Send notification
  if (liked && userEmail !== foundComment.userEmail) {
    const liker = getProfile(userEmail);
    addNotification(foundComment.userEmail, {
      type: 'like',
      fromUser: liker.name || userEmail,
      fromEmail: userEmail,
      fromPhoto: liker.photo,
      message: `${liker.name || userEmail} liked your comment`,
      postId: foundPostId,
      commentId: foundComment.id
    });
  }

  res.json({ 
    success: true, 
    likes: foundComment.likes, 
    likedBy: foundComment.likedBy, 
    liked 
  });
});

/**
 * DELETE /api/social/comments/:id
 * Delete a comment (author only)
 */
router.delete('/comments/:id', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  
  for (const [postId, comments] of commentsByPost.entries()) {
    const index = comments.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
      // Check if user is author
      if (comments[index].userEmail !== userEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      // Remove comment and its replies
      const filteredComments = comments.filter(c => 
        c.id !== req.params.id && c.parentId !== req.params.id
      );
      commentsByPost.set(postId, filteredComments);

      // Update post comment count
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.comments = filteredComments.filter(c => !c.parentId).length;
      }

      return res.json({ success: true });
    }
  }

  res.status(404).json({ success: false, message: 'Comment not found' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE PHOTOS & PUBLIC PROFILES (GLOBALLY VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social/profile/photo
 * Upload/update profile photo (base64 or file) - GLOBALLY VISIBLE
 */
router.post('/profile/photo', requireAuth, upload.single('photo'), (req, res) => {
  const { email, name, bio, location, website, photo: base64Photo } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const profile = ensureProfile(email, name);
  
  // Handle file upload
  if (req.file) {
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
    profile.photo = photoUrl;
  }
  
  // Handle base64 photo
  if (base64Photo) {
    profile.photo = base64Photo;
  }

  // Update other profile fields
  if (name !== undefined) profile.name = name;
  if (bio !== undefined) profile.bio = bio;
  if (location !== undefined) profile.location = location;
  if (website !== undefined) profile.website = website;
  
  profile.initials = (profile.name || email).slice(0, 2).toUpperCase();
  userProfiles.set(email, profile);

  // Propagate photo to all user content
  propagateProfileUpdate(email);

  // Return public profile
  res.json({
    success: true,
    profile: {
      email,
      name: profile.name,
      initials: profile.initials,
      photo: profile.photo,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      followers: profile.followers.length,
      following: profile.following.length
    }
  });
});

/**
 * GET /api/social/profile/:email
 * Get public profile by email - GLOBALLY VISIBLE
 */
router.get('/profile/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const profile = getProfile(email);

  // Get public stats
  const userPosts = posts.filter(p => p.userEmail === email);
  const userReviews = reviews.filter(r => r.userEmail === email);
  const joinedCrews = crews.filter(c => c.memberEmails.includes(email));

  res.json({
    success: true,
    profile: {
      email,
      name: profile.name,
      initials: profile.initials,
      photo: profile.photo,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      joinedAt: profile.joinedAt,
      followers: profile.followers.length,
      following: profile.following.length,
      stats: {
        postsCount: userPosts.length,
        reviewsCount: userReviews.length,
        crewsCount: joinedCrews.length
      }
    }
  });
});

/**
 * GET /api/social/profiles/batch
 * Get multiple profiles at once - GLOBALLY VISIBLE
 */
router.get('/profiles/batch', (req, res) => {
  const emails = (req.query.emails || '').split(',').map(e => e.trim()).filter(Boolean);
  const profiles = {};

  emails.forEach(email => {
    const profile = getProfile(email);
    profiles[email] = {
      name: profile.name,
      initials: profile.initials,
      photo: profile.photo,
      bio: profile.bio
    };
  });

  res.json({ success: true, profiles });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  FOLLOW SYSTEM (PUBLIC FOLLOWERS/VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social/users/:email/follow
 * Follow/unfollow a user - UPDATES PUBLIC PROFILES
 */
router.post('/users/:email/follow', requireAuth, (req, res) => {
  const targetEmail = decodeURIComponent(req.params.email);
  const { followerEmail, followerName } = req.body;

  if (!followerEmail) {
    return res.status(400).json({ success: false, message: 'followerEmail required' });
  }

  if (targetEmail === followerEmail) {
    return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
  }

  // Ensure both profiles exist
  ensureProfile(targetEmail);
  ensureProfile(followerEmail, followerName);

  const target = getProfile(targetEmail);
  const follower = getProfile(followerEmail);

  const isNowFollowing = !target.followers.includes(followerEmail);

  if (isNowFollowing) {
    target.followers.push(followerEmail);
    follower.following.push(targetEmail);

    addNotification(targetEmail, {
      type: 'follow',
      fromUser: follower.name || followerEmail,
      fromEmail: followerEmail,
      fromPhoto: follower.photo,
      message: `${follower.name || followerEmail} started following you`
    });
  } else {
    target.followers = target.followers.filter(e => e !== followerEmail);
    follower.following = follower.following.filter(e => e !== targetEmail);
  }

  // Update profiles
  userProfiles.set(targetEmail, target);
  userProfiles.set(followerEmail, follower);

  res.json({ 
    success: true, 
    isFollowing: isNowFollowing, 
    followersCount: target.followers.length 
  });
});

/**
 * GET /api/social/users/:email/followers
 * Get followers list - PUBLIC (names only, no private data)
 */
router.get('/users/:email/followers', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const profile = getProfile(email);
  
  const followers = profile.followers.map(followerEmail => {
    const p = getProfile(followerEmail);
    return {
      email: followerEmail,
      name: p.name,
      photo: p.photo,
      initials: p.initials
    };
  });

  res.json({ success: true, followers, count: followers.length });
});

/**
 * GET /api/social/users/:email/following
 * Get following list - PUBLIC (names only, no private data)
 */
router.get('/users/:email/following', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const profile = getProfile(email);
  
  const following = profile.following.map(followingEmail => {
    const p = getProfile(followingEmail);
    return {
      email: followingEmail,
      name: p.name,
      photo: p.photo,
      initials: p.initials
    };
  });

  res.json({ success: true, following, count: following.length });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  REVIEWS (GLOBALLY VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/reviews
 * Get all reviews - GLOBALLY VISIBLE
 */
router.get('/reviews', (req, res) => {
  const userEmail = req.query.userEmail; // For filtering blocked content
  
  let allReviews = reviews.map(withPublicProfile);
  
  // Sort by newest first
  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Filter blocked content
  if (userEmail) {
    allReviews = filterBlockedContent(allReviews, userEmail);
  }

  res.json({ success: true, reviews: allReviews, count: allReviews.length });
});

/**
 * POST /api/social/reviews
 * Create a new review - GLOBALLY VISIBLE
 */
router.post('/reviews', requireAuth, (req, res) => {
  const { bookName, author, rating, review, sentiment, userName, userEmail } = req.body;

  if (!bookName || !review?.trim() || !userName) {
    return res.status(400).json({ 
      success: false, 
      message: 'BookName, review, and userName are required' 
    });
  }

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  const newReview = {
    id: req.body.id || `rev_${uid()}`,
    bookName,
    author: author || '',
    rating: rating || 5,
    review: sanitizeText(review.trim()),
    sentiment: sentiment || 'positive',
    userName,
    userEmail,
    userPhoto: profile.photo,
    userInitials: profile.initials,
    createdAt: nowISO(),
    likes: 0,
    likedBy: []
  };

  reviews.unshift(newReview);
  
  // Limit total reviews
  if (reviews.length > MAX_REVIEWS) {
    reviews = reviews.slice(0, MAX_REVIEWS);
  }

  res.json({ success: true, review: withPublicProfile(newReview) });
});

/**
 * POST /api/social/reviews/:id/like
 * Toggle like on a review - GLOBALLY VISIBLE
 */
router.post('/reviews/:id/like', requireAuth, (req, res) => {
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const { userEmail, userName } = req.body;

  // Toggle like
  review.likedBy = toggleInArray(review.likedBy, userEmail);
  review.likes = review.likedBy.length;
  const liked = review.likedBy.includes(userEmail);

  // Send notification
  if (liked && userEmail !== review.userEmail) {
    const liker = getProfile(userEmail);
    addNotification(review.userEmail, {
      type: 'like',
      fromUser: liker.name || userName || userEmail,
      fromEmail: userEmail,
      fromPhoto: liker.photo,
      message: `${liker.name || userName || userEmail} liked your review of "${review.bookName}"`,
      reviewId: review.id
    });
  }

  res.json({ success: true, likes: review.likes, likedBy: review.likedBy, liked });
});

/**
 * DELETE /api/social/reviews/:id
 * Delete a review (author only)
 */
router.delete('/reviews/:id', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  const index = reviews.findIndex(r => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (reviews[index].userEmail !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  reviews.splice(index, 1);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CREWS (GLOBALLY VISIBLE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/crews
 * Get all crews - GLOBALLY VISIBLE
 */
router.get('/crews', (req, res) => {
  res.json({ success: true, crews });
});

/**
 * POST /api/social/crews
 * Create a new crew - GLOBALLY VISIBLE
 */
router.post('/crews', requireAuth, (req, res) => {
  const { name, author, genre, createdBy, createdByName, description, isPrivate, coverImage } = req.body;

  if (!name || !createdBy) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name and createdBy are required' 
    });
  }

  // One-book-one-crew policy (optional - can be removed if you want multiple crews per book)
  const existing = crews.find(
    c => c.name.toLowerCase() === name.toLowerCase() &&
         (c.author || '').toLowerCase() === (author || '').toLowerCase()
  );

  if (existing) {
    return res.json({ success: true, crew: existing, alreadyExists: true });
  }

  const crew = {
    id: `crew_${uid()}`,
    name,
    author: author || '',
    genre: genre || 'General',
    members: 1,
    memberEmails: [createdBy],
    chats: 0,
    createdBy,
    createdByName: createdByName || createdBy,
    description: description || `Discussing "${name}" together!`,
    createdAt: nowISO(),
    isPrivate: isPrivate || false,
    coverImage: coverImage || null
  };

  crews.unshift(crew);
  
  // Initialize messages array
  crewMessages.set(crew.id, []);

  res.json({ success: true, crew });
});

/**
 * POST /api/social/crews/:id/join
 * Join a crew - UPDATES MEMBERSHIP
 */
router.post('/crews/:id/join', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  const crew = crews.find(c => c.id === req.params.id);

  if (!crew) {
    return res.status(404).json({ success: false, message: 'Crew not found' });
  }

  if (!crew.memberEmails.includes(userEmail)) {
    crew.memberEmails.push(userEmail);
    crew.members = crew.memberEmails.length;

    addNotification(userEmail, {
      type: 'info',
      message: `You joined the crew "${crew.name}"`
    });
  }

  res.json({ 
    success: true, 
    members: crew.members, 
    memberEmails: crew.memberEmails 
  });
});

/**
 * POST /api/social/crews/:id/leave
 * Leave a crew
 */
router.post('/crews/:id/leave', requireAuth, (req, res) => {
  const { userEmail } = req.body;
  const crew = crews.find(c => c.id === req.params.id);

  if (!crew) {
    return res.status(404).json({ success: false, message: 'Crew not found' });
  }

  crew.memberEmails = crew.memberEmails.filter(e => e !== userEmail);
  crew.members = Math.max(0, crew.memberEmails.length);

  res.json({ success: true, members: crew.members });
});

/**
 * POST /api/social/crews/:id/messages
 * Send a message in crew chat
 */
router.post('/crews/:id/messages', requireAuth, (req, res) => {
  const { userName, userEmail, content, type = 'text' } = req.body;

  if (!content?.trim() || !userName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Content and userName are required' 
    });
  }

  const crew = crews.find(c => c.id === req.params.id);
  if (!crew) {
    return res.status(404).json({ success: false, message: 'Crew not found' });
  }

  // Check if user is member
  if (!crew.memberEmails.includes(userEmail)) {
    return res.status(403).json({ success: false, message: 'Must join crew to send messages' });
  }

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  const message = {
    id: `msg_${uid()}`,
    crewId: req.params.id,
    userName,
    userEmail,
    userPhoto: profile.photo,
    userInitials: profile.initials,
    content: type === 'text' ? sanitizeText(content) : content,
    type,
    timestamp: nowISO()
  };

  const messages = crewMessages.get(req.params.id) || [];
  messages.push(message);
  
  // Limit messages
  if (messages.length > 500) {
    messages.splice(0, messages.length - 500);
  }
  
  crewMessages.set(req.params.id, messages);
  crew.chats = messages.length;

  // Send notifications to other members
  crew.memberEmails.forEach(memberEmail => {
    if (memberEmail !== userEmail) {
      addNotification(memberEmail, {
        type: 'message',
        fromUser: userName,
        fromEmail: userEmail,
        fromPhoto: profile.photo,
        message: `New message in "${crew.name}": "${content.substring(0, 40)}..."`,
        crewId: crew.id
      });
    }
  });

  // Emit via socket for real-time chat
  if (global.io) {
    global.io.to(`crew_${crew.id}`).emit('new_crew_message', {
      crewId: crew.id,
      message: withPublicProfile(message)
    });
  }

  res.json({ success: true, message: withPublicProfile(message) });
});

/**
 * GET /api/social/crews/:id/messages
 * Get crew messages
 */
router.get('/crews/:id/messages', (req, res) => {
  const messages = (crewMessages.get(req.params.id) || [])
    .map(withPublicProfile)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({ success: true, messages, count: messages.length });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIVATE USER DATA (SAVED POSTS, READING LISTS)
//  These endpoints require authentication and only return the requesting user's data
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/user/saved-posts
 * Get current user's saved posts - PRIVATE
 */
router.get('/user/saved-posts', requireAuth, (req, res) => {
  const { userEmail } = req.query;
  
  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  const savedPostIds = getSavedPosts(userEmail);
  
  // Return full post objects
  const savedPosts = posts
    .filter(post => savedPostIds.includes(post.id))
    .map(withPublicProfile);

  res.json({ success: true, savedPosts, count: savedPosts.length });
});

/**
 * POST /api/social/user/saved-posts/toggle
 * Toggle save post - PRIVATE
 */
router.post('/user/saved-posts/toggle', requireAuth, (req, res) => {
  const { userEmail, postId } = req.body;

  if (!userEmail || !postId) {
    return res.status(400).json({ 
      success: false, 
      message: 'userEmail and postId required' 
    });
  }

  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const savedPosts = toggleSavedPost(userEmail, postId);
  const isSaved = savedPosts.includes(postId);

  res.json({ success: true, savedPosts, isSaved });
});

/**
 * GET /api/social/user/reading-list
 * Get current user's reading list - PRIVATE
 */
router.get('/user/reading-list', requireAuth, (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  const readingList = getReadingList(userEmail);
  res.json({ success: true, readingList, count: readingList.length });
});

/**
 * POST /api/social/user/reading-list/add
 * Add book to reading list - PRIVATE
 */
router.post('/user/reading-list/add', requireAuth, (req, res) => {
  const { userEmail, book } = req.body;

  if (!userEmail || !book || !book.title) {
    return res.status(400).json({ 
      success: false, 
      message: 'userEmail and book with title required' 
    });
  }

  const readingList = addToReadingList(userEmail, book);
  res.json({ success: true, readingList });
});

/**
 * DELETE /api/social/user/reading-list/:bookId
 * Remove book from reading list - PRIVATE
 */
router.delete('/user/reading-list/:bookId', requireAuth, (req, res) => {
  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  const readingList = removeFromReadingList(userEmail, req.params.bookId);
  res.json({ success: true, readingList });
});

/**
 * GET /api/social/user/blocked
 * Get blocked users - PRIVATE
 */
router.get('/user/blocked', requireAuth, (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  const blocked = getBlockedUsers(userEmail);
  
  // Get profile info for blocked users
  const blockedProfiles = blocked.map(email => {
    const profile = getProfile(email);
    return {
      email,
      name: profile.name,
      initials: profile.initials,
      photo: profile.photo
    };
  });

  res.json({ success: true, blocked: blockedProfiles });
});

/**
 * POST /api/social/user/blocked/toggle
 * Toggle block user - PRIVATE
 */
router.post('/user/blocked/toggle', requireAuth, (req, res) => {
  const { userEmail, targetEmail } = req.body;

  if (!userEmail || !targetEmail) {
    return res.status(400).json({ 
      success: false, 
      message: 'userEmail and targetEmail required' 
    });
  }

  if (userEmail === targetEmail) {
    return res.status(400).json({ success: false, message: 'Cannot block yourself' });
  }

  const blocked = toggleBlockedUser(userEmail, targetEmail);
  const isBlocked = blocked.includes(targetEmail);

  // If blocking, also unfollow if following
  if (isBlocked) {
    const profile = getProfile(userEmail);
    const targetProfile = getProfile(targetEmail);
    
    profile.following = profile.following.filter(e => e !== targetEmail);
    targetProfile.followers = targetProfile.followers.filter(e => e !== userEmail);
    
    userProfiles.set(userEmail, profile);
    userProfiles.set(targetEmail, targetProfile);
  }

  res.json({ success: true, blocked, isBlocked });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/notifications/:email
 * Get user notifications - PRIVATE (only for the user themselves)
 */
router.get('/notifications/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  
  // In production, add auth check here
  const notifications = userNotifications.get(email) || [];
  
  res.json({ 
    success: true, 
    notifications, 
    unread: notifications.filter(n => !n.read).length 
  });
});

/**
 * GET /api/social/notifications/:email/count
 * Get unread count
 */
router.get('/notifications/:email/count', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  
  const notifications = userNotifications.get(email) || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  
  res.json({ success: true, count: unreadCount });
});

/**
 * POST /api/social/notifications/:email/read
 * Mark all notifications as read
 */
router.post('/notifications/:email/read', requireAuth, (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const { userEmail } = req.body;

  // Ensure user is marking their own notifications
  if (email !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const notifications = userNotifications.get(email) || [];
  notifications.forEach(n => { n.read = true; });
  
  res.json({ success: true });
});

/**
 * POST /api/social/notifications/:email/read/:id
 * Mark single notification as read
 */
router.post('/notifications/:email/read/:id', requireAuth, (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const { userEmail } = req.body;

  if (email !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const notifications = userNotifications.get(email) || [];
  const notification = notifications.find(n => n.id === req.params.id);
  if (notification) {
    notification.read = true;
  }

  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PRESENCE / TYPING INDICATORS (for real-time features)
//  These use localStorage on client side, but we provide endpoints for sync
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/social/crews/:id/presence
 * Update user presence in a crew
 */
router.post('/crews/:id/presence', requireAuth, (req, res) => {
  const { userEmail, userName, isOnline } = req.body;
  const crewId = req.params.id;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  // Broadcast presence change via socket
  if (global.io) {
    global.io.to(`crew_${crewId}`).emit('presence_update', {
      crewId,
      user: { email: userEmail, name: userName, isOnline },
      timestamp: nowISO()
    });
  }

  res.json({ success: true });
});

/**
 * POST /api/social/crews/:id/typing
 * Broadcast typing indicator
 */
router.post('/crews/:id/typing', requireAuth, (req, res) => {
  const { userEmail, userName, isTyping } = req.body;
  const crewId = req.params.id;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'userEmail required' });
  }

  // Broadcast typing status via socket
  if (global.io) {
    global.io.to(`crew_${crewId}`).emit('typing_indicator', {
      crewId,
      userId: userEmail,
      userName,
      isTyping,
      timestamp: nowISO()
    });
  }

  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SEARCH / DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/search
 * Search across posts, users, and crews - PUBLIC
 */
router.get('/search', (req, res) => {
  const { q, type = 'all' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: true, results: [] });
  }

  const query = q.toLowerCase();
  const results = {};

  // Search posts
  if (type === 'all' || type === 'posts') {
    results.posts = posts
      .filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.bookName?.toLowerCase().includes(query) ||
        post.author?.toLowerCase().includes(query) ||
        post.userName.toLowerCase().includes(query)
      )
      .map(withPublicProfile)
      .slice(0, 10);
  }

  // Search users
  if (type === 'all' || type === 'users') {
    results.users = Array.from(userProfiles.entries())
      .filter(([email, profile]) => 
        profile.name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      )
      .map(([email, profile]) => ({
        email,
        name: profile.name,
        initials: profile.initials,
        photo: profile.photo,
        bio: profile.bio
      }))
      .slice(0, 10);
  }

  // Search crews
  if (type === 'all' || type === 'crews') {
    results.crews = crews
      .filter(crew => 
        crew.name.toLowerCase().includes(query) ||
        crew.author?.toLowerCase().includes(query) ||
        crew.genre?.toLowerCase().includes(query) ||
        crew.description?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }

  res.json({ success: true, results });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN / DEBUG (remove in production)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/social/stats
 * Get system stats (admin only - in production, add auth)
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      posts: posts.length,
      comments: Array.from(commentsByPost.values()).reduce((sum, arr) => sum + arr.length, 0),
      reviews: reviews.length,
      crews: crews.length,
      users: userProfiles.size,
      crewMessages: Array.from(crewMessages.values()).reduce((sum, arr) => sum + arr.length, 0)
    }
  });
});

/**
 * POST /api/social/reset (development only)
 * Reset all data to defaults (remove in production)
 */
router.post('/reset', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not allowed in production' });
  }

  // Reset to initial state
  posts = [...posts]; // Keep seeded posts
  commentsByPost.clear();
  seedComments();
  
  reviews = [...reviews];
  crews = [...crews];
  crewMessages.clear();
  
  userProfiles.clear();
  // Re-add seed profiles
  const seedProfiles = [
    ['sarah@readcrew.app', { name: 'Sarah Johnson', initials: 'SJ', photo: null, bio: 'Bookworm & coffee addict ☕', followers: [], following: [] }],
    ['mike@readcrew.app', { name: 'Mike Chen', initials: 'MC', photo: null, bio: 'Sci-fi & history lover 🚀', followers: [], following: [] }],
    ['priya@readcrew.app', { name: 'Priya Sharma', initials: 'PS', photo: null, bio: 'Thriller addict 🔪', followers: [], following: [] }]
  ];
  seedProfiles.forEach(([email, profile]) => userProfiles.set(email, profile));

  userSavedPosts.clear();
  userReadingLists.clear();
  userNotifications.clear();
  userBlockedList.clear();

  res.json({ success: true, message: 'Data reset to defaults' });
});

module.exports = router;

// Export data stores for use in other routes
module.exports.posts = posts;
module.exports.crews = crews;
module.exports.userProfiles = userProfiles;
module.exports.commentsByPost = commentsByPost;
module.exports.reviews = reviews;