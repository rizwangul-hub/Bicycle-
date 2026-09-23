const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * The server MUST NOT silently continue if the database is unavailable.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Hard exit — do not run without a database
  }
};

module.exports = connectDB;
