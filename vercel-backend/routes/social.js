// routes/socialRoutes.js
// ─── PUBLIC SOCIAL FEATURES ────────────────────────────────────────────────────
// All data is stored in server-side memory so EVERY user sees the same
// comments, likes, and profile photos — no more per-device localStorage silos.
//
// Route map:
//   POSTS
//     GET  /api/social/posts                         paginated feed (newest first)
//     GET  /api/social/posts/:id                     single post
//     POST /api/social/posts                         create post
//     POST /api/social/posts/:id/like                toggle like (per user)
//     DELETE /api/social/posts/:id                   delete (author only)
//
//   COMMENTS  ← stored globally — every user sees every comment
//     GET  /api/social/posts/:id/comments            all comments for a post
//     POST /api/social/posts/:id/comments            add comment
//     POST /api/social/posts/:id/comment             [legacy alias]
//     POST /api/social/comments/:cid/like            toggle comment like
//     POST /api/social/posts/:id/comments/:cid/like  [legacy alias]
//     DELETE /api/social/comments/:cid               delete comment (author only)
//
//   PROFILE PHOTOS  ← upload once, served to all users
//     POST /api/social/profile/photo                 upload / update photo
//     GET  /api/social/profile/photo/:email          fetch any user's photo
//     GET  /api/social/profiles/batch                fetch multiple profiles at once
//
//   USERS / FOLLOWS
//     GET  /api/social/users/:email                  public profile card
//     POST /api/social/users/:email/follow           toggle follow
//     GET  /api/social/users/:email/followers        follower list
//     GET  /api/social/users/:email/following        following list
//
//   REVIEWS
//     GET  /api/social/reviews                       all reviews
//     POST /api/social/reviews                       create review
//     POST /api/social/reviews/:id/like              toggle like
//     DELETE /api/social/reviews/:id                 delete review (author only)
//
//   CREWS
//     GET  /api/social/crews                         all crews
//     POST /api/social/crews                         create crew (1-book-1-crew policy)
//     POST /api/social/crews/:id/join                join crew
//     POST /api/social/crews/:id/leave               leave crew
//     POST /api/social/crews/:id/message             send message
//     GET  /api/social/crews/:id/messages            get messages
//
//   NOTIFICATIONS
//     GET  /api/social/notifications/:email          get notifications
//     GET  /api/social/notifications/:email/count    unread count
//     POST /api/social/notifications/:email/read     mark all as read

'use strict';

const express = require('express');
const router  = express.Router();

// ─── SMALL UTILITIES ──────────────────────────────────────────────────────────

const nowISO = () => new Date().toISOString();
const uid    = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Toggle a value inside an array (like a Set). Returns a new array. */
const toggleInArray = (arr = [], val) => {
  const s = new Set(arr);
  s.has(val) ? s.delete(val) : s.add(val);
  return [...s];
};

// ─── IN-MEMORY DATA STORES ────────────────────────────────────────────────────

// ── Posts ──────────────────────────────────────────────────────────────────────
let posts = [
  {
    id: 'demo1', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'PS',
    content: "Just finished 'Atomic Habits' and my mind is blown 🤯 The 1% improvement concept is life-changing. If you haven't read it yet, what are you waiting for?",
    bookName: 'Atomic Habits', author: 'James Clear', image: null,
    likes: 24, likedBy: [], comments: 5, shares: 3,
    createdAt: new Date(Date.now() - 2  * 3600000).toISOString(), isPublic: true,
  },
  {
    id: 'demo2', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'RM',
    content: "The ending of 'Project Hail Mary' had me in tears. Andy Weir is a genius. Rocky is the best fictional character ever created 🛸",
    bookName: 'Project Hail Mary', author: 'Andy Weir', image: null,
    likes: 41, likedBy: [], comments: 12, shares: 7,
    createdAt: new Date(Date.now() - 5  * 3600000).toISOString(), isPublic: true,
  },
  {
    id: 'demo3', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'AK',
    content: "3 AM and I can't stop reading 'The Silent Patient'. The twist… I did NOT see that coming 😱",
    bookName: 'The Silent Patient', author: 'Alex Michaelides', image: null,
    likes: 67, likedBy: [], comments: 23, shares: 11,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), isPublic: true,
  },
  {
    id: 'demo4', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'VN',
    content: "Reading 'Sapiens' for the second time. It hits different when you're older. Harari makes you question everything 🌍",
    bookName: 'Sapiens', author: 'Yuval Noah Harari', image: null,
    likes: 33, likedBy: [], comments: 8, shares: 5,
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(), isPublic: true,
  },
  {
    id: 'demo5', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'SP',
    content: "Beach Read by Emily Henry is the perfect summer novel 🌊☀️ The slow-burn romance is CHEF'S KISS. Highly recommend!",
    bookName: 'Beach Read', author: 'Emily Henry', image: null,
    likes: 52, likedBy: [], comments: 15, shares: 9,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), isPublic: true,
  },
  {
    id: 'demo6', userName: 'Sakshi', userEmail: 'sakshi@readcrew.app',
    userPhoto: null, userInitials: 'AS',
    content: "Fourth Wing crew where you at? 🐉 Just joined the dragon riders academy and I'm absolutely obsessed. Xaden Riorson can fight me any day 😍",
    bookName: 'Fourth Wing', author: 'Rebecca Yarros', image: null,
    likes: 89, likedBy: [], comments: 31, shares: 14,
    createdAt: new Date(Date.now() - 30 * 3600000).toISOString(), isPublic: true,
  },
];

