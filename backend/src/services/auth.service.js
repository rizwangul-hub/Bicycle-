const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User.model');

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain-text password with bcrypt.
 * NEVER store plain-text passwords.
 */
const hashPassword = async (plainPassword) =>
  bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

/**
 * Compare a plain-text password against a stored bcrypt hash.
 */
const verifyPassword = async (plainPassword, hash) =>
  bcrypt.compare(plainPassword, hash);

/**
 * Generate a signed JWT for the authenticated user.
 *
 * Payload contains only non-sensitive identification data:
 *   userId, role, shopId
 *
 * JWT_SECRET comes from environment — NEVER hardcoded.
 */
const generateToken = (user) => {
  const shopId = user.shopId
    ? (user.shopId._id?.toString() ?? user.shopId.toString())
    : null;

  const payload = {
    userId: user._id.toString(),
    role:   user.role,
    shopId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Authenticate a user by email and password.
 *
 * Security considerations:
 *  - Generic "Invalid credentials" message to prevent account enumeration.
 *  - Inactive accounts are rejected AFTER password check (same timing).
 *  - lastLoginAt updated on successful login.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user, token }}
 */
const loginUser = async (email, password) => {
  // Explicitly select passwordHash (excluded by default via select: false)
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+passwordHash')
    .populate('shopId', 'name code isActive');

  // Generic error — do not reveal if email exists
  const INVALID = Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  if (!user) throw INVALID;

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) throw INVALID;

  // Check active status after verifying password (consistent timing)
  if (!user.isActive) {
    throw Object.assign(
      new Error('Account inactive — contact administrator'),
      { statusCode: 401 }
    );
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  return { user, token };
};

module.exports = { hashPassword, verifyPassword, generateToken, loginUser };
