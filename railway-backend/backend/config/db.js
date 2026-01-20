const connectDB = async () => {
  try {
    // Try MONGODB_URI first (Railway), fallback to MONGO_URI
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};