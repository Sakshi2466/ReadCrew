const mongoose = require('mongoose');

const bookCrewSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  members: [{
    userId: String,
    userName: String,
    userEmail: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['reading', 'completed', 'planning'],
      default: 'reading'
    }
  }],
  totalMembers: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BookCrew', bookCrewSchema);