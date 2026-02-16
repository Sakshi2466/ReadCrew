const mongoose = require('mongoose');

const bookCrewSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true,
    trim: true,
    index: true // Add index
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

// Add compound index for unique book names (case-insensitive)
bookCrewSchema.index({ bookName: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

module.exports = mongoose.model('BookCrew', bookCrewSchema);