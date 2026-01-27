const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://versal-book-app.vercel.app',
    'https://*.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Versal Book App Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      donations: '/api/donations',
      reviews: '/api/reviews',
      otp: '/api/otp/send-otp',
      verify: '/api/otp/verify-otp'
    }
  });
});

// ✅ HEALTH ENDPOINTS (both with and without /api prefix)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    emailConfigured: !!process.env.EMAIL_USER,
    cors: 'enabled'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    emailConfigured: !!process.env.EMAIL_USER,
    cors: 'enabled'
  });
});

// MongoDB Connection (FIXED - removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const otpRoutes = require('./routes/otp');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/otp', otpRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: https://versal-book-app.vercel.app`);
  console.log(`📌 Health check: GET /api/health`);
  console.log(`📌 OTP Endpoint: POST /api/otp/send-otp`);
});

module.exports = app;