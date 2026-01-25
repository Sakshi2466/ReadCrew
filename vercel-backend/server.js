// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======= CORS =======
app.use(cors({
  origin: ['versal-book-app.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

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
