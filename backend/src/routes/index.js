const express = require('express');

const healthRoutes      = require('./health.routes');
const authRoutes        = require('./auth.routes');
const shopRoutes        = require('./shops.routes');
const userRoutes        = require('./users.routes');
const declarationRoutes = require('./declarations.routes');
const uploadRoutes      = require('./uploads.routes');
const adminRoutes       = require('./admin.routes');

const router = express.Router();

// ── Public ────────────────────────────────────────────────
router.use('/health',       healthRoutes);
router.use('/auth',         authRoutes);

// ── Protected (Phase 2 will add protect + restrictTo middleware) ──
router.use('/shops',        shopRoutes);
router.use('/users',        userRoutes);
router.use('/declarations', declarationRoutes);
router.use('/uploads',      uploadRoutes);
router.use('/admin',        adminRoutes);

module.exports = router;
