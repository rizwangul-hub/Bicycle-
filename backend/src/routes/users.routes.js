const express = require('express');
const asyncHandler                       = require('../utils/asyncHandler');
const { authenticate, requireRole }      = require('../middleware/auth.middleware');
const { createError }                    = require('../utils/createError');
const { hashPassword }                   = require('../services/auth.service');
const User = require('../models/User.model');

const router = express.Router();

/**
 * GET /api/users
 * Protected — ADMIN only.
 * Returns all users (without passwordHash).
 */
router.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .populate('shopId', 'name code')
      .sort({ name: 1 });
    res.status(200).json({ success: true, count: users.length, users });
  })
);

/**
 * GET /api/users/:id
 * Protected — ADMIN only.
 */
router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate('shopId', 'name code');
    if (!user) return next(createError(404, 'User not found'));
    res.status(200).json({ success: true, user });
  })
);

/**
 * POST /api/users
 * Protected — ADMIN only.
 * Admin creates shop users or other admins.
 * There is NO public registration endpoint.
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const { name, email, password, role, shopId } = req.body ?? {};

    if (!name || !email || !password || !role) {
      return next(createError(400, 'name, email, password, and role are required'));
    }

    const { ROLES } = User;
    if (!Object.values(ROLES).includes(role)) {
      return next(createError(400, `role must be one of: ${Object.values(ROLES).join(', ')}`));
    }

    if (role === ROLES.SHOP_USER && !shopId) {
      return next(createError(400, 'shopId is required for SHOP_USER'));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(createError(409, 'A user with this email address already exists'));
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      shopId: role === ROLES.SHOP_USER ? shopId : null,
      isActive: true,
    });

    const populated = await user.populate('shopId', 'name code');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id:     populated._id,
        name:   populated.name,
        email:  populated.email,
        role:   populated.role,
        shop:   populated.shopId,
        isActive: populated.isActive,
      },
    });
  })
);

/**
 * PUT /api/users/:id
 * Protected — ADMIN only.
 * Update user details (name, email, isActive, etc.)
 */
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const { name, email, isActive, shopId, role, password } = req.body ?? {};

    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found'));

    if (isActive !== undefined) {
      if (req.user._id.toString() === user._id.toString() && isActive === false) {
        return next(createError(400, 'Cannot deactivate your own administrator account'));
      }
      user.isActive = Boolean(isActive);
    }

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      if (trimmedEmail !== user.email) {
        const conflict = await User.findOne({ email: trimmedEmail, _id: { $ne: user._id } });
        if (conflict) {
          return next(createError(409, 'Email is already in use by another account'));
        }
        user.email = trimmedEmail;
      }
    }
    if (shopId !== undefined) user.shopId = shopId || null;
    if (role !== undefined) user.role = role;
    if (password && typeof password === 'string' && password.length >= 6) {
      user.passwordHash = await hashPassword(password);
    }

    await user.save();
    await user.populate('shopId', 'name code');

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  })
);

/**
 * PATCH /api/users/:id/status
 * Protected — ADMIN only.
 * Toggle active/inactive status.
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const { isActive } = req.body ?? {};
    if (isActive === undefined) {
      return next(createError(400, 'isActive (boolean) is required'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found'));

    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      return next(createError(400, 'Cannot deactivate your own administrator account'));
    }

    user.isActive = Boolean(isActive);
    await user.save();
    await user.populate('shopId', 'name code');

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        shop: user.shopId,
      },
    });
  })
);

/**
 * PATCH /api/users/:id/password
 * Protected — ADMIN only.
 * Reset user password.
 */
router.patch(
  '/:id/password',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const { password } = req.body ?? {};
    if (!password || typeof password !== 'string' || password.length < 6) {
      return next(createError(400, 'Password must be at least 6 characters long'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found'));

    user.passwordHash = await hashPassword(password);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  })
);

/**
 * Status endpoint.
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User routes operational — ADMIN only',
    note: 'There is no public registration. All users are created by ADMIN.',
    endpoints: [
      'GET  /api/users',
      'GET  /api/users/:id',
      'POST /api/users',
      'PUT  /api/users/:id',
    ],
  });
});

module.exports = router;
