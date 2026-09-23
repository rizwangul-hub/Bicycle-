const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * GET /api/health
 *
 * Public health check — no authentication required.
 * Returns API status and current database connection state.
 */
const healthCheck = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'Pixx Bicycle Owner Declaration API is running',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatusMap[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = { healthCheck };
