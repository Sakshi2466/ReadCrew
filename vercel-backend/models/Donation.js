const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  bookName: {
    type: String,
    required: [true, 'Please provide book name']
  },
  story: {
    type: String,
    required: [true, 'Please share your story']
  },
  image: {
    type: String,
    required: [true, 'Please upload an image']
  },
  likes: {
    type: Number,
    default: 0
  },
  saves: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', DonationSchema);