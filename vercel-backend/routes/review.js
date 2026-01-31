const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Get all reviews (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    console.log(`✅ Retrieved ${reviews.length} reviews from database`);
    
    res.status(200).json({
      success: true,
      reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('❌ Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create review (PUBLIC - No auth required)
router.post('/', async (req, res) => {
  try {
    const { userName, userEmail, bookName, author, review, sentiment, rating } = req.body;

    console.log('📝 Creating review:', { userName, bookName, author, reviewLength: review?.length });

    // Validation
    if (!userName || !bookName || !author || !review) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields (userName, bookName, author, review)'
      });
    }

    // Frontend should handle this, but double-check
    if (review.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Review must be at least 20 characters long'
      });
    }

    const newReview = new Review({
      userName,
      userEmail: userEmail || '',
      bookName,
      author,
      review,
      sentiment: sentiment || 'positive',
      rating: rating || 5
    });

    await newReview.save();

    console.log('✅ Review created successfully:', newReview._id);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search reviews (PUBLIC)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const reviews = await Review.find({
      $or: [
        { bookName: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { review: { $regex: query, $options: 'i' } },
        { userName: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('❌ Error searching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark review as helpful (PUBLIC)
router.post('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.helpful = (review.helpful || 0) + 1;
    await review.save();

    res.status(200).json({
      success: true,
      helpful: review.helpful
    });
  } catch (error) {
    console.error('❌ Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete review (PUBLIC - anyone can delete for now)
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    console.log('✅ Review deleted:', req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;