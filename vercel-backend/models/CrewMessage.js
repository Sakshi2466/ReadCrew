const mongoose = require('mongoose');

const crewMessageSchema = new mongoose.Schema({
  crewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookCrew',
    required: true
  },
  bookName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CrewMessage', crewMessageSchema);