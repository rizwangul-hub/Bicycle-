const asyncHandler = require('../utils/asyncHandler');
const declarationService = require('../services/declaration.service');

/**
 * Declaration controller handlers.
 */

// POST /api/declarations
const createDeclaration = asyncHandler(async (req, res) => {
  const declaration = await declarationService.createDeclaration(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Declaration created successfully',
    data: declaration,
  });
});

// GET /api/declarations
const getDeclarations = asyncHandler(async (req, res) => {
  const result = await declarationService.getDeclarations(req.query, req.user);
  res.status(200).json({
    success: true,
    count: result.declarations.length,
    data: result.declarations,
    pagination: result.pagination,
  });
});

// GET /api/declarations/:id
const getDeclarationById = asyncHandler(async (req, res) => {
  const declaration = await declarationService.getDeclarationById(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: declaration,
  });
});

// PUT /api/declarations/:id
const updateDeclaration = asyncHandler(async (req, res) => {
  const declaration = await declarationService.updateDeclaration(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({
    success: true,
    message: 'Declaration updated successfully',
    data: declaration,
  });
});

// DELETE /api/declarations/:id
const deleteDeclaration = asyncHandler(async (req, res) => {
  const result = await declarationService.deleteDeclaration(req.params.id, req.user);
  res.status(200).json(result);
});

// GET /api/declarations/:id/certificate
const getDeclarationCertificate = asyncHandler(async (req, res) => {
  const declaration = await declarationService.getDeclarationById(req.params.id, req.user);
  let attachments = [];
  try {
    const attachmentService = require('../services/attachment.service');
    const attachResult = await attachmentService.getDeclarationAttachments(req.params.id, req.user);
    attachments = attachResult.all || [];
  } catch (attErr) {
    // Non-fatal if attachments are empty
  }

  const { generateCertificateHtml } = require('../services/certificate.service');
  const token = req.query.token || '';
  const html = generateCertificateHtml(declaration, attachments, token);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});

// GET /api/declarations/:id/pdf
const getDeclarationPdf = asyncHandler(async (req, res) => {
  const declaration = await declarationService.getDeclarationById(req.params.id, req.user);
  let attachments = [];
  try {
    const attachmentService = require('../services/attachment.service');
    const attachResult = await attachmentService.getDeclarationAttachments(req.params.id, req.user);
    attachments = attachResult.all || [];
  } catch (attErr) {
    // Non-fatal
  }

  const { generateDeclarationPdf } = require('../services/pdf.service');
  const pdfBuffer = await generateDeclarationPdf(declaration, attachments);

  const refCode = declaration._id ? declaration._id.toString().slice(-8).toUpperCase() : 'UNKNOWN';
  const safeCustomer = (declaration.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Customer-Declaration-${refCode}-${safeCustomer}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.status(200).send(pdfBuffer);
});

module.exports = {
  createDeclaration,
  getDeclarations,
  getDeclarationById,
  updateDeclaration,
  deleteDeclaration,
  getDeclarationCertificate,
  getDeclarationPdf,
};
