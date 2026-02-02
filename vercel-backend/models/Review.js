const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  bookName: { type: String, required: true },
  author: { type: String, required: true },
  review: { type: String, required: true },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'positive' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  likes: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  likedBy: [{ type: String }] // Store user emails who liked
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);