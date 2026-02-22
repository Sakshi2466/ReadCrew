const express = require('express');
const router = express.Router();

// ─── In-memory global storage (persists while server is up) ─────────────────
// Pre-seeded with demo content so new users immediately see a live community

let globalPosts = [
  {
    id: 'demo1', userName: 'Sakshi', userEmail: 'priya@readcrew.app',
    content: "Just finished 'Atomic Habits' and my mind is blown 🤯 The 1% improvement concept is life-changing. If you haven't read it yet, what are you waiting for?",
    bookName: 'Atomic Habits', author: 'James Clear',
    likes: 24, comments: 5, shares: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo2', userName: 'Sakshi', userEmail: 'rahul@readcrew.app',
    content: "The ending of 'Project Hail Mary' had me in tears. Andy Weir is a genius. Rocky is the best fictional character ever created 🛸",
    bookName: 'Project Hail Mary', author: 'Andy Weir',
    likes: 41, comments: 12, shares: 7,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo3', userName: 'Sakshi', userEmail: 'aisha@readcrew.app',
    content: "3 AM and I can't stop reading 'The Silent Patient'. Who else has been completely wrecked by this book? The twist... I did NOT see that coming 😱",
    bookName: 'The Silent Patient', author: 'Alex Michaelides',
    likes: 67, comments: 23, shares: 11,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo4', userName: 'Unknown', userEmail: 'vikram@readcrew.app',
    content: "Reading 'Sapiens' for the second time. It hits different when you're older. Harari makes you question everything about human civilization 🌍",
    bookName: 'Sapiens', author: 'Yuval Noah Harari',
    likes: 33, comments: 8, shares: 5,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo5', userName: 'Sneha', userEmail: 'sneha@readcrew.app',
    content: "Beach Read by Emily Henry is the perfect summer novel 🌊☀️ It's funny, it's heartfelt, and the slow burn romance is CHEF'S KISS. Highly recommend!",
    bookName: 'Beach Read', author: 'Emily Henry',
    likes: 52, comments: 15, shares: 9,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
  {
    id: 'demo6', userName: 'Arjun', userEmail: 'arjun@readcrew.app',
    content: "Fourth Wing crew where you at? 🐉 Just joined the dragon riders academy and I'm absolutely obsessed. Xaden Riorson can fight me any day 😍",
    bookName: 'Fourth Wing', author: 'Rebecca Yarros',
    likes: 89, comments: 31, shares: 14,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), isPublic: true
  },
];

let globalReviews = [
  {
    id: 'rev1', bookName: 'Atomic Habits', author: 'James Clear', rating: 5,
    review: "This book permanently changed how I think about self-improvement. The concept of identity-based habits is revolutionary. Instead of setting goals, you become the type of person who achieves those goals. Best self-help book I've ever read — practical, science-backed, and beautifully written.",
    sentiment: 'positive', userName: 'Priya Sharma', userEmail: 'priya@readcrew.app',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), likes: 28
  },
  {
    id: 'rev2', bookName: 'The Silent Patient', author: 'Alex Michaelides', rating: 5,
    review: "I stayed up until 4 AM to finish this. The psychological thriller genre has a new king. Alicia's silence is deafening throughout the book, and when the truth finally unravels... I literally gasped out loud. The ending is perfection. A must-read.",
    sentiment: 'positive', userName: 'Aisha Khan', userEmail: 'aisha@readcrew.app',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), likes: 45
  },
  {
    id: 'rev3', bookName: 'Project Hail Mary', author: 'Andy Weir', rating: 5,
    review: "Andy Weir has done it again but better. The science is fascinating (and apparently real!), but what makes this book special is the friendship that develops. I laughed, I cried, I cheered. If you liked The Martian, this is 10x better. Best sci-fi I've read in years.",
    sentiment: 'positive', userName: 'Rahul Mehta', userEmail: 'rahul@readcrew.app',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), likes: 61
  },
  {
    id: 'rev4', bookName: 'It Ends with Us', author: 'Colleen Hoover', rating: 4,
    review: "This book is important. Colleen Hoover tackles a difficult subject with sensitivity and grace. I went through a full box of tissues. It's not an easy read, but it's a necessary one. The title perfectly describes the emotional journey of the protagonist.",
    sentiment: 'positive', userName: 'Sneha Patel', userEmail: 'sneha@readcrew.app',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), likes: 37
  },
  {
    id: 'rev5', bookName: 'The Psychology of Money', author: 'Morgan Housel', rating: 5,
    review: "Every person who earns or spends money should read this book (which is everyone). Housel's 19 short stories about wealth and happiness are more insightful than any finance textbook. My favorite insight: getting rich and staying rich are two different skills. Life-changing perspective.",
    sentiment: 'positive', userName: 'Vikram Nair', userEmail: 'vikram@readcrew.app',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), likes: 52
  },
];

