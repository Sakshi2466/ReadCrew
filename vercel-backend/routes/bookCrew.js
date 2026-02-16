const express = require('express');
const router = express.Router();
const BookCrew = require('../models/BookCrew');
const CrewMessage = require('../models/CrewMessage');

// Get all book crews
router.get('/', async (req, res) => {
  try {
    const crews = await BookCrew.find().sort({ totalMembers: -1 });
    res.json({ success: true, crews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific crew by book name
router.get('/book/:bookName', async (req, res) => {
  try {
    const crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${req.params.bookName}$`, 'i') 
    });
    
    if (!crew) {
      return res.json({ success: false, message: 'Crew not found' });
    }
    
    res.json({ success: true, crew });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or join a crew
router.post('/join', async (req, res) => {
  try {
    const { bookName, author, userName, userEmail, description, coverImage } = req.body;
    
    let crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${bookName}$`, 'i') 
    });
    
    if (crew) {
      // Check if user already a member
      const isMember = crew.members.some(m => m.userEmail === userEmail);
      
      if (isMember) {
        return res.json({ 
          success: true, 
          crew, 
          message: 'Already a member of this crew' 
        });
      }
      
      // Add new member
      crew.members.push({
        userName,
        userEmail,
        status: 'reading'
      });
      crew.totalMembers = crew.members.length;
      await crew.save();
      
      res.json({ 
        success: true, 
        crew, 
        message: `Joined ${bookName} Crew!` 
      });
    } else {
      // Create new crew
      crew = new BookCrew({
        bookName,
        author,
        description: description || '',
        coverImage: coverImage || '',
        members: [{
          userName,
          userEmail,
          status: 'reading'
        }],
        totalMembers: 1
      });
      
      await crew.save();
      
      res.json({ 
        success: true, 
        crew, 
        message: `Created ${bookName} Crew! You're the first member!` 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Leave a crew
router.post('/leave', async (req, res) => {
  try {
    const { bookName, userEmail } = req.body;
    
    const crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${bookName}$`, 'i') 
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    crew.members = crew.members.filter(m => m.userEmail !== userEmail);
    crew.totalMembers = crew.members.length;
    
    // Delete crew if no members left
    if (crew.totalMembers === 0) {
      await BookCrew.deleteOne({ _id: crew._id });
      await CrewMessage.deleteMany({ crewId: crew._id });
      return res.json({ success: true, message: 'Crew disbanded (no members left)' });
    }
    
    await crew.save();
    res.json({ success: true, message: 'Left the crew' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a crew
router.get('/messages/:bookName', async (req, res) => {
  try {
    const crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${req.params.bookName}$`, 'i') 
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const messages = await CrewMessage.find({ crewId: crew._id })
      .sort({ createdAt: 1 })
      .limit(200); // Last 200 messages
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { bookName, userName, userEmail, messageType, content, mediaUrl } = req.body;
    
    const crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${bookName}$`, 'i') 
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const message = new CrewMessage({
      crewId: crew._id,
      bookName: crew.bookName,
      userName,
      userEmail,
      messageType: messageType || 'text',
      content,
      mediaUrl: mediaUrl || ''
    });
    
    await message.save();
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update member status
router.put('/status', async (req, res) => {
  try {
    const { bookName, userEmail, status } = req.body;
    
    const crew = await BookCrew.findOne({ 
      bookName: new RegExp(`^${bookName}$`, 'i') 
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const member = crew.members.find(m => m.userEmail === userEmail);
    if (member) {
      member.status = status;
      await crew.save();
      res.json({ success: true, message: 'Status updated' });
    } else {
      res.status(404).json({ success: false, message: 'Not a member' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;