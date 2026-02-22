const express = require('express');
const router = express.Router();

// ─── In-memory global storage ─────────────────────────────────────────────────
let globalPosts = [
  {
    id: 'demo1', userName: 'Priya Sharma', userEmail: 'priya@readcrew.app',
    content: "Just finished \'Atomic Habits\' and my mind is blown 🤯 The 1% improvement concept is life-changing. If you haven\'t read it yet, what are you waiting for?",
    bookName: 'Atomic Habits', author: 'James Clear',
    likes: 24, comments: 5, shares: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo2', userName: 'Rahul Mehta', userEmail: 'rahul@readcrew.app',
    content: "The ending of \'Project Hail Mary\' had me in tears. Andy Weir is a genius. Rocky is the best fictional character ever created 🛸",
    bookName: 'Project Hail Mary', author: 'Andy Weir',
    likes: 41, comments: 12, shares: 7,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo3', userName: 'Aisha Khan', userEmail: 'aisha@readcrew.app',
    content: "3 AM and I can\'t stop reading \'The Silent Patient\'. The twist... I did NOT see that coming 😱",
    bookName: 'The Silent Patient', author: 'Alex Michaelides',
    likes: 67, comments: 23, shares: 11,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo4', userName: 'Vikram Nair', userEmail: 'vikram@readcrew.app',
    content: "Reading \'Sapiens\' for the second time. It hits different when you\'re older 🌍",
    bookName: 'Sapiens', author: 'Yuval Noah Harari',
    likes: 33, comments: 8, shares: 5,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo5', userName: 'Sneha Patel', userEmail: 'sneha@readcrew.app',
    content: "Beach Read by Emily Henry is the perfect summer novel 🌊☀️ Highly recommend!",
    bookName: 'Beach Read', author: 'Emily Henry',
    likes: 52, comments: 15, shares: 9,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo6', userName: 'Arjun Reddy', userEmail: 'arjun@readcrew.app',
    content: "Fourth Wing crew where you at? 🐉 Xaden Riorson can fight me any day 😍",
    bookName: 'Fourth Wing', author: 'Rebecca Yarros',
    likes: 89, comments: 31, shares: 14,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
];

// ─── In-memory comments store (keyed by postId) ───────────────────────────────
const postComments = new Map();

let globalReviews = [
  { id: 'rev1', bookName: 'Atomic Habits', author: 'James Clear', rating: 5, review: "This book permanently changed how I think about self-improvement. Best self-help book I\'ve ever read.", sentiment: 'positive', userName: 'Priya Sharma', userEmail: 'priya@readcrew.app', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), likes: 28 },
  { id: 'rev2', bookName: 'The Silent Patient', author: 'Alex Michaelides', rating: 5, review: "I stayed up until 4 AM to finish this. The ending is perfection. A must-read.", sentiment: 'positive', userName: 'Aisha Khan', userEmail: 'aisha@readcrew.app', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), likes: 45 },
  { id: 'rev3', bookName: 'Project Hail Mary', author: 'Andy Weir', rating: 5, review: "Best sci-fi I\'ve read in years. The friendship that develops is extraordinary.", sentiment: 'positive', userName: 'Rahul Mehta', userEmail: 'rahul@readcrew.app', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), likes: 61 },
  { id: 'rev4', bookName: 'It Ends with Us', author: 'Colleen Hoover', rating: 4, review: "This book is important. Colleen Hoover tackles a difficult subject with sensitivity and grace.", sentiment: 'positive', userName: 'Sneha Patel', userEmail: 'sneha@readcrew.app', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), likes: 37 },
  { id: 'rev5', bookName: 'The Psychology of Money', author: 'Morgan Housel', rating: 5, review: "Every person who earns or spends money should read this book. Life-changing perspective.", sentiment: 'positive', userName: 'Vikram Nair', userEmail: 'vikram@readcrew.app', createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), likes: 52 },
];

let globalCrews = [
  { id: 'crew1', name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', members: 47, chats: 283, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'crew2', name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 38, chats: 195, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'crew3', name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 91, chats: 512, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'crew4', name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', members: 63, chats: 341, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'crew5', name: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', members: 55, chats: 278, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'crew6', name: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', members: 42, chats: 167, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString() },
];

// ─── POSTS ────────────────────────────────────────────────────────────────────

router.get('/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const posts = globalPosts.slice(start, start + limit);
  res.json({ success: true, posts, total: globalPosts.length, hasMore: start + limit < globalPosts.length });
});

