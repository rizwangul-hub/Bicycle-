const jwt       = require('jsonwebtoken');
const User      = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { createError } = require('../utils/createError');

// ─────────────────────────────────────────────────────────
// authenticate — verify JWT and attach user to req.user
// ─────────────────────────────────────────────────────────
/**
 * Reads the Authorization: Bearer <token> header,
 * verifies the token, loads the user from the DB
 * (confirming they still exist and are active),
 * then attaches the user document to req.user.
 *
 * If the token is missing, expired, or invalid → 401.
 * If the account is inactive → 401.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError(401, 'Unauthorized — no token provided'));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Session expired — please log in again'));
    }
    return next(createError(401, 'Unauthorized — invalid token'));
  }

  // Re-load user from DB — confirms they still exist and are active
  // Populate shopId so req.user.shopId contains the full Shop document
  const user = await User.findById(decoded.userId).populate(
    'shopId',
    'name code isActive'
  );

  if (!user) {
    return next(createError(401, 'Unauthorized — account not found'));
  }

  if (!user.isActive) {
    return next(createError(401, 'Account inactive — contact administrator'));
  }

  req.user = user;
  next();
});

// ─────────────────────────────────────────────────────────
// requireRole — restrict access by role
// ─────────────────────────────────────────────────────────
/**
 * Must be used AFTER authenticate middleware.
 *
 * Usage:
 *   router.get('/admin/data', authenticate, requireRole('ADMIN'), handler)
 *   router.post('/declarations', authenticate, requireRole('SHOP_USER', 'ADMIN'), handler)
 *
 * @param {...string} roles — allowed role(s)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(createError(401, 'Unauthorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(createError(403, 'Forbidden — insufficient permissions'));
  }
  next();
};

// ─────────────────────────────────────────────────────────
// shopIsolation — enforce per-shop data boundaries
// ─────────────────────────────────────────────────────────
/**
 * Must be used AFTER authenticate middleware.
 *
 * Sets req.shopFilter which MUST be applied to all declaration queries:
 *
 *   SHOP_USER → req.shopFilter = { shopId: req.user.shopId._id }
 *   ADMIN     → req.shopFilter = {}  (unrestricted)
 *
 * CRITICAL RULE:
 *   shopId is ALWAYS taken from req.user (the authenticated DB record).
 *   It is NEVER accepted from req.body, req.query, or req.params
 *   as an authorization source.
 */
const shopIsolation = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, 'Unauthorized'));
  }

  if (req.user.role === 'ADMIN') {
    req.shopFilter = {}; // Admin: all shops
  } else if (req.user.role === 'SHOP_USER') {
    // Derive shopId from the authenticated user — never from the client
    const shopId = req.user.shopId?._id ?? req.user.shopId;
    req.shopFilter = { shopId };
  } else {
    return next(createError(403, 'Forbidden'));
  }

  next();
};

module.exports = { authenticate, requireRole, shopIsolation };
