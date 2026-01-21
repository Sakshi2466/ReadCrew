const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ Middleware setup
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ROOT ENDPOINT - Add this section
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReadCrew Backend API is running',
    service: 'Book Recommendation & Sharing Platform',
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/auth/*',
      donations: '/api/donations/*',
      reviews: '/api/reviews/*',
      recommendations: '/api/recommend/*',
      otp: '/api/otp/*',
      health: '/api/health'
    },
    docs: 'https://github.com/Sakshi2466/ReadCrew',
    note: 'For frontend, use API_BASE_URL: https://readcrew.onrender.com/api'
  });
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/readera', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connected');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  console.log('⚠️ Running without database...');
});

// ✅ Import and mount routes correctly
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const recommendRoutes = require('./routes/recommend');
const otpRoutes = require('./routes/otp');

// ✅ Mount routes with correct paths
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/otp', otpRoutes);

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ✅ Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    suggestion: 'Check available endpoints at the root URL: /'
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
  console.log(`📧 OTP system ready`);
  console.log(`🌐 Root URL: http://localhost:${PORT}/`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📝 OTP Endpoint: http://localhost:${PORT}/api/otp/send-otp`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
});