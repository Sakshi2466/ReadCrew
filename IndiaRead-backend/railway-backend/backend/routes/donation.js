const express = require('express');
const authMiddleware = require('../middleware/auth');
const Donation = require('../models/Donation');
const User = require('../models/User');

const router = express.Router();

// Create donation (Protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { bookName, story, image } = req.body;
    const userId = req.userId;

    // Validation
    if (!bookName || !story || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields'
      });
    }

    const user = await User.findById(userId);

    const donation = new Donation({
      userId,
      userName: user.name,
      bookName,
      story,
      image
    });

    await donation.save();

    res.status(201).json({
      success: true,
      message: 'Donation posted successfully',
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.status(200).json({
      success: true,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Like donation (Protected)
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if already liked
    if (donation.likedBy.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already liked'
      });
    }

    donation.likes += 1;
    donation.likedBy.push(req.userId);
    await donation.save();

    res.status(200).json({
      success: true,
      likes: donation.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Save donation (Protected)
router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if already saved
    if (donation.savedBy.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already saved'
      });
    }

    donation.saves += 1;
    donation.savedBy.push(req.userId);
    await donation.save();

    res.status(200).json({
      success: true,
      saves: donation.saves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
