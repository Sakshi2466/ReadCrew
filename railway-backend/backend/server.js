const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ FIX: Middleware setup
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ✅ FIX: Import and mount routes correctly
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donation');
const reviewRoutes = require('./routes/review');
const recommendRoutes = require('./routes/recommend');
const otpRoutes = require('./routes/otp');

// ✅ FIX: Mount routes with correct paths
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/otp', otpRoutes); // This is where OTP routes should be mounted

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ FIX: Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`📧 OTP system ready`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📝 OTP Endpoint: http://localhost:${PORT}/api/otp/send-otp`);
});