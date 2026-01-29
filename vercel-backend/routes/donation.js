const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json({ success: true, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create donation (PUBLIC - No auth required)
router.post('/', async (req, res) => {
  try {
    const { userName, userEmail, bookName, story, image } = req.body;

    if (!userName || !bookName || !story || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    const newDonation = new Donation({
      userName,
      userEmail,
      bookName,
      story,
      image,
      likes: 0,
      saves: 0,
      shares: 0
    });

    await newDonation.save();

    res.status(201).json({
      success: true,
      message: 'Story shared successfully',
      donation: newDonation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete donation
router.delete('/:id', async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Like donation
router.post('/:id/like', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    donation.likes = (donation.likes || 0) + 1;
    await donation.save();

    res.json({
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

// Save donation
router.post('/:id/save', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    donation.saves = (donation.saves || 0) + 1;
    await donation.save();

    res.json({
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