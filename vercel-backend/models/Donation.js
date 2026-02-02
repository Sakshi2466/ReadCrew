const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  bookName: { type: String, required: true },
  story: { type: String, required: true },
  image: { type: String, required: true },
  likes: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);