// routes/review.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      reviews: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { bookName, author, rating, review, sentiment, userName, userEmail } = req.body;
    
    // Validation
    if (!bookName || !author || !rating || !review || !userName || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: bookName, author, rating, review, userName, userEmail'
      });
    }

    // Create new review
    const newReview = new Review({
      bookName,
      author,
      rating: Number(rating),
      review,
      sentiment: sentiment || 'positive',
      userName,
      userEmail,
      createdAt: new Date()
    });

    await newReview.save();
    
    console.log('✅ Review created:', newReview._id);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: newReview
    });
  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
  }
});

// Get reviews by user email
router.get('/user/:email', async (req, res) => {
  try {
    const reviews = await Review.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      reviews: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update a review
router.put('/:id', async (req, res) => {
  try {
    const { bookName, author, rating, review, sentiment } = req.body;
    
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { bookName, author, rating, review, sentiment },
      { new: true }
    );
    
    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    
    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;