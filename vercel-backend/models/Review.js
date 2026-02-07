const mongoose = require('mongoose');

// Comment Schema (nested within reviews)
const commentSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  comment: { type: String, required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of user emails who liked
  dislikedBy: [{ type: String }], // Array of user emails who disliked
  replies: [this] // Self-referencing for nested replies
}, {
  timestamps: true
});

// Main Review Schema
const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  bookName: { type: String, required: true },
  author: { type: String, required: true },
  review: { type: String, required: true },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'positive' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of user emails who liked
  dislikedBy: [{ type: String }], // Array of user emails who disliked
  comments: [commentSchema] // Nested comments
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);