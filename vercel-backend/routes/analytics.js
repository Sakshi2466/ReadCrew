// routes/analytics.js
// Simple admin analytics — access at /api/analytics/dashboard?key=YOUR_ADMIN_KEY
const express = require('express');
const router = express.Router();

// Import your User model — adjust path if different
let User, Review, Post;
try {
  User = require('../models/User');
  Review = require('../models/Review');
  Post = require('../models/Post');
} catch (err) {
  console.warn('Analytics: some models not found, will skip those stats');
}

const ADMIN_KEY = process.env.ADMIN_KEY || 'readcrew-admin-2026';

// ── Middleware: simple key auth ──────────────────────────────────────────────
const auth = (req, res, next) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized. Add ?key=YOUR_ADMIN_KEY' });
  next();
};

// ── GET /api/analytics/dashboard ─────────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today); thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(today); thisMonth.setDate(1);

    const stats = {};

    if (User) {
      const [total, today_count, week_count, month_count, recent] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: thisWeek } }),
        User.countDocuments({ createdAt: { $gte: thisMonth } }),
        User.find({}, { name: 1, email: 1, createdAt: 1 })
             .sort({ createdAt: -1 })
             .limit(20)
             .lean(),
      ]);

      stats.users = {
        total,
        today: today_count,
        this_week: week_count,
        this_month: month_count,
        recent_signups: recent.map(u => ({
          name: u.name,
          email: u.email,
          joined: new Date(u.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        })),
      };
    }

    if (Review) {
      stats.reviews = {
        total: await Review.countDocuments(),
        this_week: await Review.countDocuments({ createdAt: { $gte: thisWeek } }),
      };
    }

    if (Post) {
      stats.posts = {
        total: await Post.countDocuments(),
        this_week: await Post.countDocuments({ createdAt: { $gte: thisWeek } }),
      };
    }

    // Daily signups for last 14 days
    if (User) {
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(today); day.setDate(today.getDate() - i);
        const next = new Date(day); next.setDate(day.getDate() + 1);
        const count = await User.countDocuments({ createdAt: { $gte: day, $lt: next } });
        days.push({ date: day.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), signups: count });
      }
      stats.daily_signups_14d = days;
    }

    res.json({
      generated_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ...stats,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/users ──────────────────────────────────────────────────
// Full user list
router.get('/users', auth, async (req, res) => {
  if (!User) return res.status(404).json({ error: 'User model not found' });
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const users = await User.find({}, { password: 0 })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const total = await User.countDocuments();
  res.json({ total, page, pages: Math.ceil(total / limit), users });
});

module.exports = router;