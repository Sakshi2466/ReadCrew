const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ CORS for Netlify frontend - UPDATE YOUR URL!
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-actual-netlify-url.netlify.app', // CHANGE THIS
    'https://*.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root endpoint
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
    frontend: 'https://your-netlify-url.netlify.app', // ADD YOUR URL
    docs: 'https://github.com/Sakshi2466/ReadCrew'
  });
});

// ✅ MongoDB connection (updated - no deprecation warnings)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/readera')
.then(() => {
  console.log('✅ MongoDB Connected');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
});

// ✅ Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const recommendRoutes = require('./routes/recommend');
const otpRoutes = require('./routes/otp');

// ✅ Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/otp', otpRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
  console.log(`🌐 Live URL: https://readcrew.onrender.com`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🗄️ Database: ${process.env.MONGO_URI ? 'Cloud' : 'Local'}`);
});