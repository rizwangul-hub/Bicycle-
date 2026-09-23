const express = require('express');
const asyncHandler              = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const Shop = require('../models/Shop.model');

const router = express.Router();

/**
 * GET /api/shops/me
 * Protected — SHOP_USER only.
 * Returns the authenticated user's own shop details.
 */
router.get(
  '/me',
  authenticate,
  requireRole('SHOP_USER'),
  asyncHandler(async (req, res) => {
    // shopId is already populated on req.user from authenticate middleware
    const shop = req.user.shopId;
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    res.status(200).json({ success: true, shop });
  })
);

/**
 * GET /api/shops
 * Protected — ADMIN only.
 * Returns all shops.
 */
router.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const shops = await Shop.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: shops.length, shops });
  })
);

/**
 * GET /api/shops/:id
 * Protected — ADMIN only.
 * Returns a single shop by ID.
 */
router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      const { createError } = require('../utils/createError');
      return next(createError(404, 'Shop not found'));
    }
    res.status(200).json({ success: true, shop });
  })
);

/**
 * Status endpoint.
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shop routes operational',
    endpoints: [
      'GET /api/shops/me   — SHOP_USER: own shop',
      'GET /api/shops      — ADMIN: all shops',
      'GET /api/shops/:id  — ADMIN: shop by ID',
    ],
  });
});

module.exports = router;
