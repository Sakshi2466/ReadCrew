// server.js (or index.js)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware
app.use(cors({
  origin: [
    'https://readcrew.netlify.app', // Your deployed frontend
    'http://localhost:3000',        // React dev server (CRA)
    'http://localhost:5173'         // Vite dev server
  ],
  credentials: true
}));

// JSON middleware
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Connect DB
connectDB();

// Example route
app.get('/', (req, res) => {
  res.send('ReadCrew Backend Running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
