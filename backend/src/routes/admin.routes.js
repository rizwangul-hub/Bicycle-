const express = require('express');
const asyncHandler                  = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { createError }               = require('../utils/createError');
const { hashPassword }              = require('../services/auth.service');
const Shop        = require('../models/Shop.model');
const Declaration = require('../models/Declaration.model');
const User        = require('../models/User.model');

const router = express.Router();

// All admin routes require: authenticate + requireRole('ADMIN')
router.use(authenticate, requireRole('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Summary statistics and per-shop declaration metrics across all 6 shops.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [shops, userCount, totalDeclarations, recentCount, shopCounts, shopUserCounts, allDeclarations] = await Promise.all([
      Shop.find().sort({ name: 1 }),
      User.countDocuments({ isActive: true }),
      Declaration.countDocuments(),
      Declaration.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Declaration.aggregate([
        { $group: { _id: '$shopId', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: 'SHOP_USER' } },
        { $group: { _id: '$shopId', count: { $sum: 1 } } },
      ]),
      Declaration.find().select('shopId bicycleCost date createdAt').lean(),
    ]);

    const countMap = {};
    shopCounts.forEach((sc) => {
      countMap[String(sc._id)] = sc.count;
    });

    const userMap = {};
    shopUserCounts.forEach((uc) => {
      userMap[String(uc._id)] = uc.count;
    });

    // Parse bicycle cost string into numeric float (e.g. "£350.00" -> 350)
    const parseCost = (val) => {
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    let todayPurchasedCount = 0;
    let todayPurchasedAmount = 0;
    let totalPurchasedAmount = 0;
    const todayShopMetrics = {};

    allDeclarations.forEach((decl) => {
      const cost = parseCost(decl.bicycleCost);
      totalPurchasedAmount += cost;

      const createdTime = new Date(decl.createdAt);
      const dateTime = decl.date ? new Date(decl.date) : null;
      const isToday = createdTime >= startOfToday || (dateTime && dateTime >= startOfToday);

      if (isToday) {
        todayPurchasedCount += 1;
        todayPurchasedAmount += cost;

        const sId = String(decl.shopId);
        if (!todayShopMetrics[sId]) {
          todayShopMetrics[sId] = { count: 0, amount: 0 };
        }
        todayShopMetrics[sId].count += 1;
        todayShopMetrics[sId].amount += cost;
      }
    });

    const shopsWithCounts = shops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      code: shop.code,
      isActive: shop.isActive,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      declarationCount: countMap[String(shop._id)] || 0,
      userCount: userMap[String(shop._id)] || 0,
      todayPurchasedCount: todayShopMetrics[String(shop._id)]?.count || 0,
      todayPurchasedAmount: Number((todayShopMetrics[String(shop._id)]?.amount || 0).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      dashboard: {
        totalShops: shops.length,
        activeShops: shops.filter((s) => s.isActive).length,
        activeUsers: userCount,
        totalDeclarations,
        recentDeclarationsCount: recentCount,
        // Daily Cycle Purchase Metrics
        todayPurchasedCount,
        todayPurchasedAmount: Number(todayPurchasedAmount.toFixed(2)),
        totalPurchasedAmount: Number(totalPurchasedAmount.toFixed(2)),
        shops: shopsWithCounts,
      },
    });
  })
);

/**
 * GET /api/admin/shops
 * All shops with declaration counts and user counts.
 */
router.get(
  '/shops',
  asyncHandler(async (req, res) => {
    const [shops, declarationCounts, userCounts] = await Promise.all([
      Shop.find().sort({ name: 1 }),
      Declaration.aggregate([{ $group: { _id: '$shopId', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { role: 'SHOP_USER' } },
        { $group: { _id: '$shopId', count: { $sum: 1 } } },
      ]),
    ]);

    const declMap = {};
    declarationCounts.forEach((dc) => {
      declMap[String(dc._id)] = dc.count;
    });

    const userMap = {};
    userCounts.forEach((uc) => {
      userMap[String(uc._id)] = uc.count;
    });

    const enrichedShops = shops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      code: shop.code,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      isActive: shop.isActive,
      declarationCount: declMap[String(shop._id)] || 0,
      userCount: userMap[String(shop._id)] || 0,
      createdAt: shop.createdAt,
    }));

    res.status(200).json({ success: true, count: enrichedShops.length, shops: enrichedShops });
  })
);

/**
 * GET /api/admin/users
 * All users across all shops with full populated shop context.
 */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .populate('shopId', 'name code address phone email')
      .sort({ name: 1 });
    res.status(200).json({ success: true, count: users.length, users });
  })
);

/**
 * POST /api/admin/users
 * Admin creates a new SHOP_USER or ADMIN.
 */
router.post(
  '/users',
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
        id: populated._id,
        name: populated.name,
        email: populated.email,
        role: populated.role,
        shop: populated.shopId,
        isActive: populated.isActive,
      },
    });
  })
);

/**
 * PUT /api/admin/users/:id
 * Admin updates user profile.
 */
router.put(
  '/users/:id',
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
 * PATCH /api/admin/users/:id/status
 * Toggle user active/inactive status.
 */
router.patch(
  '/users/:id/status',
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
 * PATCH /api/admin/users/:id/password
 * Admin resets a user's password.
 */
router.patch(
  '/users/:id/password',
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
 * Status endpoint — confirms admin routes are locked to ADMIN role.
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin routes operational — ADMIN access confirmed',
    authenticatedAdmin: req.user.name,
    endpoints: [
      'GET /api/admin/dashboard',
      'GET /api/admin/shops',
      'GET /api/admin/users',
      'GET /api/admin/declarations  — Phase 3+',
      'GET /api/admin/search        — Phase 3+',
      'GET /api/admin/export        — Phase 3+',
    ],
  });
});

module.exports = router;
