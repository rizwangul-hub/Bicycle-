const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB.
 * Caches the connection across serverless function invocations (Vercel/AWS Lambda)
 * to prevent exhausting MongoDB connection limits and avoid reconnection overhead.
 */
const connectDB = async () => {
  // If already connected (e.g. warm serverless lambda invocation), reuse connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables. Please configure this in Vercel Project Settings.';
    console.error(`❌ ${errorMsg}`);
    if (process.env.VERCEL) {
      throw new Error(errorMsg);
    } else {
      process.exit(1);
    }
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    if (process.env.VERCEL) {
      throw error;
    } else {
      process.exit(1); // Hard exit in regular standalone server mode
    }
  }
};

module.exports = connectDB;

