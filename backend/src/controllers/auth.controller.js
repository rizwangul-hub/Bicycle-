const asyncHandler      = require('../utils/asyncHandler');
const { createError }   = require('../utils/createError');
const { loginUser }     = require('../services/auth.service');

// ─────────────────────────────────────────────────────────
// Helper — format a safe user object for API responses
// passwordHash is NEVER included
// ─────────────────────────────────────────────────────────
const formatUser = (user) => {
  const base = {
    id:          user._id,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    isActive:    user.isActive,
    lastLoginAt: user.lastLoginAt,
  };

  if (user.role === 'SHOP_USER' && user.shopId) {
    const shop = user.shopId;
    base.shop = {
      id:   shop._id ?? shop,
      name: shop.name,
      code: shop.code,
    };
  } else {
    base.shop = null; // Admin has no shop
  }

  return base;
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
/**
 * Request body: { email, password }
 *
 * Success response:
 * {
 *   success: true,
 *   token: "<JWT>",
 *   user: { id, name, email, role, shop, ... }
 * }
 *
 * Never returns passwordHash.
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return next(createError(400, 'Email and password are required'));
  }

  const { user, token } = await loginUser(email, password);

  res.status(200).json({
    success: true,
    token,
    user: formatUser(user),
  });
});

// ─────────────────────────────────────────────────────────
// GET /api/auth/me   (requires: authenticate)
// ─────────────────────────────────────────────────────────
/**
 * Returns the currently authenticated user's safe profile.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: formatUser(req.user),
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/auth/logout  (requires: authenticate)
// ─────────────────────────────────────────────────────────
/**
 * JWT logout is primarily client-side (discard token).
 * This endpoint provides a server acknowledgement and
 * is a hook for future token-denylist logic if needed.
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out — please remove the token from client storage.',
  });
});

module.exports = { login, getMe, logout, formatUser };