let globalCrews = [
  {
    id: 'crew1', name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help',
    members: 47, chats: 283, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Building better habits together, one tiny change at a time!'
  },
  {
    id: 'crew2', name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi',
    members: 38, chats: 195, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Rocky fan club & science nerd discussion group 🛸'
  },
  {
    id: 'crew3', name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy',
    members: 91, chats: 512, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Dragon riders unite! Discussing all things Basgiath War College 🐉'
  },
  {
    id: 'crew4', name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational',
    members: 63, chats: 341, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Following our Personal Legends together ✨'
  },
  {
    id: 'crew5', name: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller',
    members: 55, chats: 278, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'We need to talk about THAT twist 😱 Spoilers welcome!'
  },
  {
    id: 'crew6', name: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History',
    members: 42, chats: 167, createdBy: 'system', createdByName: 'ReadCrew',
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Questioning everything about humankind since 70,000 BCE 🌍'
  },
];

// ─── GLOBAL COMMENTS STORAGE ─────────────────────────────────────────────────
// Store comments by postId for global access
let globalComments = new Map();

// Pre-seed comments for demo posts
const seedComments = () => {
  const demoComments = [
    {
      id: 'comment1', postId: 'demo1', userId: 'user1', userName: 'Rahul Mehta',
      userEmail: 'rahul@readcrew.app', userInitials: 'RM',
      content: "Completely agree! The 1% rule has helped me build a consistent reading habit.", 
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      parentId: null, likes: 5
    },
    {
      id: 'comment2', postId: 'demo1', userId: 'user2', userName: 'Aisha Khan',
      userEmail: 'aisha@readcrew.app', userInitials: 'AK',
      content: "Which chapter was your favorite? I loved the part about habit stacking!",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      parentId: null, likes: 3
    },
    {
      id: 'comment3', postId: 'demo2', userId: 'user3', userName: 'Arjun',
      userEmail: 'arjun@readcrew.app', userInitials: 'AR',
      content: "Rocky is the best! The scene where they first communicate made me so emotional 😭",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      parentId: null, likes: 8
    },
    {
      id: 'comment4', postId: 'demo3', userId: 'user4', userName: 'Sneha Patel',
      userEmail: 'sneha@readcrew.app', userInitials: 'SP',
      content: "That twist ruined my sleep for a week! Still not over it 🔥",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      parentId: null, likes: 12
    },
    {
      id: 'comment5', postId: 'demo6', userId: 'user5', userName: 'Vikram Nair',
      userEmail: 'vikram@readcrew.app', userInitials: 'VN',
      content: "Team Xaden forever! The tension in this book is unreal 🔥",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      parentId: null, likes: 15
    }
  ];

  demoComments.forEach(comment => {
    const postComments = globalComments.get(comment.postId) || [];
    postComments.push(comment);
    globalComments.set(comment.postId, postComments);
  });
};

seedComments();

// ─── POSTS ───────────────────────────────────────────────────────────────────

// GET /api/social/posts?page=1&limit=20
router.get('/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const posts = globalPosts.slice(start, start + limit);
  
  // Add comment counts to posts
  const postsWithCommentCounts = posts.map(post => {
    const comments = globalComments.get(post.id) || [];
    return {
      ...post,
      commentsCount: comments.length
    };
  });
  
  res.json({ success: true, posts: postsWithCommentCounts, total: globalPosts.length, hasMore: start + limit < globalPosts.length });
});

// GET /api/social/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = globalPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  
  const comments = globalComments.get(post.id) || [];
  res.json({ success: true, post: { ...post, commentsCount: comments.length } });
});

// POST /api/social/posts
router.post('/posts', (req, res) => {
  const { content, bookName, author, image, isPublic, userName, userEmail } = req.body;
  if (!content || !userName) return res.status(400).json({ success: false, message: 'Content and userName required' });
  const post = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    content, bookName: bookName || '', author: author || '',
    image: image || null, isPublic: isPublic !== false,
    userName, userEmail: userEmail || '',
    likes: 0, shares: 0,
    createdAt: new Date().toISOString()
  };
  globalPosts.unshift(post);
  if (globalPosts.length > 500) globalPosts = globalPosts.slice(0, 500);
  
  // Initialize empty comments array for this post
  if (!globalComments.has(post.id)) {
    globalComments.set(post.id, []);
  }
  
  res.json({ success: true, post });
});

// POST /api/social/posts/:id/like
router.post('/posts/:id/like', (req, res) => {
  const post = globalPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false });
  post.likes = (post.likes || 0) + 1;
  res.json({ success: true, likes: post.likes });
});

// ─── COMMENTS ────────────────────────────────────────────────────────────────

// GET /api/social/posts/:id/comments
router.get('/posts/:id/comments', (req, res) => {
  const comments = globalComments.get(req.params.id) || [];
  // Sort by timestamp (newest first? or oldest first? Let's do oldest first for conversation flow)
  const sortedComments = comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json({ success: true, comments: sortedComments });
});

