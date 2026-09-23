/**
 * Vercel Serverless Function Entry Point
 * Pixx Bicycle Owner's Declaration System — Backend API
 */
require('dotenv').config();

const app       = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Serverless MongoDB connection error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is correctly configured in Vercel Environment Variables and Network Access (0.0.0.0/0) is enabled in MongoDB Atlas.',
      error: process.env.NODE_ENV === 'production' ? 'Database connection failure' : err.message,
    });
  }

  return app(req, res);
};
