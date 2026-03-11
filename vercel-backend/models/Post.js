const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userEmail: String,
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [String],
  timestamp: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  bookName: { type: String, default: '' },
  author: { type: String, default: '' },
  image: { type: String, default: null }, // base64 or URL
  type: { type: String, default: 'post' }, // post | reshare
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [String],
  reshareCount: { type: Number, default: 0 },
  comments: [CommentSchema],
  // Reshare fields
  isReshare: { type: Boolean, default: false },
  originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  originalPost: { type: Object, default: null },
  reshareComment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);