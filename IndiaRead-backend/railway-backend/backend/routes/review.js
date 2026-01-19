const express = require('express');
const authMiddleware = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');

const router = express.Router();

// Create review (Protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { bookName, author, review, sentiment, rating } = req.body;
    const userId = req.userId;

    // Validation
    if (!bookName || !author || !review) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    const user = await User.findById(userId);

    const newReview = new Review({
      userId,
      userName: user.name,
      bookName,
      author,
      review,
      sentiment: sentiment || 'positive',
      rating: rating || 5
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search reviews
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    const reviews = await Review.find({
      $or: [
        { bookName: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { review: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark review as helpful (Protected)
router.post('/:id/helpful', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.helpful += 1;
    await review.save();

    res.status(200).json({
      success: true,
      helpful: review.helpful
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;