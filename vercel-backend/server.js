// vercel-backend/server.js - UPDATED WITH ROUTE FIX
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======= CORS =======
const corsOptions = {
  origin: [
    'https://versal-book-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

// ======= JSON Parser =======
app.use(express.json());

// ======= MongoDB =======
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/versal';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Error:', err.message);
  console.log('⚠️ Running without database...');
});

// ======= Import Routes =======
const otpRoutes = require('./routes/otp');

// ======= Fix: Support BOTH routes =======
// Route 1: /api/otp/send-otp (correct)
app.use('/api/otp', otpRoutes);

// Route 2: /otp/send (what frontend is calling)
app.use('/otp', otpRoutes); // This will handle /otp/send-otp

// ======= Health Check =======
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors: 'enabled',
    routes: ['/api/otp/send-otp', '/otp/send-otp'],
    timestamp: new Date().toISOString()
  });
});

// ======= Test OTP endpoint directly =======
app.get('/test-otp-route', (req, res) => {
  res.json({
    message: 'OTP routes are configured',
    endpoints: [
      'POST /api/otp/send-otp',
      'POST /otp/send-otp'
    ],
    frontend_calling: '/otp/send (WRONG - should be /otp/send-otp)'
  });
});

// ======= Root =======
app.get('/', (req, res) => {
  res.send(`
    <h1>📚 ReadCrew Backend</h1>
    <p><strong>Status:</strong> ✅ Running</p>
    <p><strong>Test Routes:</strong></p>
    <ul>
      <li><a href="/api/health">Health Check</a></li>
      <li><a href="/test-otp-route">Test OTP Routes</a></li>
    </ul>
    <p><strong>Frontend URL:</strong> https://versal-book-app.vercel.app</p>
  `);
});

// ======= Start Server =======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: https://versal-book-app.vercel.app`);
  console.log(`📌 OTP Endpoint: POST /api/otp/send-otp`);
  console.log(`📌 OTP Endpoint: POST /otp/send-otp`);
});