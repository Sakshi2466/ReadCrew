const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
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
  story: {
    type: String,
    required: [true, 'Please share your story'],
    minlength: 10
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
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', DonationSchema);