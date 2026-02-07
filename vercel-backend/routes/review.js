const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Helper function to add user-specific data to reviews
const addUserDataToReview = (review, userEmail) => {
  const reviewObj = review.toObject();
  
  // Check if user liked/disliked the review
  reviewObj.userLiked = userEmail ? reviewObj.likedBy.includes(userEmail) : false;
  reviewObj.userDisliked = userEmail ? reviewObj.dislikedBy.includes(userEmail) : false;
  reviewObj.isAuthor = userEmail === reviewObj.userEmail;
  
  // Process comments if they exist
  if (reviewObj.comments && reviewObj.comments.length > 0) {
    reviewObj.comments = reviewObj.comments.map(comment => {
      comment.userLiked = userEmail ? comment.likedBy.includes(userEmail) : false;
      comment.userDisliked = userEmail ? comment.dislikedBy.includes(userEmail) : false;
      comment.isAuthor = userEmail === comment.userEmail;
      
      // Process nested replies
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = comment.replies.map(reply => {
          reply.userLiked = userEmail ? reply.likedBy.includes(userEmail) : false;
          reply.userDisliked = userEmail ? reply.dislikedBy.includes(userEmail) : false;
          reply.isAuthor = userEmail === reply.userEmail;
          return reply;
        });
      }
      
      return comment;
    });
  }
  
  return reviewObj;
};

// ============================================
// REVIEW ROUTES
// ============================================

// Get all reviews (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    const userEmail = req.query.userEmail;
    
    const reviewsWithUserData = reviews.map(review => 
      addUserDataToReview(review, userEmail)
    );
    
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
      dislikes: 0,
      shares: 0,
      helpful: 0,
      likedBy: [],
      dislikedBy: [],
      comments: []
    });

    await newReview.save();

    console.log('✅ Review created successfully:', newReview._id);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review: addUserDataToReview(newReview, userEmail)
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
    
    const reviewsWithUserData = reviews.map(review => 
      addUserDataToReview(review, userEmail)
    );
    
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

