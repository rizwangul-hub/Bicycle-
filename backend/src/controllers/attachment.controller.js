const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const asyncHandler = require('../utils/asyncHandler');
const attachmentService = require('../services/attachment.service');
const Declaration = require('../models/Declaration.model');
const { createError } = require('../utils/createError');

/**
 * POST /api/uploads/declaration/:declarationId
 * Upload one or multiple attachments to a declaration.
 */
const uploadDeclarationAttachments = asyncHandler(async (req, res, next) => {
  const { declarationId } = req.params;
  const { category } = req.body;
  const files = req.files;

  if (!category) {
    return next(createError(400, 'category is required (BICYCLE, CUSTOMER, ID, ADDITIONAL)'));
  }

  if (!files || files.length === 0) {
    return next(createError(400, 'No files were uploaded'));
  }

  const attachments = await attachmentService.uploadAttachments(
    declarationId,
    category,
    files,
    req.user
  );

  res.status(201).json({
    success: true,
    message: `${attachments.length} file(s) uploaded successfully`,
    count: attachments.length,
    data: attachments,
  });
});

/**
 * GET /api/uploads/declaration/:declarationId
 * Get all attachments for a declaration grouped by category.
 */
const getDeclarationAttachments = asyncHandler(async (req, res) => {
  const { declarationId } = req.params;
  const result = await attachmentService.getDeclarationAttachments(declarationId, req.user);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/uploads/:attachmentId
 * Get single attachment by ID.
 */
const getAttachmentById = asyncHandler(async (req, res) => {
  const { attachmentId } = req.params;
  const attachment = await attachmentService.getAttachmentById(attachmentId, req.user);

  res.status(200).json({
    success: true,
    data: attachment,
  });
});

/**
 * DELETE /api/uploads/:attachmentId
 * Delete attachment from storage and database.
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  const { attachmentId } = req.params;
  const result = await attachmentService.deleteAttachment(attachmentId, req.user);

  res.status(200).json(result);
});

/**
 * GET /api/uploads/:attachmentId/download
 * Download individual attachment file with proper headers.
 */
const downloadAttachment = asyncHandler(async (req, res, next) => {
  const { attachmentId } = req.params;
  const attachment = await attachmentService.getAttachmentById(attachmentId, req.user);
  if (!attachment) {
    return next(createError(404, 'Attachment not found'));
  }

  const filename = attachment.originalFileName || `attachment-${attachmentId}.${(attachment.mimeType || 'bin').split('/')[1] || 'bin'}`;

  // If local file
  if (attachment.storageUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../..', attachment.storageUrl);
    if (!fs.existsSync(filePath)) {
      return next(createError(404, 'File not found on storage'));
    }
    return res.download(filePath, filename);
  }

  // If remote URL (Cloudinary or HTTP)
  try {
    const response = await fetch(attachment.storageUrl);
    if (!response.ok) {
      return next(createError(502, 'Failed to retrieve file from storage provider'));
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return next(createError(500, `Download failed: ${err.message}`));
  }
});

/**
 * GET /api/uploads/declaration/:declarationId/download-all
 * Download all declaration attachments packed in a ZIP archive.
 */
const downloadAllAttachments = asyncHandler(async (req, res, next) => {
  const { declarationId } = req.params;
  const result = await attachmentService.getDeclarationAttachments(declarationId, req.user);
  const declaration = await Declaration.findById(declarationId);

  if (!result.all || result.all.length === 0) {
    return next(createError(404, 'No attachments found for this declaration'));
  }

  const frameOrId = declaration?.frameNumber ? declaration.frameNumber.replace(/[^a-zA-Z0-9_-]/g, '_') : declarationId;
  const zipFilename = `Declaration_${frameOrId}_Attachments.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    console.error('ZIP generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate ZIP archive' });
    }
  });

  archive.pipe(res);

  const categoryFolders = {
    BICYCLE: 'Bicycle',
    CUSTOMER: 'Customer',
    ID: 'ID',
    ADDITIONAL: 'Additional',
  };

  for (let i = 0; i < result.all.length; i++) {
    const att = result.all[i];
    const folder = categoryFolders[att.category] || 'Additional';
    const cleanFileName = att.originalFileName ? att.originalFileName.replace(/[^a-zA-Z0-9_.-]/g, '_') : `file_${i + 1}`;
    const archivePath = `${folder}/${cleanFileName}`;

    if (att.storageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../..', att.storageUrl);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: archivePath });
      }
    } else if (att.storageUrl.startsWith('http://') || att.storageUrl.startsWith('https://')) {
      try {
        const resp = await fetch(att.storageUrl);
        if (resp.ok) {
          const arrBuf = await resp.arrayBuffer();
          archive.append(Buffer.from(arrBuf), { name: archivePath });
        }
      } catch (fetchErr) {
        console.warn(`Could not fetch attachment ${att._id} for zip:`, fetchErr.message);
      }
    }
  }

  await archive.finalize();
});

module.exports = {
  uploadDeclarationAttachments,
  getDeclarationAttachments,
  getAttachmentById,
  deleteAttachment,
  downloadAttachment,
  downloadAllAttachments,
};