// POST /api/social/posts/:id/comments
router.post('/posts/:id/comments', (req, res) => {
  const { userId, userName, userEmail, userInitials, content, parentId } = req.body;
  const postId = req.params.id;
  
  if (!content || !userName) {
    return res.status(400).json({ success: false, message: 'Content and userName required' });
  }
  
  // Check if post exists
  const post = globalPosts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  
  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    postId,
    userId: userId || `user_${Date.now()}`,
    userName,
    userEmail: userEmail || '',
    userInitials: userInitials || userName.slice(0, 2).toUpperCase(),
    content,
    timestamp: new Date().toISOString(),
    parentId: parentId || null,
    likes: 0
  };
  
  const postComments = globalComments.get(postId) || [];
  postComments.push(comment);
  
  // Keep only last 500 comments per post to prevent memory issues
  if (postComments.length > 500) {
    postComments.splice(0, postComments.length - 500);
  }
  
  globalComments.set(postId, postComments);
  
  res.json({ success: true, comment });
});

// POST /api/social/comments/:id/like
router.post('/comments/:id/like', (req, res) => {
  const commentId = req.params.id;
  let foundComment = null;
  let foundPostId = null;
  
  // Search for the comment across all posts
  for (const [postId, comments] of globalComments.entries()) {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      foundComment = comment;
      foundPostId = postId;
      break;
    }
  }
  
  if (!foundComment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  
  foundComment.likes = (foundComment.likes || 0) + 1;
  
  // Update in storage
  const postComments = globalComments.get(foundPostId);
  const updatedComments = postComments.map(c => 
    c.id === commentId ? foundComment : c
  );
  globalComments.set(foundPostId, updatedComments);
  
  res.json({ success: true, likes: foundComment.likes });
});

// DELETE /api/social/comments/:id
router.delete('/comments/:id', (req, res) => {
  const commentId = req.params.id;
  const { userId } = req.body; // For authorization
  
  let foundPostId = null;
  
  // Search for the comment across all posts
  for (const [postId, comments] of globalComments.entries()) {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      // Check if user is authorized (optional - you can add more logic here)
      foundPostId = postId;
      break;
    }
  }
  
  if (!foundPostId) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  
  // Remove comment and all its replies
  const postComments = globalComments.get(foundPostId);
  const filteredComments = postComments.filter(c => 
    c.id !== commentId && c.parentId !== commentId
  );
  
  globalComments.set(foundPostId, filteredComments);
  
  res.json({ success: true, message: 'Comment deleted' });
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

// GET /api/social/reviews
router.get('/reviews', (req, res) => {
  res.json({ success: true, reviews: globalReviews });
});

// POST /api/social/reviews
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

// POST /api/social/reviews/:id/like
router.post('/reviews/:id/like', (req, res) => {
  const review = globalReviews.find(r => r.id === req.params.id);
  if (!review) return res.status(404).json({ success: false });
  review.likes = (review.likes || 0) + 1;
  res.json({ success: true, likes: review.likes });
});

// ─── CREWS ───────────────────────────────────────────────────────────────────

// GET /api/social/crews
router.get('/crews', (req, res) => {
  res.json({ success: true, crews: globalCrews });
});

// POST /api/social/crews
router.post('/crews', (req, res) => {
  const { name, author, genre, createdBy, createdByName, description } = req.body;
  if (!name || !createdBy) return res.status(400).json({ success: false, message: 'name and createdBy required' });
  // Check if crew for this book already exists
  const existing = globalCrews.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return res.json({ success: true, crew: existing, alreadyExists: true });
  const crew = {
    id: `crew_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name, author: author || '', genre: genre || 'General',
    members: 1, chats: 0, createdBy, createdByName: createdByName || createdBy,
    description: description || `Discussing "${name}" together!`,
    createdAt: new Date().toISOString()
  };
  globalCrews.unshift(crew);
  res.json({ success: true, crew });
});

// POST /api/social/crews/:id/join
router.post('/crews/:id/join', (req, res) => {
  const crew = globalCrews.find(c => c.id === req.params.id);
  if (!crew) return res.status(404).json({ success: false });
  crew.members = (crew.members || 1) + 1;
  res.json({ success: true, members: crew.members });
});

// POST /api/social/crews/:id/message — store crew message globally
const crewMessages = new Map();
router.post('/crews/:id/message', (req, res) => {
  const { userId, userName, userInitials, content, type } = req.body;
  if (!content || !userName) return res.status(400).json({ success: false });
  const crew = globalCrews.find(c => c.id === req.params.id);
  if (crew) { crew.chats = (crew.chats || 0) + 1; }
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

// GET /api/social/crews/:id/messages
router.get('/crews/:id/messages', (req, res) => {
  const msgs = crewMessages.get(req.params.id) || [];
  res.json({ success: true, messages: msgs });
});

module.exports = router;
module.exports.globalCrews = globalCrews;