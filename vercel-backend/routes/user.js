const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or update user
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, readingGoals } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Update existing user
      user.name = name;
      user.phone = phone || user.phone;
      if (readingGoals) {
        user.readingGoals = { ...user.readingGoals, ...readingGoals };
      }
      await user.save();
      
      return res.json({
        success: true,
        message: 'User updated successfully',
        user
      });
    }

    // Create new user
    user = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      isVerified: true,
      readingGoals: readingGoals || {
        yearly: 0,
        monthly: 0,
        booksRead: [],
        currentStreak: 0
      },
      stats: {
        totalPosts: 0,
        totalReviews: 0,
        totalCrews: 0
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user by email
router.get('/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update reading goals
router.put('/:email/goals', async (req, res) => {
  try {
    const { yearly, monthly } = req.body;
    
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (yearly !== undefined) user.readingGoals.yearly = yearly;
    if (monthly !== undefined) user.readingGoals.monthly = monthly;

    await user.save();

    res.json({
      success: true,
      message: 'Reading goals updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating reading goals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a book to booksRead
router.post('/:email/books', async (req, res) => {
  try {
    const { bookName, author } = req.body;
    
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.readingGoals.booksRead.push({
      bookName,
      author,
      completedAt: new Date()
    });

    // Update streak (simplified - just increment)
    user.readingGoals.currentStreak += 1;

    await user.save();

    res.json({
      success: true,
      message: 'Book added to reading list',
      user
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user stats
router.put('/:email/stats', async (req, res) => {
  try {
    const { totalPosts, totalReviews, totalCrews } = req.body;
    
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (totalPosts !== undefined) user.stats.totalPosts = totalPosts;
    if (totalReviews !== undefined) user.stats.totalReviews = totalReviews;
    if (totalCrews !== undefined) user.stats.totalCrews = totalCrews;

    await user.save();

    res.json({
      success: true,
      message: 'Stats updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Increment stat counters
router.post('/:email/stats/increment', async (req, res) => {
  try {
    const { field } = req.body; // 'totalPosts', 'totalReviews', or 'totalCrews'
    
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (field && user.stats[field] !== undefined) {
      user.stats[field] += 1;
      await user.save();
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error incrementing stat:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;