// Like review (toggle)
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

    const hasLiked = review.likedBy.includes(userEmail);
    const hasDisliked = review.dislikedBy.includes(userEmail);

    if (hasLiked) {
      // Unlike
      review.likedBy = review.likedBy.filter(email => email !== userEmail);
      review.likes = Math.max(0, review.likes - 1);
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review unliked',
        likes: review.likes,
        dislikes: review.dislikes,
        liked: false,
        disliked: false
      });
    } else {
      // If disliked, remove dislike first
      if (hasDisliked) {
        review.dislikedBy = review.dislikedBy.filter(email => email !== userEmail);
        review.dislikes = Math.max(0, review.dislikes - 1);
      }
      
      // Add like
      review.likedBy.push(userEmail);
      review.likes = review.likes + 1;
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review liked',
        likes: review.likes,
        dislikes: review.dislikes,
        liked: true,
        disliked: false
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

// Dislike review (toggle)
router.post('/:id/dislike', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to dislike a review'
      });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is trying to dislike their own review
    if (review.userEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot dislike your own review'
      });
    }

    const hasLiked = review.likedBy.includes(userEmail);
    const hasDisliked = review.dislikedBy.includes(userEmail);

    if (hasDisliked) {
      // Remove dislike
      review.dislikedBy = review.dislikedBy.filter(email => email !== userEmail);
      review.dislikes = Math.max(0, review.dislikes - 1);
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Dislike removed',
        likes: review.likes,
        dislikes: review.dislikes,
        liked: false,
        disliked: false
      });
    } else {
      // If liked, remove like first
      if (hasLiked) {
        review.likedBy = review.likedBy.filter(email => email !== userEmail);
        review.likes = Math.max(0, review.likes - 1);
      }
      
      // Add dislike
      review.dislikedBy.push(userEmail);
      review.dislikes = review.dislikes + 1;
      
      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Review disliked',
        likes: review.likes,
        dislikes: review.dislikes,
        liked: false,
        disliked: true
      });
    }
  } catch (error) {
    console.error('❌ Error disliking review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Share review (increment share count)
router.post('/:id/share', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.shares = (review.shares || 0) + 1;
    await review.save();

    console.log(`✅ Review shared: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Review shared successfully',
      shares: review.shares
    });
  } catch (error) {
    console.error('❌ Error sharing review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark review as helpful
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

    await Review.findByIdAndDelete(req.params.id);

    console.log('✅ Review deleted by author:', req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
      deletedReviewId: req.params.id
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
    
    const reviewsWithUserData = reviews.map(review => 
      addUserDataToReview(review, userEmail)
    );
    
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

// ============================================
// COMMENT ROUTES
// ============================================

// Add comment to review
router.post('/:id/comments', async (req, res) => {
  try {
    const { userName, userEmail, comment } = req.body;
    
    if (!userName || !userEmail || !comment) {
      return res.status(400).json({
        success: false,
        message: 'userName, userEmail, and comment are required'
      });
    }

    if (comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 3 characters long'
      });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const newComment = {
      userName,
      userEmail,
      comment,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replies: []
    };

    review.comments.push(newComment);
    await review.save();

    console.log('✅ Comment added to review:', req.params.id);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      review: addUserDataToReview(review, userEmail)
    });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete comment (ONLY AUTHOR CAN DELETE)
router.delete('/:reviewId/comments/:commentId', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to delete a comment'
      });
    }

    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const comment = review.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the comment author
    if (comment.userEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    comment.deleteOne();
    await review.save();

    console.log('✅ Comment deleted:', req.params.commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      review: addUserDataToReview(review, userEmail)
    });
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Like comment (toggle)
router.post('/:reviewId/comments/:commentId/like', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const comment = review.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is trying to like their own comment
    if (comment.userEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot like your own comment'
      });
    }

    const hasLiked = comment.likedBy.includes(userEmail);
    const hasDisliked = comment.dislikedBy.includes(userEmail);

    if (hasLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(email => email !== userEmail);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Remove dislike if exists
      if (hasDisliked) {
        comment.dislikedBy = comment.dislikedBy.filter(email => email !== userEmail);
        comment.dislikes = Math.max(0, comment.dislikes - 1);
      }
      
      // Add like
      comment.likedBy.push(userEmail);
      comment.likes = comment.likes + 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? 'Comment unliked' : 'Comment liked',
      likes: comment.likes,
      dislikes: comment.dislikes,
      liked: !hasLiked,
      disliked: false
    });
  } catch (error) {
    console.error('❌ Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Dislike comment (toggle)
router.post('/:reviewId/comments/:commentId/dislike', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const comment = review.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is trying to dislike their own comment
    if (comment.userEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot dislike your own comment'
      });
    }

    const hasLiked = comment.likedBy.includes(userEmail);
    const hasDisliked = comment.dislikedBy.includes(userEmail);

    if (hasDisliked) {
      // Remove dislike
      comment.dislikedBy = comment.dislikedBy.filter(email => email !== userEmail);
      comment.dislikes = Math.max(0, comment.dislikes - 1);
    } else {
      // Remove like if exists
      if (hasLiked) {
        comment.likedBy = comment.likedBy.filter(email => email !== userEmail);
        comment.likes = Math.max(0, comment.likes - 1);
      }
      
      // Add dislike
      comment.dislikedBy.push(userEmail);
      comment.dislikes = comment.dislikes + 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: hasDisliked ? 'Dislike removed' : 'Comment disliked',
      likes: comment.likes,
      dislikes: comment.dislikes,
      liked: false,
      disliked: !hasDisliked
    });
  } catch (error) {
    console.error('❌ Error disliking comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add reply to comment
router.post('/:reviewId/comments/:commentId/replies', async (req, res) => {
  try {
    const { userName, userEmail, comment } = req.body;
    
    if (!userName || !userEmail || !comment) {
      return res.status(400).json({
        success: false,
        message: 'userName, userEmail, and comment are required'
      });
    }

    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const parentComment = review.comments.id(req.params.commentId);
    
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const newReply = {
      userName,
      userEmail,
      comment,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replies: []
    };

    parentComment.replies.push(newReply);
    await review.save();

    console.log('✅ Reply added to comment:', req.params.commentId);

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: newReply,
      review: addUserDataToReview(review, userEmail)
    });
  } catch (error) {
    console.error('❌ Error adding reply:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;