const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Store user likes in memory (or use Redis in production)
const userLikes = new Map(); // Format: Map<reviewId, Set<userEmail>>

// Get all reviews (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    // Get user email from query for checking likes (optional)
    const userEmail = req.query.userEmail;
    
    const reviewsWithUserData = reviews.map(review => {
      const reviewObj = review.toObject();
      
      // Check if current user has liked this review
      if (userEmail && userLikes.get(review._id.toString())?.has(userEmail)) {
        reviewObj.userLiked = true;
      } else {
        reviewObj.userLiked = false;
      }
      
      // Check if current user is the author of this review
      reviewObj.isAuthor = userEmail === review.userEmail;
      
      return reviewObj;
    });
    
    console.log(`✅ Retrieved ${reviews.length} reviews from database`);
    
    res.status(200).json({
      success: true,
      reviews: reviewsWithUserData,
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
      rating: rating || 5,
      likes: 0,
      likedBy: [] // Store user emails who liked
    });

    await newReview.save();

    console.log('✅ Review created successfully:', newReview._id);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review: {
        ...newReview.toObject(),
        userLiked: false,
        isAuthor: true
      }
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
    const { query, userEmail } = req.query;
    
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
    
    // Add user-specific data
    const reviewsWithUserData = reviews.map(review => {
      const reviewObj = review.toObject();
      
      if (userEmail && userLikes.get(review._id.toString())?.has(userEmail)) {
        reviewObj.userLiked = true;
      } else {
        reviewObj.userLiked = false;
      }
      
      reviewObj.isAuthor = userEmail === review.userEmail;
      
      return reviewObj;
    });
    
    res.status(200).json({
      success: true,
      reviews: reviewsWithUserData,
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

// Like/Unlike review (USER SPECIFIC)
router.post('/:id/like', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to like a review'
      });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is trying to like their own review
    if (review.userEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot like your own review'
      });
    }

    // Initialize like tracking for this review
    if (!userLikes.has(review._id.toString())) {
      userLikes.set(review._id.toString(), new Set());
    }
    
    const reviewLikes = userLikes.get(review._id.toString());
    
    // Check if user already liked this review
    if (reviewLikes.has(userEmail)) {
      // Unlike: remove like
      reviewLikes.delete(userEmail);
      review.likes = Math.max(0, (review.likes || 0) - 1);
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review unliked',
        likes: review.likes,
        liked: false
      });
    } else {
      // Like: add like
      reviewLikes.add(userEmail);
      review.likes = (review.likes || 0) + 1;
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review liked',
        likes: review.likes,
        liked: true
      });
    }
  } catch (error) {
    console.error('❌ Error liking review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark review as helpful (PUBLIC - keeps old functionality)
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

// Delete review (ONLY AUTHOR CAN DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to delete a review'
      });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the author
    if (review.userEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Delete from database
    await Review.findByIdAndDelete(req.params.id);
    
    // Clean up likes tracking
    userLikes.delete(req.params.id);

    console.log('✅ Review deleted by author:', req.params.id);

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

// Get user's reviews (for profile page)
router.get('/user/:userEmail', async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    
    const reviews = await Review.find({ userEmail }).sort({ createdAt: -1 });
    
    // Add user-specific data
    const reviewsWithUserData = reviews.map(review => {
      const reviewObj = review.toObject();
      
      if (userLikes.get(review._id.toString())?.has(userEmail)) {
        reviewObj.userLiked = true;
      } else {
        reviewObj.userLiked = false;
      }
      
      reviewObj.isAuthor = true; // Always true for user's own reviews
      
      return reviewObj;
    });
    
    res.status(200).json({
      success: true,
      reviews: reviewsWithUserData,
      count: reviews.length
    });
  } catch (error) {
    console.error('❌ Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;