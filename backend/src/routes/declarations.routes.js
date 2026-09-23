const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createDeclaration,
  getDeclarations,
  getDeclarationById,
  updateDeclaration,
  deleteDeclaration,
  getDeclarationCertificate,
} = require('../controllers/declaration.controller');

const router = express.Router();

/**
 * All declaration endpoints require authentication.
 */
router.use(authenticate);

/**
 * GET /api/declarations/:id/certificate
 * Return official, print-ready HTML certificate for a single declaration.
 * SHOP_USER: allowed only for own shop.
 * ADMIN: allowed for any shop.
 */
router.get('/:id/certificate', getDeclarationCertificate);

/**
 * POST /api/declarations
 * Create a new bicycle declaration.
 * SHOP_USER: shopId derived automatically from user account.
 * ADMIN: shopId may be specified.
 */
router.post('/', createDeclaration);

/**
 * GET /api/declarations
 * List declarations with pagination, search, filtering, and sorting.
 * SHOP_USER: scoped strictly to user's shop.
 * ADMIN: access across all shops, optional shopId filter.
 */
router.get('/', getDeclarations);

/**
 * GET /api/declarations/:id
 * Retrieve single declaration by ID.
 * SHOP_USER: access allowed only if declaration belongs to user's shop.
 * ADMIN: access allowed for any shop.
 */
router.get('/:id', getDeclarationById);

/**
 * PUT /api/declarations/:id
 * Update declaration fields.
 * SHOP_USER: allowed only for own shop.
 * ADMIN: allowed for any shop.
 * Protected immutable fields: shopId, createdBy, createdAt.
 */
router.put('/:id', updateDeclaration);

/**
 * DELETE /api/declarations/:id
 * Delete declaration.
 * SHOP_USER: allowed only for own shop.
 * ADMIN: allowed for any shop.
 */
router.delete('/:id', deleteDeclaration);

/**
 * Status endpoint
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Declaration routes operational',
    shopIsolation: 'Strict shop-level isolation enforced on all endpoints',
    requiredFields: ['customerName', 'bicycleModel'],
  });
});

module.exports = router;
