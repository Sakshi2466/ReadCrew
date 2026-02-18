const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  readingGoals: {
    yearly: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    },
    booksRead: [{
      bookName: String,
      author: String,
      completedAt: Date
    }],
    currentStreak: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    totalCrews: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
userSchema.index({ email: 1 });

// Update lastActive on save
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);