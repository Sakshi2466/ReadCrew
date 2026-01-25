// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======= CORS ======= (FIXED HERE!)
app.use(cors({
  origin: [
    'https://versal-book-app.vercel.app',  // ✅ ADDED https://
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // ✅ Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']  // ✅ Added headers
}));

// Handle preflight requests
app.options('*', cors());  // ✅ This fixes the preflight error

// ======= JSON Parser =======
app.use(express.json());

// ======= MongoDB Connection =======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err.message));

// ======= Routes =======
const otpRoutes = require('./routes/otp');
app.use('/api/otp', otpRoutes);

// ======= Health Check =======
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ======= Root =======
app.get('/', (req, res) => {
  res.send('ReadCrew Backend Running');
});

// ======= Start Server =======
app.listen(PORT, () => {
  console.log(`🚀 Backend running at https://versal-book-app.onrender.com on port ${PORT}`);
});