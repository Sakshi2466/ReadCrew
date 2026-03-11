const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// ─── GET all posts (newest first) ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET single post ──────────────────────────────────────────────────────────
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── CREATE post ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { content, bookName, author, image, type, userName, userEmail,
            isReshare, originalPostId, originalPost, reshareComment } = req.body;

    if (!content || !userName || !userEmail) {
      return res.status(400).json({ success: false, error: 'content, userName, userEmail are required' });
    }

    const post = new Post({
      content, bookName, author, image, type: type || 'post',
      userName, userEmail,
      isReshare: isReshare || false,
      originalPostId: originalPostId || null,
      originalPost: originalPost || null,
      reshareComment: reshareComment || ''
    });

    await post.save();

    // If resharing, increment the original post's reshareCount
    if (isReshare && originalPostId) {
      await Post.findByIdAndUpdate(originalPostId, { $inc: { reshareCount: 1 } });
    }

    // Emit to all connected socket clients
    if (req.app.get('io')) {
      req.app.get('io').emit('new_post', post);
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── LIKE a post ──────────────────────────────────────────────────────────────
router.post('/:postId/like', async (req, res) => {
  try {
    const { userEmail, userName } = req.body;
    if (!userEmail) return res.status(400).json({ success: false, error: 'userEmail required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    // Toggle like
    const alreadyLiked = post.likedBy.includes(userEmail);
    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(e => e !== userEmail);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userEmail);
      post.likes += 1;
    }

    await post.save();

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('post_liked', {
        postId: post._id,
        likes: post.likes,
        likedBy: post.likedBy,
        action: alreadyLiked ? 'unlike' : 'like'
      });
    }

    res.json({ success: true, likes: post.likes, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ADD comment ─────────────────────────────────────────────────────────────
router.post('/:postId/comments', async (req, res) => {
  try {
    const { userId, userName, userEmail, content } = req.body;
    if (!content || !userEmail) return res.status(400).json({ success: false, error: 'content and userEmail required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const comment = { userId, userName, userEmail, content, timestamp: new Date() };
    post.comments.push(comment);
    await post.save();

    const savedComment = post.comments[post.comments.length - 1];

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('new_comment', { postId: post._id, comment: savedComment });
    }

    res.status(201).json({ success: true, comment: savedComment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE a post ────────────────────────────────────────────────────────────
router.delete('/:postId', async (req, res) => {
  try {
    const { userEmail } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (post.userEmail !== userEmail) return res.status(403).json({ success: false, error: 'Not authorized' });

    await Post.findByIdAndDelete(req.params.postId);

    if (req.app.get('io')) {
      req.app.get('io').emit('post_deleted', { postId: req.params.postId });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── RESHARE a post ───────────────────────────────────────────────────────────
router.post('/:postId/reshare', async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { reshareCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;