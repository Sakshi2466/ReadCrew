require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Cache-Control', 'Connection']
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReadCrew App Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    socketIOEnabled: true,
    endpoints: {
      health: '/api/health',
      donations: '/api/donations',
      reviews: '/api/reviews',
      otp: '/api/otp/send-otp',
      recommend: '/api/recommend',
      bookCrews: '/api/book-crews',
      users: '/api/users'
    }
  });
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    groqConfigured: !!process.env.GROQ_API_KEY,
    socketIO: 'enabled'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    groqConfigured: !!process.env.GROQ_API_KEY,
    socketIO: 'enabled'
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const otpRoutes = require('./routes/otp');
const recommendRoutes = require('./routes/recommend');
const bookCrewRoutes = require('./routes/bookCrew');
const userRoutes = require('./routes/user');
const socialRoutes = require('./routes/social');


// Mount routes ONCE (no duplicates!)
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/book-crews', bookCrewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);

// Socket.IO for real-time chat
const CrewMessage = require('./models/CrewMessage');

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  // Join a book crew room
  socket.on('join-crew', (bookName) => {
    socket.join(bookName);
    console.log(`📚 User ${socket.id} joined crew: ${bookName}`);
    socket.to(bookName).emit('user-joined', { bookName });
  });
  
  // Leave a book crew room
  socket.on('leave-crew', (bookName) => {
    socket.leave(bookName);
    console.log(`📚 User ${socket.id} left crew: ${bookName}`);
  });
  
  // Send message
  socket.on('send-message', async (data) => {
    const { bookName, message } = data;
    
    // Broadcast to all users in the crew
    io.to(bookName).emit('new-message', message);
    
    console.log(`💬 Message in ${bookName}:`, message.content?.slice(0, 50));
  });
  
  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.bookName).emit('user-typing', {
      userName: data.userName,
      bookName: data.bookName
    });
  });
  
  socket.on('stop-typing', (data) => {
    socket.to(data.bookName).emit('user-stop-typing', {
      userName: data.userName,
      bookName: data.bookName
    });
  });
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// 404 handler - MUST BE LAST
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💬 Socket.IO enabled for real-time chat`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`📌 Groq AI: ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
});

module.exports = app;