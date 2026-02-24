// routes/authRoutes.js — Server-side user accounts (fixes cross-device login)
'use strict';

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const crypto   = require('crypto');

// ─── USER SCHEMA ─────────────────────────────────────────────────────────────
// Only create if it doesn't exist (avoids the duplicate index warning)
let User;
try {
  User = mongoose.model('User');
} catch {
  const userSchema = new mongoose.Schema({
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, trim: true, lowercase: true },
    password:   { type: String },                 // hashed
    createdAt:  { type: Date, default: Date.now },
    bio:        { type: String, default: '' },
    readingGoal:{ yearly: { type: Number, default: 0 }, monthly: { type: Number, default: 0 } },
    stats:      { booksRead: Number, reviewsGiven: Number, postsCreated: Number, crewsJoined: Number },
    profileImage: { type: String, default: null },
  }, { collection: 'users' });

  // Only index once
  userSchema.index({ email: 1 }, { unique: true });
  User = mongoose.model('User', userSchema);
}

// Simple hash (no bcrypt needed, just a consistent hash for passwords)
const hashPw = (pw) => pw
  ? crypto.createHash('sha256').update(pw + 'readcrew_salt_2026').digest('hex')
  : '';

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Called after OTP verification — saves user to MongoDB
router.post('/register', async (req, res) => {
  const { name, email, password, readingGoal } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // Return existing user (re-registration after browser clear)
      const userData = {
        id:          existing._id.toString(),
        name:        existing.name,
        email:       existing.email,
        bio:         existing.bio || '',
        readingGoal: existing.readingGoal || { yearly: 0, monthly: 0 },
        stats:       existing.stats || { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
        profileImage:existing.profileImage || null,
        isVerified:  true,
        joinedCrews: [],
        likedPosts:  [],
        savedPosts:  [],
      };
      return res.json({ success: true, user: userData, existing: true });
    }

    const user = await User.create({
      name:        name.trim(),
      email:       email.toLowerCase().trim(),
      password:    hashPw(password || ''),
      readingGoal: readingGoal || { yearly: 0, monthly: 0 },
      stats:       { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
    });

    const userData = {
      id:          user._id.toString(),
      name:        user.name,
      email:       user.email,
      bio:         '',
      readingGoal: user.readingGoal,
      stats:       user.stats,
      profileImage:null,
      isVerified:  true,
      joinedCrews: [],
      likedPosts:  [],
      savedPosts:  [],
    };

    console.log(`✅ New user registered: ${user.email}`);
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed — please try again' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Email + password login — works on any device, any browser
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email. Please sign up first.' });
    }

    // Check password (allow empty password if user signed up without one)
    const hashedInput = hashPw(password || '');
    const storedHash  = user.password || '';

    // Accept if: passwords match OR account has no password (OTP-only signup)
    const passwordOk = !storedHash || storedHash === hashedInput;
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const userData = {
      id:          user._id.toString(),
      name:        user.name,
      email:       user.email,
      bio:         user.bio || '',
      readingGoal: user.readingGoal || { yearly: 0, monthly: 0 },
      stats:       user.stats || { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      profileImage:user.profileImage || null,
      isVerified:  true,
      joinedCrews: [],
      likedPosts:  [],
      savedPosts:  [],
    };

    console.log(`✅ User logged in: ${user.email}`);
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed — please try again' });
  }
});

// ─── GET /api/auth/check/:email ───────────────────────────────────────────────
// Quick check — does this email have an account?
router.get('/check/:email', async (req, res) => {
  try {
    const exists = await User.exists({ email: req.params.email.toLowerCase().trim() });
    res.json({ success: true, exists: !!exists });
  } catch {
    res.json({ success: true, exists: false });
  }
});

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
// Update profile bio, name, readingGoal, profileImage
router.patch('/profile', async (req, res) => {
  const { email, name, bio, readingGoal, profileImage, stats } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'email required' });

  try {
    const updates = {};
    if (name        !== undefined) updates.name         = name;
    if (bio         !== undefined) updates.bio          = bio;
    if (readingGoal !== undefined) updates.readingGoal  = readingGoal;
    if (profileImage!== undefined) updates.profileImage = profileImage;
    if (stats       !== undefined) updates.stats        = stats;

    await User.updateOne({ email: email.toLowerCase() }, { $set: updates });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;