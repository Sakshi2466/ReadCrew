// server.js - COMPLETE WORKING VERSION
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ========== CRITICAL: CORS FIX ==========
// Option A: SIMPLE - Allow everything (best for testing)
app.use(cors({
  origin: '*',  // Allow ALL origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

// Option B: OR use this dynamic CORS handler (more secure)
/*
app.use((req, res, next) => {
  // Allow all origins for now - we'll restrict later
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
*/

// Handle preflight requests globally
app.options('*', cors());

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 60)}...`);
  console.log(`   IP: ${req.ip}`);
  next();
});

// ========== DATABASE CONNECTION ==========
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Failed:', err.message);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// ========== ROUTE IMPORTS ==========
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const recommendRoutes = require('./routes/recommend');
const otpRoutes = require('./routes/otp');

// ========== API ENDPOINTS ==========

// ✅ 1. ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'ReadCrew Backend API',
    version: '2.0.0',
    status: 'Operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      root: 'GET /',
      health: 'GET /api/health',
      test: 'GET /api/test',
      auth: '/api/auth/*',
      otp: '/api/otp/*',
      donations: '/api/donations/*',
      reviews: '/api/reviews/*',
      recommendations: '/api/recommend/*'
    },
    cors: 'Enabled for all origins',
    environment: process.env.NODE_ENV || 'development',
    frontend: 'https://readcrew.netlify.app',
    backend: 'https://readcrew.onrender.com'
  });
});

// ✅ 2. HEALTH CHECK
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heap: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: !!process.env.EMAIL_USER,
    nodeVersion: process.version,
    platform: process.platform
  };
  
  res.json(healthStatus);
});

// ✅ 3. TEST ENDPOINT (for debugging)
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test successful!',
    timestamp: new Date().toISOString(),
    cors: 'working',
    requestDetails: {
      method: req.method,
      url: req.originalUrl,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    }
  });
});

// ✅ 4. SIMPLE ECHO TEST
app.post('/api/echo', (req, res) => {
  res.json({
    success: true,
    message: 'Echo test successful',
    data: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// ========== MOUNT ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/otp', otpRoutes);

// ========== ERROR HANDLING ==========

// 404 - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET  /',
      'GET  /api/health',
      'GET  /api/test',
      'POST /api/echo',
      'POST /api/otp/send-otp',
      'POST /api/otp/verify-otp',
      'GET  /api/otp/status'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 READCREW BACKEND SERVER');
  console.log('='.repeat(60));
  console.log(`📡 Server URL:  https://readcrew.onrender.com`);
  console.log(`🏠 Local URL:   http://localhost:${PORT}`);
  console.log(`🔌 Port:        ${PORT}`);
  console.log(`🌍 Host:        ${HOST}`);
  console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database:    ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`📧 Email:       ${process.env.EMAIL_USER ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(`⏰ Started:     ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
  
  // Display available routes
  console.log('\n📋 AVAILABLE ENDPOINTS:');
  console.log('├── GET  /                    - API root');
  console.log('├── GET  /api/health          - Health check');
  console.log('├── GET  /api/test            - Test endpoint');
  console.log('├── POST /api/echo            - Echo test');
  console.log('├── POST /api/otp/send-otp    - Send OTP');
  console.log('├── POST /api/otp/verify-otp  - Verify OTP');
  console.log('├── GET  /api/otp/status      - OTP status');
  console.log('└── ... other routes from /routes/');
  console.log('\n✅ Server is ready to accept connections!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down...');
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app; // For testing