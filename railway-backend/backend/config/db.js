// At the top with other requires
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // <-- Add this line

const app = express();

// Add CORS middleware here
app.use(cors({
  origin: [
    'https://readcrew.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Rest of your middleware
app.use(express.json());
// ... rest of your code
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;