const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Store user interactions in memory (use Redis in production)
const userLikes = new Map(); // Format: Map<donationId, Set<userEmail>>
const userSaves = new Map(); // Format: Map<donationId, Set<userEmail>>

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    // Get user email from query for checking interactions (optional)
    const userEmail = req.query.userEmail;
    
    const donationsWithUserData = donations.map(donation => {
      const donationObj = donation.toObject();
      
      // Check if current user has liked this donation
      if (userEmail && userLikes.get(donation._id.toString())?.has(userEmail)) {
        donationObj.userLiked = true;
      } else {
        donationObj.userLiked = false;
      }
      
      // Check if current user has saved this donation
      if (userEmail && userSaves.get(donation._id.toString())?.has(userEmail)) {
        donationObj.userSaved = true;
      } else {
        donationObj.userSaved = false;
      }
      
      // Check if current user is the author of this donation
      donationObj.isAuthor = userEmail === donation.userEmail;
      
      return donationObj;
    });

    res.json({ 
      success: true, 
      donations: donationsWithUserData 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
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
      userEmail: userEmail || '',
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
      donation: {
        ...newDonation.toObject(),
        userLiked: false,
        userSaved: false,
        isAuthor: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete donation (ONLY AUTHOR CAN DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to delete a donation'
      });
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if user is the author
    if (donation.userEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own donations'
      });
    }

    // Delete from database
    await Donation.findByIdAndDelete(req.params.id);
    
    // Clean up interaction tracking
    userLikes.delete(req.params.id);
    userSaves.delete(req.params.id);

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

// Like/Unlike donation (USER SPECIFIC - ONE LIKE PER USER)
router.post('/:id/like', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to like a donation'
      });
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if user is trying to like their own donation
    if (donation.userEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot like your own donation'
      });
    }

    // Initialize like tracking for this donation
    if (!userLikes.has(donation._id.toString())) {
      userLikes.set(donation._id.toString(), new Set());
    }
    
    const donationLikes = userLikes.get(donation._id.toString());
    
    // Check if user already liked this donation
    if (donationLikes.has(userEmail)) {
      // Unlike: remove like
      donationLikes.delete(userEmail);
      donation.likes = Math.max(0, (donation.likes || 0) - 1);
      
      await donation.save();
      
      return res.json({
        success: true,
        message: 'Donation unliked',
        likes: donation.likes,
        liked: false
      });
    } else {
      // Like: add like
      donationLikes.add(userEmail);
      donation.likes = (donation.likes || 0) + 1;
      
      await donation.save();
      
      return res.json({
        success: true,
        message: 'Donation liked',
        likes: donation.likes,
        liked: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Save/Unsave donation (USER SPECIFIC - ONE SAVE PER USER)
router.post('/:id/save', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to save a donation'
      });
    }

    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Initialize save tracking for this donation
    if (!userSaves.has(donation._id.toString())) {
      userSaves.set(donation._id.toString(), new Set());
    }
    
    const donationSaves = userSaves.get(donation._id.toString());
    
    // Check if user already saved this donation
    if (donationSaves.has(userEmail)) {
      // Unsave: remove save
      donationSaves.delete(userEmail);
      donation.saves = Math.max(0, (donation.saves || 0) - 1);
      
      await donation.save();
      
      return res.json({
        success: true,
        message: 'Donation unsaved',
        saves: donation.saves,
        saved: false
      });
    } else {
      // Save: add save
      donationSaves.add(userEmail);
      donation.saves = (donation.saves || 0) + 1;
      
      await donation.save();
      
      return res.json({
        success: true,
        message: 'Donation saved',
        saves: donation.saves,
        saved: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Share donation (anyone can share)
router.post('/:id/share', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    donation.shares = (donation.shares || 0) + 1;
    await donation.save();

    res.json({
      success: true,
      shares: donation.shares
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's donations (for profile page)
router.get('/user/:userEmail', async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    
    const donations = await Donation.find({ userEmail }).sort({ createdAt: -1 });
    
    // Add user-specific data
    const donationsWithUserData = donations.map(donation => {
      const donationObj = donation.toObject();
      
      if (userLikes.get(donation._id.toString())?.has(userEmail)) {
        donationObj.userLiked = true;
      } else {
        donationObj.userLiked = false;
      }
      
      if (userSaves.get(donation._id.toString())?.has(userEmail)) {
        donationObj.userSaved = true;
      } else {
        donationObj.userSaved = false;
      }
      
      donationObj.isAuthor = true; // Always true for user's own donations
      
      return donationObj;
    });
    
    res.status(200).json({
      success: true,
      donations: donationsWithUserData,
      count: donations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;