router.post('/posts', (req, res) => {
  const { content, story, bookName, author, image, isPublic, userName, userEmail, id } = req.body;
  if (!content && !story) return res.status(400).json({ success: false, message: 'Content required' });
  // Prevent duplicate posts by checking if ID already exists
  const postContent = content || story;
  if (id && globalPosts.find(p => String(p.id) === String(id))) {
    return res.json({ success: true, post: globalPosts.find(p => String(p.id) === String(id)), duplicate: true });
  }
  const post = {
    id: id || `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    content: postContent, story: postContent,
    bookName: bookName || '', author: author || '',
    image: image || null, isPublic: isPublic !== false,
    userName: userName || 'Anonymous', userEmail: userEmail || '',
    likes: 0, comments: 0, shares: 0,
    createdAt: new Date().toISOString()
  };
  globalPosts.unshift(post);
  if (globalPosts.length > 500) globalPosts = globalPosts.slice(0, 500);
  res.json({ success: true, post });
});

router.post('/posts/:id/like', (req, res) => {
  const post = globalPosts.find(p => String(p.id) === String(req.params.id));
  if (!post) return res.status(404).json({ success: false });
  post.likes = (post.likes || 0) + 1;
  res.json({ success: true, likes: post.likes });
});

// ─── COMMENTS (PUBLIC — persisted on backend, visible to all users) ───────────

// GET /api/social/posts/:id/comments
router.get('/posts/:id/comments', (req, res) => {
  const comments = postComments.get(req.params.id) || [];
  res.json({ success: true, comments, count: comments.length });
});

// POST /api/social/posts/:id/comment
router.post('/posts/:id/comment', (req, res) => {
  const { id, userId, userName, userEmail, content, timestamp, parentId, likes, isAuthor } = req.body;
  if (!content || !userName) return res.status(400).json({ success: false, message: 'content and userName required' });
  const commentId = id || `cmt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const comment = {
    id: commentId, postId: req.params.id,
    userId, userName, userEmail,
    content, timestamp: timestamp || new Date().toISOString(),
    parentId: parentId || null,
    likes: likes || 0, likedBy: [],
    isAuthor: isAuthor || false
  };
  const existing = postComments.get(req.params.id) || [];
  // Prevent duplicate comments
  if (!existing.find(c => String(c.id) === String(commentId))) {
    existing.push(comment);
    if (existing.length > 200) existing.splice(0, existing.length - 200);
    postComments.set(req.params.id, existing);
    // Update comment count on post
    const post = globalPosts.find(p => String(p.id) === String(req.params.id));
    if (post) post.comments = existing.length;
  }
  res.json({ success: true, comment });
});

// POST /api/social/posts/:id/comments/:commentId/like
router.post('/posts/:id/comments/:commentId/like', (req, res) => {
  const comments = postComments.get(req.params.id) || [];
  const comment = comments.find(c => String(c.id) === String(req.params.commentId));
  if (!comment) return res.status(404).json({ success: false });
  comment.likes = (comment.likes || 0) + 1;
  res.json({ success: true, likes: comment.likes });
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

router.get('/reviews', (req, res) => {
  res.json({ success: true, reviews: globalReviews });
});

router.post('/reviews', (req, res) => {
  const { bookName, author, rating, review, sentiment, userName, userEmail } = req.body;
  if (!bookName || !review || !userName) return res.status(400).json({ success: false, message: 'bookName, review, userName required' });
  const reviewData = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    bookName, author: author || '', rating: rating || 5, review,
    sentiment: sentiment || 'positive', userName, userEmail: userEmail || '',
    createdAt: new Date().toISOString(), likes: 0
  };
  globalReviews.unshift(reviewData);
  if (globalReviews.length > 200) globalReviews = globalReviews.slice(0, 200);
  res.json({ success: true, review: reviewData });
});

router.post('/reviews/:id/like', (req, res) => {
  const review = globalReviews.find(r => r.id === req.params.id);
  if (!review) return res.status(404).json({ success: false });
  review.likes = (review.likes || 0) + 1;
  res.json({ success: true, likes: review.likes });
});

// ─── CREWS ────────────────────────────────────────────────────────────────────

router.get('/crews', (req, res) => {
  res.json({ success: true, crews: globalCrews });
});

router.post('/crews', (req, res) => {
  const { name, author, genre, createdBy, createdByName, id } = req.body;
  if (!name || !createdBy) return res.status(400).json({ success: false, message: 'name and createdBy required' });
  const existing = globalCrews.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return res.json({ success: true, crew: existing, alreadyExists: true });
  const crew = {
    id: id || `crew_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name, author: author || '', genre: genre || 'General',
    members: 1, chats: 0, createdBy, createdByName: createdByName || createdBy,
    createdAt: new Date().toISOString()
  };
  globalCrews.unshift(crew);
  res.json({ success: true, crew });
});

router.post('/crews/:id/join', (req, res) => {
  const crew = globalCrews.find(c => String(c.id) === String(req.params.id));
  if (!crew) return res.status(404).json({ success: false });
  crew.members = (crew.members || 1) + 1;
  res.json({ success: true, members: crew.members });
});

const crewMessages = new Map();

router.post('/crews/:id/message', (req, res) => {
  const { userId, userName, userInitials, content, type } = req.body;
  if (!content || !userName) return res.status(400).json({ success: false });
  const crew = globalCrews.find(c => String(c.id) === String(req.params.id));
  if (crew) crew.chats = (crew.chats || 0) + 1;
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId, userName, userInitials, content, type: type || 'text',
    timestamp: new Date().toISOString()
  };
  const msgs = crewMessages.get(req.params.id) || [];
  msgs.push(msg);
  if (msgs.length > 200) msgs.splice(0, msgs.length - 200);
  crewMessages.set(req.params.id, msgs);
  res.json({ success: true, message: msg });
});

router.get('/crews/:id/messages', (req, res) => {
  const msgs = crewMessages.get(req.params.id) || [];
  res.json({ success: true, messages: msgs });
});

module.exports = router;
module.exports.globalCrews = globalCrews;