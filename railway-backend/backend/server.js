// server.js - COMPLETE CORRECT VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ========== CRITICAL: CORS CONFIGURATION ==========
// For your specific URLs - UPDATED
app.use(cors({
  origin: [
    'https://readcrew.netlify.app',  // Your Netlify frontend
    'https://readcrew.onrender.com',  // Your Render backend (optional)
    'http://localhost:3000',          // Local React dev
    'http://localhost:5173',          // Local Vite dev
    'https://*.netlify.app'           // All Netlify subdomains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin || 'No origin header'}`);
  next();
});

// ========== DATABASE CONNECTION ==========
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/readcrew', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// ========== ROUTES ==========

// Test endpoint to verify CORS
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly!',
    yourOrigin: req.headers.origin,
    allowedOrigins: [
      'https://readcrew.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ReadCrew Backend',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReadCrew Backend API',
    version: '1.0.0',
    frontend: 'https://readcrew.netlify.app',
    backend: 'https://readcrew.onrender.com',
    endpoints: {
      health: '/api/health',
      test: '/api/test-cors',
      otp: '/api/otp/*'
    }
  });
});

// ========== IMPORT AND MOUNT YOUR ROUTES ==========
// Make sure you have these route files
const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const recommendRoutes = require('./routes/recommend');

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommend', recommendRoutes);

// ========== ERROR HANDLING ==========
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/test-cors',
      'POST /api/otp/send-otp',
      'POST /api/otp/verify-otp'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 ReadCrew Backend Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: https://readcrew.onrender.com`);
  console.log(`🔗 Frontend: https://readcrew.netlify.app`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`🔄 CORS: Enabled for Netlify and localhost`);
  console.log('='.repeat(50));
  console.log('\n✅ Server is ready! Test these URLs:');
  console.log('1. https://readcrew.onrender.com/');
  console.log('2. https://readcrew.onrender.com/api/health');
  console.log('3. https://readcrew.onrender.com/api/test-cors\n');
});