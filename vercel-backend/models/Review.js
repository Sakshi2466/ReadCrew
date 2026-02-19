// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative'],
    default: 'positive'
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
reviewSchema.index({ userEmail: 1 });
reviewSchema.index({ bookName: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);