// ── Comments: Map<postId, Comment[]> ─────────────────────────────────────────
const commentsByPost = new Map();

(function seedComments() {
  const seed = [
    { id: 'sc1', postId: 'demo1', userName: 'Sakshi',  userEmail: 'rahul@readcrew.app',  userInitials: 'S', content: "Completely agree! The 1% rule changed my reading habit too.",              parentId: null, likes: 5,  likedBy: [], timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sc2', postId: 'demo1', userName: 'Sakshi',   userEmail: 'aisha@readcrew.app',  userInitials: 'S', content: "Which chapter hit you hardest? I loved the Habit Stacking part!",         parentId: null, likes: 3,  likedBy: [], timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 'sc3', postId: 'demo2', userName: 'Sakshi', userEmail: 'arjun@readcrew.app',  userInitials: 'S', content: "Rocky is the best! The first communication scene made me cry 😭",          parentId: null, likes: 8,  likedBy: [], timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'sc4', postId: 'demo3', userName: 'Sakshi',  userEmail: 'sneha@readcrew.app',  userInitials: 'S', content: "That twist ruined my sleep for a week! Still not over it 🔥",              parentId: null, likes: 12, likedBy: [], timestamp: new Date(Date.now() - 21600000).toISOString() },
    { id: 'sc5', postId: 'demo4', userName: 'Sakshi', userEmail: 'priya@readcrew.app',  userInitials: 'S', content: "The chapter on religion completely changed how I see the world.",           parentId: null, likes: 7,  likedBy: [], timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: 'sc6', postId: 'demo5', userName: 'Sakshi',   userEmail: 'aisha@readcrew.app',  userInitials: 'S', content: "Emily Henry is queen! Have you read People We Meet on Vacation yet?",     parentId: null, likes: 6,  likedBy: [], timestamp: new Date(Date.now() - 18000000).toISOString() },
    { id: 'sc7', postId: 'demo6', userName: 'Sakshi',  userEmail: 'vikram@readcrew.app', userInitials: 'S', content: "Team Xaden forever! The tension in this book is absolutely unreal 🔥",     parentId: null, likes: 15, likedBy: [], timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'sc8', postId: 'demo6', userName: 'Sakshi',  userEmail: 'sneha@readcrew.app',  userInitials: 'S', content: "Violettttt! She is my favourite fantasy protagonist of all time 😍",       parentId: null, likes: 11, likedBy: [], timestamp: new Date(Date.now() - 72000000).toISOString() },
  ];
  seed.forEach(c => {
    const arr = commentsByPost.get(c.postId) || [];
    arr.push({ ...c, userPhoto: null, isAuthor: false });
    commentsByPost.set(c.postId, arr);
  });
})();

// ── Reviews ────────────────────────────────────────────────────────────────────
let reviews = [
  { id: 'rev1', bookName: 'Atomic Habits',          author: 'James Clear',        rating: 5, review: "This book permanently changed how I think about self-improvement. The identity-based habit framework is revolutionary — and it actually works.", sentiment: 'positive', userName: 'Sakshi',  userEmail: 'priya@readcrew.app',  userPhoto: null, userInitials: 'PS', createdAt: new Date(Date.now() -  3 * 86400000).toISOString(), likes: 28, likedBy: [] },
  { id: 'rev2', bookName: 'The Silent Patient',      author: 'Alex Michaelides',   rating: 5, review: "I stayed up until 4 AM to finish this. The psychological thriller genre has a new king. The ending is absolute perfection — cannot recommend this more.",  sentiment: 'positive', userName: 'Sakshi',    userEmail: 'aisha@readcrew.app',  userPhoto: null, userInitials: 'AK', createdAt: new Date(Date.now() -  5 * 86400000).toISOString(), likes: 45, likedBy: [] },
  { id: 'rev3', bookName: 'Project Hail Mary',       author: 'Andy Weir',          rating: 5, review: "Andy Weir has done it again but even better. The science is wild and actually real, and the friendship at the heart of the book made me cry.",              sentiment: 'positive', userName: 'Sakshi',   userEmail: 'rahul@readcrew.app',  userPhoto: null, userInitials: 'RM', createdAt: new Date(Date.now() -  7 * 86400000).toISOString(), likes: 61, likedBy: [] },
  { id: 'rev4', bookName: 'It Ends with Us',         author: 'Colleen Hoover',     rating: 4, review: "This book is important. Colleen Hoover tackles a very difficult subject with sensitivity and grace. Bring a box of tissues — you will need them.",           sentiment: 'positive', userName: 'Sakshi',   userEmail: 'sneha@readcrew.app',  userPhoto: null, userInitials: 'SP', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), likes: 37, likedBy: [] },
  { id: 'rev5', bookName: 'The Psychology of Money', author: 'Morgan Housel',      rating: 5, review: "Everyone who earns or spends money should read this book — which is everyone! Housel's 19 short stories are more insightful than any finance textbook.",  sentiment: 'positive', userName: 'Sakshi',   userEmail: 'vikram@readcrew.app', userPhoto: null, userInitials: 'VN', createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), likes: 52, likedBy: [] },
];

