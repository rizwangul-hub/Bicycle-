const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { handleUpload } = require('../middleware/upload.middleware');
const {
  uploadDeclarationAttachments,
  getDeclarationAttachments,
  getAttachmentById,
  deleteAttachment,
  downloadAttachment,
  downloadAllAttachments,
} = require('../controllers/attachment.controller');

const router = express.Router();

// All upload endpoints require authentication
router.use(authenticate);

/**
 * POST /api/uploads/declaration/:declarationId
 * Upload one or multiple files in a specified category for a declaration.
 * Form-data fields:
 *   - category: 'BICYCLE' | 'CUSTOMER' | 'ID' | 'ADDITIONAL'
 *   - files: one or multiple image/document files
 */
router.post('/declaration/:declarationId', handleUpload, uploadDeclarationAttachments);

/**
 * GET /api/uploads/declaration/:declarationId
 * Get all attachments for a declaration grouped by category.
 */
router.get('/declaration/:declarationId', getDeclarationAttachments);

/**
 * GET /api/uploads/declaration/:declarationId/download-all
 * Download all attachments for a declaration as a structured ZIP archive.
 */
router.get('/declaration/:declarationId/download-all', downloadAllAttachments);

/**
 * GET /api/uploads/:attachmentId/download
 * Download single attachment file with original filename.
 */
router.get('/:attachmentId/download', downloadAttachment);

/**
 * GET /api/uploads/:attachmentId
 * Get single attachment details by ID.
 */
router.get('/:attachmentId', getAttachmentById);

/**
 * DELETE /api/uploads/:attachmentId
 * Delete attachment from cloud storage and database.
 */
router.delete('/:attachmentId', deleteAttachment);

/**
 * Status endpoint
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload and attachment routes operational',
    categories: ['BICYCLE', 'CUSTOMER', 'ID', 'ADDITIONAL'],
    allowedTypes: ['JPG', 'JPEG', 'PNG', 'WEBP', 'PDF'],
    maxFilesPerRequest: 10,
    shopIsolation: 'Strict shop-level isolation enforced on all attachment operations',
  });
});

module.exports = router;
