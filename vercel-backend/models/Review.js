const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  bookName: {
    type: String,
    required: [true, 'Please provide book name']
  },
  author: {
    type: String,
    required: [true, 'Please provide author name']
  },
  review: {
    type: String,
    required: [true, 'Please write a review'],
    minlength: 20
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative'],
    default: 'positive'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', ReviewSchema);