// ── Crews ──────────────────────────────────────────────────────────────────────
let crews = [
  { id: 'crew1', name: 'Atomic Habits',       author: 'James Clear',       genre: 'Self-Help',    members: 47, memberEmails: [], chats: 283, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), description: 'Building better habits together, one tiny change at a time!' },
  { id: 'crew2', name: 'Project Hail Mary',   author: 'Andy Weir',         genre: 'Sci-Fi',       members: 38, memberEmails: [], chats: 195, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), description: 'Rocky fan club & science nerd discussion group 🛸' },
  { id: 'crew3', name: 'Fourth Wing',         author: 'Rebecca Yarros',    genre: 'Fantasy',      members: 91, memberEmails: [], chats: 512, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), description: 'Dragon riders unite! Discussing all things Basgiath War College 🐉' },
  { id: 'crew4', name: 'The Alchemist',       author: 'Paulo Coelho',      genre: 'Inspirational',members: 63, memberEmails: [], chats: 341, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 25 * 86400000).toISOString(), description: 'Following our Personal Legends together ✨' },
  { id: 'crew5', name: 'The Silent Patient',  author: 'Alex Michaelides',  genre: 'Thriller',     members: 55, memberEmails: [], chats: 278, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 18 * 86400000).toISOString(), description: 'We need to talk about THAT twist 😱 Spoilers welcome!' },
  { id: 'crew6', name: 'Sapiens',             author: 'Yuval Noah Harari', genre: 'History',      members: 42, memberEmails: [], chats: 167, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 22 * 86400000).toISOString(), description: 'Questioning everything about humankind since 70,000 BCE 🌍' },
];

// Map<crewId, Message[]>
const crewMessages = new Map();

// ── User profiles: Map<email, Profile> ───────────────────────────────────────
// Stores display name, photo (base64), bio, followers[], following[]
const userProfiles = new Map([
  ['priya@readcrew.app',  { name: 'Sakshi',  initials: 'S', photo: null, bio: 'Bookworm & coffee addict ☕',   followers: [], following: [] }],
  ['rahul@readcrew.app',  { name: 'Sakshi',   initials: 'S', photo: null, bio: 'Sci-fi & history lover 🚀',     followers: [], following: [] }],
  ['aisha@readcrew.app',  { name: 'Sakshi',    initials: 'S', photo: null, bio: 'Thriller addict 🔪',             followers: [], following: [] }],
  ['vikram@readcrew.app', { name: 'Sakshi',   initials: 'S', photo: null, bio: 'Non-fiction evangelist 🌍',      followers: [], following: [] }],
  ['sneha@readcrew.app',  { name: 'Sakshi',   initials: 'S', photo: null, bio: 'Romance & cozy fiction ❤️',     followers: [], following: [] }],
  ['arjun@readcrew.app',  { name: 'Sakshi',  initials: 'S', photo: null, bio: 'Fantasy & gaming nerd 🐉',      followers: [], following: [] }],
]);

