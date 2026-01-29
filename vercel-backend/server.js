const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ========== CRITICAL FIX: CORS CONFIGURATION ==========
// ✅ Fix 1: Use wildcard for all subdomains correctly
// ✅ Fix 2: Handle preflight requests properly
// ✅ Fix 3: Add your specific Vercel preview URL

const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  
  // Main production domain
  'https://versal-book-app.vercel.app',
  
  // ALL Vercel preview deployments (this is what you need!)
  'https://versal-book-app-git-main-sakshi2466s-projects.vercel.app',
  'https://versal-book-app-git-*.vercel.app', // Pattern for all git branches
  'https://*.vercel.app', // This should work for all vercel subdomains
  
  // Your exact preview URL from the error
  'https://versal-book-app-git-main-sakshi2466s-projects.vercel.app/',
  
  // Add any other domains you use
  'https://versal-book-app.onrender.com' // Your backend itself
];

// CORS middleware with detailed logging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log(`🌐 CORS Check: Origin = ${origin}`);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.some(allowedOrigin => {
      // Exact match
      if (origin === allowedOrigin) return true;
      
      // Wildcard match for vercel domains
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      
      return false;
    })) {
      console.log(`✅ CORS Allowed: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`❌ CORS Blocked: ${origin}`);
      console.log(`📋 Allowed origins:`, allowedOrigins);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'X-Access-Token',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ========== IMPORTANT: Handle preflight requests globally ==========
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== ROOT ENDPOINT ==========
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Versal Book App Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'No origin header'
    },
    endpoints: {
      health: '/api/health',
      donations: '/api/donations',
      reviews: '/api/reviews',
      otp: '/api/otp/send-otp',
      verify: '/api/otp/verify-otp'
    }
  });
});

// ========== HEALTH ENDPOINTS ==========
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    emailConfigured: !!process.env.EMAIL_USER,
    cors: {
      origin: req.headers.origin || 'No origin header',
      allowed: true
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    emailConfigured: !!process.env.EMAIL_USER,
    cors: {
      origin: req.headers.origin || 'No origin header',
      allowed: true,
      method: req.method,
      headers: req.headers
    }
  });
});

// ========== MONGODB CONNECTION ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const otpRoutes = require('./routes/otp');

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/otp', otpRoutes);

// ========== 404 HANDLER ==========
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    origin: req.headers.origin || 'No origin'
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  
  // Handle CORS errors specially
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: err.message,
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for the following origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`📌 Health check: GET /api/health`);
  console.log(`📌 OTP Endpoint: POST /api/otp/send-otp`);
  console.log(`📌 Test CORS: curl -H "Origin: https://versal-book-app.vercel.app" -I ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/health`);
});

module.exports = app;