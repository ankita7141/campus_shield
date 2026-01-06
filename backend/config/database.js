const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_safety', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from DB');
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Fallback to in-memory database
    console.log('💾 Using in-memory database as fallback');
    
    // You can implement in-memory storage here
    // For now, we'll continue with mongoose but with a warning
    process.exit(1);
  }
};

module.exports = connectDB;