const express = require('express');
const router = express.Router();
const BookCrew = require('../models/BookCrew');
const CrewMessage = require('../models/CrewMessage');

// Get all book crews
router.get('/', async (req, res) => {
  try {
    const crews = await BookCrew.find().sort({ totalMembers: -1, createdAt: -1 });
    res.json({ success: true, crews });
  } catch (error) {
    console.error('❌ Error fetching crews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific crew by book name
router.get('/book/:bookName', async (req, res) => {
  try {
    const crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${req.params.bookName}$`, 'i') }
    });
    
    if (!crew) {
      return res.json({ success: false, message: 'Crew not found' });
    }
    
    res.json({ success: true, crew });
  } catch (error) {
    console.error('❌ Error fetching crew:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or join a crew - IMPROVED
router.post('/join', async (req, res) => {
  try {
    const { bookName, author, userName, userEmail, description, coverImage } = req.body;
    
    console.log('📚 Join request:', { bookName, author, userName, userEmail });
    
    if (!bookName || !author || !userName || !userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Find crew case-insensitively
    let crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${bookName.trim()}$`, 'i') }
    });
    
    if (crew) {
      console.log('✅ Found existing crew:', crew._id);
      
      // Check if user already a member
      const isMember = crew.members.some(m => m.userEmail === userEmail);
      
      if (isMember) {
        console.log('⚠️ User already a member');
        return res.json({ 
          success: true, 
          crew, 
          message: 'You are already a member of this crew!',
          alreadyMember: true
        });
      }
      
      // Add new member
      crew.members.push({
        userName,
        userEmail,
        status: 'reading',
        joinedAt: new Date()
      });
      crew.totalMembers = crew.members.length;
      await crew.save();
      
      console.log('✅ Added member to crew. Total members:', crew.totalMembers);
      
      res.json({ 
        success: true, 
        crew, 
        message: `🎉 You joined ${bookName} Crew! ${crew.totalMembers} members reading together.` 
      });
    } else {
      console.log('📝 Creating new crew...');
      
      // Create new crew
      crew = new BookCrew({
        bookName: bookName.trim(),
        author: author.trim(),
        description: description || '',
        coverImage: coverImage || '',
        members: [{
          userName,
          userEmail,
          status: 'reading',
          joinedAt: new Date()
        }],
        totalMembers: 1
      });
      
      await crew.save();
      
      console.log('✅ Created new crew:', crew._id);
      
      // Send welcome message
      const welcomeMessage = new CrewMessage({
        crewId: crew._id,
        bookName: crew.bookName,
        userName: 'ReadCrew Bot',
        userEmail: 'bot@readcrew.com',
        messageType: 'text',
        content: `Welcome to ${bookName} Crew! 📚 ${userName} just started this crew. Happy reading! 🎉`
      });
      
      await welcomeMessage.save();
      
      res.json({ 
        success: true, 
        crew, 
        message: `🎉 You created ${bookName} Crew! You're the first member!` 
      });
    }
  } catch (error) {
    console.error('❌ Error joining crew:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// Leave a crew
router.post('/leave', async (req, res) => {
  try {
    const { bookName, userEmail } = req.body;
    
    console.log('👋 Leave request:', { bookName, userEmail });
    
    const crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${bookName}$`, 'i') }
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const initialCount = crew.members.length;
    crew.members = crew.members.filter(m => m.userEmail !== userEmail);
    crew.totalMembers = crew.members.length;
    
    if (crew.totalMembers === 0) {
      console.log('🗑️ Deleting crew (no members left)');
      await BookCrew.deleteOne({ _id: crew._id });
      await CrewMessage.deleteMany({ crewId: crew._id });
      return res.json({ success: true, message: 'Crew disbanded (no members left)' });
    }
    
    await crew.save();
    console.log(`✅ User left crew. Members: ${initialCount} → ${crew.totalMembers}`);
    
    res.json({ success: true, message: 'You left the crew' });
  } catch (error) {
    console.error('❌ Error leaving crew:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a crew
router.get('/messages/:bookName', async (req, res) => {
  try {
    const crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${req.params.bookName}$`, 'i') }
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const messages = await CrewMessage.find({ crewId: crew._id })
      .sort({ createdAt: 1 })
      .limit(500); // Last 500 messages
    
    console.log(`📬 Loaded ${messages.length} messages for ${crew.bookName}`);
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a message - IMPROVED
router.post('/messages', async (req, res) => {
  try {
    const { bookName, userName, userEmail, messageType, content, mediaUrl } = req.body;
    
    console.log('💬 Send message:', { bookName, userName, messageType, contentLength: content?.length });
    
    if (!bookName || !userName || !userEmail || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${bookName}$`, 'i') }
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    // Check if user is a member
    const isMember = crew.members.some(m => m.userEmail === userEmail);
    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must be a member to send messages' 
      });
    }
    
    const message = new CrewMessage({
      crewId: crew._id,
      bookName: crew.bookName,
      userName,
      userEmail,
      messageType: messageType || 'text',
      content,
      mediaUrl: mediaUrl || '',
      createdAt: new Date()
    });
    
    await message.save();
    
    console.log('✅ Message saved:', message._id);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// Update member status
router.put('/status', async (req, res) => {
  try {
    const { bookName, userEmail, status } = req.body;
    
    const crew = await BookCrew.findOne({ 
      bookName: { $regex: new RegExp(`^${bookName}$`, 'i') }
    });
    
    if (!crew) {
      return res.status(404).json({ success: false, message: 'Crew not found' });
    }
    
    const member = crew.members.find(m => m.userEmail === userEmail);
    if (member) {
      member.status = status;
      await crew.save();
      console.log(`✅ Updated status for ${userEmail}: ${status}`);
      res.json({ success: true, message: 'Status updated' });
    } else {
      res.status(404).json({ success: false, message: 'Not a member' });
    }
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;