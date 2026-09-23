const express = require('express');
const { login, getMe, logout } = require('../controllers/auth.controller');
const { authenticate }         = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Public — no token required.
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Protected — valid JWT required.
 * Returns current user's safe profile.
 */
router.get('/me', authenticate, getMe);

/**
 * POST /api/auth/logout
 * Protected — valid JWT required.
 * Server acknowledgement; client must also discard the token.
 */
router.post('/logout', authenticate, logout);

/**
 * Status check — confirms auth routes are mounted.
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes operational',
    endpoints: [
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/auth/logout',
    ],
  });
});

module.exports = router;