// ── Notifications: Map<email, Notification[]> ──────────────────────────────────
const userNotifications = new Map();

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────

/** Get profile, returning a safe default if not found. */
function getProfile(email) {
  return userProfiles.get(email) || { name: email || 'User', initials: (email || 'U').slice(0, 2).toUpperCase(), photo: null, bio: '', followers: [], following: [] };
}

/** Ensure a profile row exists, creating one if needed. Returns the profile. */
function ensureProfile(email, name) {
  if (!email) return getProfile(null);
  if (!userProfiles.has(email)) {
    userProfiles.set(email, {
      name:      name || email,
      initials:  (name || email).slice(0, 2).toUpperCase(),
      photo:     null,
      bio:       '',
      followers: [],
      following: [],
    });
  }
  return userProfiles.get(email);
}

/**
 * Attach the server-side photo & initials to any object that has `userEmail`.
 * This means a user who uploads a new photo will immediately be reflected
 * on ALL their posts and comments served to other users.
 */
function withPhoto(obj) {
  if (!obj.userEmail) return obj;
  const p = getProfile(obj.userEmail);
  return { ...obj, userPhoto: p.photo, userInitials: p.initials || obj.userInitials };
}

/** Propagate a profile update to every post, comment, review, and message. */
function propagateProfileUpdate(email) {
  const p = getProfile(email);
  posts.forEach(post => {
    if (post.userEmail === email) {
      post.userPhoto    = p.photo;
      post.userInitials = p.initials;
    }
  });
  for (const arr of commentsByPost.values()) {
    arr.forEach(c => {
      if (c.userEmail === email) {
        c.userPhoto    = p.photo;
        c.userInitials = p.initials;
      }
    });
  }
  reviews.forEach(r => {
    if (r.userEmail === email) {
      r.userPhoto    = p.photo;
      r.userInitials = p.initials;
    }
  });
  for (const msgs of crewMessages.values()) {
    msgs.forEach(m => {
      if (m.userEmail === email) {
        m.userPhoto    = p.photo;
        m.userInitials = p.initials;
      }
    });
  }
}

// ─── NOTIFICATION HELPER ─────────────────────────────────────────────────────

function addNotification(targetEmail, data) {
  if (!targetEmail) return;
  const arr = userNotifications.get(targetEmail) || [];
  arr.unshift({ id: uid(), ...data, timestamp: nowISO(), read: false });
  if (arr.length > 150) arr.length = 150;
  userNotifications.set(targetEmail, arr);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POSTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/posts?page=1&limit=20
router.get('/posts', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;

  const slice = posts.slice(start, start + limit).map(p => ({
    ...withPhoto(p),
    commentsCount: (commentsByPost.get(p.id) || []).length,
  }));

  res.json({ success: true, posts: slice, total: posts.length, page, hasMore: start + limit < posts.length });
});

// GET /api/social/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.json({ success: true, post: { ...withPhoto(post), commentsCount: (commentsByPost.get(post.id) || []).length } });
});

// POST /api/social/posts
router.post('/posts', (req, res) => {
  const { content, bookName, author, image, isPublic, userName, userEmail } = req.body;
  if (!content?.trim() || !userName) {
    return res.status(400).json({ success: false, message: 'content and userName are required' });
  }

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  // ✅ If client sends a userPhoto (base64), store it in the profile so all users see it
  if (req.body.userPhoto && userEmail) {
    profile.photo = req.body.userPhoto;
    if (!profile.initials) profile.initials = userName?.slice(0,2).toUpperCase() || '??';
    userProfiles.set(userEmail, profile);
    // Propagate to existing content
    propagateProfileUpdate(userEmail);
  }

  // Dedup by client-supplied id
  if (req.body.id) {
    const dup = posts.find(p => String(p.id) === String(req.body.id));
    if (dup) return res.json({ success: true, post: withPhoto(dup), duplicate: true });
  }

  const post = {
    id:           req.body.id || `post_${uid()}`,
    content:      content.trim(),
    bookName:     bookName  || '',
    author:       author    || '',
    image:        image     || null,
    isPublic:     isPublic  !== false,
    userName,
    userEmail:    userEmail || '',
    userPhoto:    profile.photo || req.body.userPhoto || null,
    userInitials: profile.initials || req.body.userInitials || userName?.slice(0,2).toUpperCase(),
    likes:        0,
    likedBy:      [],
    comments:     0,
    shares:       0,
    createdAt:    nowISO(),
  };

  posts.unshift(post);
  if (posts.length > 500) posts = posts.slice(0, 500);
  commentsByPost.set(post.id, []);

  res.json({ success: true, post: withPhoto(post) });
});

// POST /api/social/posts/:id/like   — toggle per user (send userEmail in body)
router.post('/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  const { userEmail, userName } = req.body;

  if (userEmail) {
    post.likedBy = toggleInArray(post.likedBy, userEmail);
    post.likes   = post.likedBy.length;
    const liked  = post.likedBy.includes(userEmail);

    if (liked && userEmail !== post.userEmail) {
      const liker = getProfile(userEmail);
      addNotification(post.userEmail, {
        type:      'like',
        fromUser:  liker.name || userName || userEmail,
        fromEmail: userEmail,
        fromPhoto: liker.photo,
        message:   `${liker.name || userName || userEmail} liked your post`,
        postId:    post.id,
      });
    }

    return res.json({ success: true, likes: post.likes, likedBy: post.likedBy, liked });
  }

  // Fallback: anonymous increment
  post.likes = (post.likes || 0) + 1;
  res.json({ success: true, likes: post.likes, likedBy: post.likedBy, liked: true });
});

// DELETE /api/social/posts/:id
router.delete('/posts/:id', (req, res) => {
  const { userEmail } = req.body;
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });
  if (userEmail && posts[idx].userEmail !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  posts.splice(idx, 1);
  commentsByPost.delete(req.params.id);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  COMMENTS  — the critical globally-synced piece
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/posts/:id/comments
router.get('/posts/:id/comments', (req, res) => {
  const all = (commentsByPost.get(req.params.id) || []).map(withPhoto);
  all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // oldest first
  res.json({ success: true, comments: all, count: all.length });
});

// Internal handler used by both POST /comments and the legacy POST /comment
function handleAddComment(postId, body, res) {
  const { userId, userName, userEmail, content, parentId, id: clientId } = body;

  if (!content?.trim() || !userName) {
    return res.status(400).json({ success: false, message: 'content and userName are required' });
  }

  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  const arr = commentsByPost.get(postId) || [];

  // Dedup by client id
  if (clientId) {
    const dup = arr.find(c => String(c.id) === String(clientId));
    if (dup) return res.json({ success: true, comment: withPhoto(dup), duplicate: true });
  }

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  // ✅ If client sends userPhoto (base64), store it so future fetches include it
  if (body.userPhoto && userEmail) {
    profile.photo = body.userPhoto;
    if (!profile.initials) profile.initials = userName?.slice(0,2).toUpperCase() || '??';
    userProfiles.set(userEmail, profile);
  }

  const comment = {
    id:           clientId || `cmt_${uid()}`,
    postId,
    userId:       userId || userEmail,
    userName,
    userEmail:    userEmail || '',
    userPhoto:    profile.photo || body.userPhoto || null,
    userInitials: profile.initials || body.userInitials || userName?.slice(0,2).toUpperCase(),
    content:      content.trim(),
    timestamp:    nowISO(),
    parentId:     parentId || null,
    likes:        0,
    likedBy:      [],
    isAuthor:     userEmail === post.userEmail,
  };

  arr.push(comment);
  if (arr.length > 500) arr.splice(0, arr.length - 500);
  commentsByPost.set(postId, arr);
  post.comments = arr.filter(c => !c.parentId).length;

  // Notify post author (not for own comments)
  if (userEmail !== post.userEmail) {
    addNotification(post.userEmail, {
      type:      'comment',
      fromUser:  userName,
      fromEmail: userEmail,
      fromPhoto: profile.photo,
      message:   `${userName} commented: "${content.slice(0, 50)}"`,
      postId,
      commentId: comment.id,
    });
  }

  return res.json({ success: true, comment: withPhoto(comment) });
}

// POST /api/social/posts/:id/comments
router.post('/posts/:id/comments', (req, res) => {
  handleAddComment(req.params.id, req.body, res);
});

// POST /api/social/posts/:id/comment  (legacy — singular)
router.post('/posts/:id/comment', (req, res) => {
  handleAddComment(req.params.id, req.body, res);
});

// POST /api/social/comments/:cid/like
function handleLikeComment(cid, body, res) {
  const { userEmail } = body;
  let found = null;
  for (const arr of commentsByPost.values()) {
    const c = arr.find(x => x.id === cid);
    if (c) { found = c; break; }
  }
  if (!found) return res.status(404).json({ success: false, message: 'Comment not found' });

  if (userEmail) {
    found.likedBy = toggleInArray(found.likedBy, userEmail);
    found.likes   = found.likedBy.length;
    return res.json({ success: true, likes: found.likes, likedBy: found.likedBy, liked: found.likedBy.includes(userEmail) });
  }
  found.likes = (found.likes || 0) + 1;
  res.json({ success: true, likes: found.likes, liked: true });
}

router.post('/comments/:cid/like', (req, res) => handleLikeComment(req.params.cid, req.body, res));

// Legacy alias: POST /api/social/posts/:id/comments/:cid/like
router.post('/posts/:id/comments/:cid/like', (req, res) => handleLikeComment(req.params.cid, req.body, res));

// DELETE /api/social/comments/:cid
router.delete('/comments/:cid', (req, res) => {
  const { userEmail } = req.body;
  for (const [postId, arr] of commentsByPost.entries()) {
    const idx = arr.findIndex(c => c.id === req.params.cid);
    if (idx !== -1) {
      if (userEmail && arr[idx].userEmail !== userEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      // Remove comment + all its replies
      const filtered = arr.filter(c => c.id !== req.params.cid && c.parentId !== req.params.cid);
      commentsByPost.set(postId, filtered);
      const post = posts.find(p => p.id === postId);
      if (post) post.comments = filtered.filter(c => !c.parentId).length;
      return res.json({ success: true });
    }
  }
  res.status(404).json({ success: false, message: 'Comment not found' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE PHOTOS  — one upload, everyone sees it
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/social/profile/photo
// Body: { email, name?, bio?, photo: 'data:image/jpeg;base64,...' }
router.post('/profile/photo', (req, res) => {
  const { email, name, bio, photo } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'email is required' });

  const profile = ensureProfile(email, name);
  if (photo !== undefined) profile.photo    = photo;   // null clears the photo
  if (name  !== undefined) profile.name     = name;
  if (bio   !== undefined) profile.bio      = bio;
  profile.initials = (profile.name || email).slice(0, 2).toUpperCase();

  // Push updated photo to every post / comment / review by this user
  propagateProfileUpdate(email);

  res.json({
    success: true,
    profile: { email, name: profile.name, initials: profile.initials, photo: profile.photo, bio: profile.bio },
  });
});

// GET /api/social/profile/photo/:email  — fetch any user's photo
router.get('/profile/photo/:email', (req, res) => {
  const email   = decodeURIComponent(req.params.email);
  const profile = getProfile(email);
  res.json({ success: true, email, name: profile.name, initials: profile.initials, photo: profile.photo, bio: profile.bio });
});

// GET /api/social/profiles/batch?emails=a@b.com,c@d.com
router.get('/profiles/batch', (req, res) => {
  const emails = (req.query.emails || '').split(',').map(e => e.trim()).filter(Boolean);
  const result = {};
  emails.forEach(email => {
    const p = getProfile(email);
    result[email] = { name: p.name, initials: p.initials, photo: p.photo, bio: p.bio };
  });
  res.json({ success: true, profiles: result });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  USERS / FOLLOWS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/users/:email
router.get('/users/:email', (req, res) => {
  const email   = decodeURIComponent(req.params.email);
  const profile = getProfile(email);
  res.json({
    success: true,
    user: {
      email,
      name:         profile.name,
      initials:     profile.initials,
      photo:        profile.photo,
      bio:          profile.bio,
      followers:    profile.followers.length,
      following:    profile.following.length,
      postsCount:   posts.filter(p => p.userEmail === email).length,
      reviewsCount: reviews.filter(r => r.userEmail === email).length,
    },
  });
});

// POST /api/social/users/:email/follow   body: { followerEmail, followerName }
router.post('/users/:email/follow', (req, res) => {
  const targetEmail           = decodeURIComponent(req.params.email);
  const { followerEmail, followerName } = req.body;
  if (!followerEmail) return res.status(400).json({ success: false, message: 'followerEmail required' });

  ensureProfile(targetEmail);
  ensureProfile(followerEmail, followerName);

  const target   = getProfile(targetEmail);
  const follower = getProfile(followerEmail);
  const isNowFollowing = !target.followers.includes(followerEmail);

  if (isNowFollowing) {
    target.followers.push(followerEmail);
    follower.following.push(targetEmail);
    addNotification(targetEmail, {
      type:      'follow',
      fromUser:  follower.name || followerEmail,
      fromEmail: followerEmail,
      fromPhoto: follower.photo,
      message:   `${follower.name || followerEmail} started following you`,
    });
  } else {
    target.followers   = target.followers.filter(e => e !== followerEmail);
    follower.following = follower.following.filter(e => e !== targetEmail);
  }

  res.json({ success: true, isFollowing: isNowFollowing, followersCount: target.followers.length });
});

// GET /api/social/users/:email/followers
router.get('/users/:email/followers', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const list  = getProfile(email).followers.map(e => {
    const p = getProfile(e);
    return { email: e, name: p.name, photo: p.photo, initials: p.initials };
  });
  res.json({ success: true, followers: list, count: list.length });
});

// GET /api/social/users/:email/following
router.get('/users/:email/following', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const list  = getProfile(email).following.map(e => {
    const p = getProfile(e);
    return { email: e, name: p.name, photo: p.photo, initials: p.initials };
  });
  res.json({ success: true, following: list, count: list.length });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/reviews
router.get('/reviews', (req, res) => {
  res.json({ success: true, reviews: reviews.map(withPhoto) });
});

// POST /api/social/reviews
router.post('/reviews', (req, res) => {
  const { bookName, author, rating, review, sentiment, userName, userEmail } = req.body;
  if (!bookName || !review?.trim() || !userName) {
    return res.status(400).json({ success: false, message: 'bookName, review, userName required' });
  }

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  const rv = {
    id:           req.body.id || `rev_${uid()}`,
    bookName,
    author:       author    || '',
    rating:       rating    || 5,
    review:       review.trim(),
    sentiment:    sentiment || 'positive',
    userName,
    userEmail:    userEmail || '',
    userPhoto:    profile.photo,
    userInitials: profile.initials,
    createdAt:    nowISO(),
    likes:        0,
    likedBy:      [],
  };

  reviews.unshift(rv);
  if (reviews.length > 200) reviews = reviews.slice(0, 200);
  res.json({ success: true, review: withPhoto(rv) });
});

// POST /api/social/reviews/:id/like
router.post('/reviews/:id/like', (req, res) => {
  const { userEmail, userName } = req.body;
  const rv = reviews.find(r => r.id === req.params.id);
  if (!rv) return res.status(404).json({ success: false, message: 'Review not found' });

  if (userEmail) {
    rv.likedBy = toggleInArray(rv.likedBy, userEmail);
    rv.likes   = rv.likedBy.length;
    const liked = rv.likedBy.includes(userEmail);
    if (liked && userEmail !== rv.userEmail) {
      const liker = getProfile(userEmail);
      addNotification(rv.userEmail, {
        type:      'like',
        fromUser:  liker.name || userName || userEmail,
        fromEmail: userEmail,
        fromPhoto: liker.photo,
        message:   `${liker.name || userName || userEmail} liked your review of "${rv.bookName}"`,
        reviewId:  rv.id,
      });
    }
    return res.json({ success: true, likes: rv.likes, likedBy: rv.likedBy, liked });
  }

  rv.likes = (rv.likes || 0) + 1;
  res.json({ success: true, likes: rv.likes, liked: true });
});

// DELETE /api/social/reviews/:id
router.delete('/reviews/:id', (req, res) => {
  const { userEmail } = req.body;
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found' });
  if (userEmail && reviews[idx].userEmail !== userEmail) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  reviews.splice(idx, 1);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CREWS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/crews
router.get('/crews', (req, res) => {
  res.json({ success: true, crews });
});

// POST /api/social/crews
router.post('/crews', (req, res) => {
  const { name, author, genre, createdBy, createdByName, description } = req.body;
  if (!name || !createdBy) {
    return res.status(400).json({ success: false, message: 'name and createdBy required' });
  }
  // One-book-one-crew policy
  const existing = crews.find(
    c => c.name.toLowerCase() === name.toLowerCase() &&
         (c.author || '').toLowerCase() === (author || '').toLowerCase()
  );
  if (existing) return res.json({ success: true, crew: existing, alreadyExists: true });

  const crew = {
    id:            `crew_${uid()}`,
    name,
    author:        author        || '',
    genre:         genre         || 'General',
    members:       1,
    memberEmails:  [createdBy],
    chats:         0,
    createdBy,
    createdByName: createdByName || createdBy,
    description:   description   || `Discussing "${name}" together!`,
    createdAt:     nowISO(),
  };

  crews.unshift(crew);
  crewMessages.set(crew.id, []);
  res.json({ success: true, crew });
});

// POST /api/social/crews/:id/join
router.post('/crews/:id/join', (req, res) => {
  const { userEmail } = req.body;
  const crew = crews.find(c => c.id === req.params.id);
  if (!crew) return res.status(404).json({ success: false, message: 'Crew not found' });

  if (userEmail && !crew.memberEmails.includes(userEmail)) {
    crew.memberEmails.push(userEmail);
    crew.members = crew.memberEmails.length;
  }
  res.json({ success: true, members: crew.members, memberEmails: crew.memberEmails });
});

// POST /api/social/crews/:id/leave
router.post('/crews/:id/leave', (req, res) => {
  const { userEmail } = req.body;
  const crew = crews.find(c => c.id === req.params.id);
  if (!crew) return res.status(404).json({ success: false, message: 'Crew not found' });

  if (userEmail) {
    crew.memberEmails = crew.memberEmails.filter(e => e !== userEmail);
    crew.members = Math.max(0, crew.memberEmails.length);
  }
  res.json({ success: true, members: crew.members });
});

// POST /api/social/crews/:id/message
router.post('/crews/:id/message', (req, res) => {
  const { userId, userName, userEmail, content, type } = req.body;
  if (!content?.trim() || !userName) {
    return res.status(400).json({ success: false, message: 'content and userName required' });
  }

  const crew = crews.find(c => c.id === req.params.id);
  if (crew) crew.chats = (crew.chats || 0) + 1;

  ensureProfile(userEmail, userName);
  const profile = getProfile(userEmail);

  const msg = {
    id:           `msg_${uid()}`,
    userId:       userId || userEmail,
    userName,
    userEmail:    userEmail || '',
    userPhoto:    profile.photo,
    userInitials: profile.initials,
    content:      content.trim(),
    type:         type || 'text',
    timestamp:    nowISO(),
  };

  const msgs = crewMessages.get(req.params.id) || [];
  msgs.push(msg);
  if (msgs.length > 300) msgs.splice(0, msgs.length - 300);
  crewMessages.set(req.params.id, msgs);

  res.json({ success: true, message: withPhoto(msg) });
});

// GET /api/social/crews/:id/messages
router.get('/crews/:id/messages', (req, res) => {
  const msgs = (crewMessages.get(req.params.id) || []).map(withPhoto);
  res.json({ success: true, messages: msgs });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS  — server-side so they survive page reloads
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social/notifications/:email
router.get('/notifications/:email', (req, res) => {
  const email  = decodeURIComponent(req.params.email);
  const notifs = userNotifications.get(email) || [];
  res.json({ success: true, notifications: notifs, unread: notifs.filter(n => !n.read).length });
});

// GET /api/social/notifications/:email/count
router.get('/notifications/:email/count', (req, res) => {
  const email  = decodeURIComponent(req.params.email);
  const notifs = userNotifications.get(email) || [];
  res.json({ success: true, count: notifs.filter(n => !n.read).length });
});

// POST /api/social/notifications/:email/read  — mark all as read
router.post('/notifications/:email/read', (req, res) => {
  const email  = decodeURIComponent(req.params.email);
  const notifs = userNotifications.get(email) || [];
  notifs.forEach(n => { n.read = true; });
  res.json({ success: true });
});

// POST /api/social/notifications/:email/read/:id  — mark single as read
router.post('/notifications/:email/read/:id', (req, res) => {
  const email  = decodeURIComponent(req.params.email);
  const notifs = userNotifications.get(email) || [];
  const notif  = notifs.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
module.exports = router;

// Named exports so other route files (e.g. bookRoutes) can share global crews
module.exports.globalCrews   = crews;
module.exports.userProfiles  = userProfiles;