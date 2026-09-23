const mongoose = require('mongoose');
const Attachment = require('../models/Attachment.model');
const Declaration = require('../models/Declaration.model');
const storageService = require('./storage.service');
const { createError } = require('../utils/createError');

const VALID_CATEGORIES = ['BICYCLE', 'CUSTOMER', 'ID', 'ADDITIONAL'];

// Mapping between Attachment category and Declaration.attachments array
const CATEGORY_TO_DECLARATION_FIELD = {
  BICYCLE:    'bicyclePhotos',
  CUSTOMER:   'customerPhotos',
  ID:         'idPhotos',
  ADDITIONAL: 'additionalDocuments',
};

class AttachmentService {
  /**
   * Upload multiple attachments for a declaration with shop isolation.
   */
  async uploadAttachments(declarationId, rawCategory, files, user) {
    if (!declarationId || !mongoose.Types.ObjectId.isValid(declarationId)) {
      throw createError(400, 'Invalid declarationId format');
    }

    // 1. Validate Category
    const category = typeof rawCategory === 'string' ? rawCategory.trim().toUpperCase() : null;
    if (!category || !VALID_CATEGORIES.includes(category)) {
      throw createError(
        400,
        `Invalid category '${rawCategory}'. Allowed categories: ${VALID_CATEGORIES.join(', ')}`
      );
    }

    // 2. Validate Files presence
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw createError(400, 'At least one file must be provided for upload');
    }

    // 3. Find Declaration & Verify Shop Access
    const declaration = await Declaration.findById(declarationId).populate('shopId', 'code');
    if (!declaration) {
      throw createError(404, 'Declaration not found');
    }

    // Shop isolation rule
    if (user.role === 'SHOP_USER') {
      const userShopId = user.shopId?._id ? user.shopId._id.toString() : user.shopId.toString();
      const declShopId = declaration.shopId?._id
        ? declaration.shopId._id.toString()
        : declaration.shopId.toString();

      if (userShopId !== declShopId) {
        throw createError(404, 'Declaration not found');
      }
    }

    const shopCode = declaration.shopId?.code || 'general';
    const declShopId = declaration.shopId?._id || declaration.shopId;
    const declarationField = CATEGORY_TO_DECLARATION_FIELD[category];

    const createdAttachments = [];

    // 4. Process each file
    for (const file of files) {
      const isPdf = file.mimetype === 'application/pdf';
      const fileType = isPdf ? 'document' : 'image';

      // Upload to storage
      const storageResult = await storageService.uploadFile(file.buffer, {
        shopCode,
        declarationId: declaration._id.toString(),
        category,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
      });

      // Save attachment document
      const attachment = await Attachment.create({
        declarationId: declaration._id,
        shopId: declShopId,
        uploadedBy: user._id,
        category,
        originalFileName: file.originalname,
        fileName: storageResult.storagePublicId.split('/').pop(),
        mimeType: file.mimetype,
        fileType,
        fileSize: file.size,
        storageUrl: storageResult.storageUrl,
        storagePublicId: storageResult.storagePublicId,
      });

      createdAttachments.push(attachment);

      // Also append URL to Declaration.attachments
      if (declaration.attachments && declarationField) {
        if (!declaration.attachments[declarationField]) {
          declaration.attachments[declarationField] = [];
        }
        declaration.attachments[declarationField].push(storageResult.storageUrl);
      }
    }

    await declaration.save();

    return createdAttachments;
  }

  /**
   * Get all attachments for a declaration grouped by category.
   */
  async getDeclarationAttachments(declarationId, user) {
    if (!declarationId || !mongoose.Types.ObjectId.isValid(declarationId)) {
      throw createError(404, 'Declaration not found');
    }

    const declaration = await Declaration.findById(declarationId);
    if (!declaration) {
      throw createError(404, 'Declaration not found');
    }

    // Shop isolation rule
    if (user.role === 'SHOP_USER') {
      const userShopId = user.shopId?._id ? user.shopId._id.toString() : user.shopId.toString();
      const declShopId = declaration.shopId?._id
        ? declaration.shopId._id.toString()
        : declaration.shopId.toString();

      if (userShopId !== declShopId) {
        throw createError(404, 'Declaration not found');
      }
    }

    const attachments = await Attachment.find({ declarationId })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Group by categories
    const grouped = {
      BICYCLE: [],
      CUSTOMER: [],
      ID: [],
      ADDITIONAL: [],
    };

    attachments.forEach((att) => {
      if (grouped[att.category]) {
        grouped[att.category].push(att);
      }
    });

    return {
      declarationId,
      totalAttachments: attachments.length,
      grouped,
      all: attachments,
    };
  }

  /**
   * Get single attachment by ID with shop authorization check.
   */
  async getAttachmentById(attachmentId, user) {
    if (!attachmentId || !mongoose.Types.ObjectId.isValid(attachmentId)) {
      throw createError(404, 'Attachment not found');
    }

    const attachment = await Attachment.findById(attachmentId)
      .populate('shopId', 'name code')
      .populate('uploadedBy', 'name email role');

    if (!attachment) {
      throw createError(404, 'Attachment not found');
    }

    // Shop isolation rule
    if (user.role === 'SHOP_USER') {
      const userShopId = user.shopId?._id ? user.shopId._id.toString() : user.shopId.toString();
      const attShopId = attachment.shopId?._id
        ? attachment.shopId._id.toString()
        : attachment.shopId.toString();

      if (userShopId !== attShopId) {
        throw createError(404, 'Attachment not found');
      }
    }

    return attachment;
  }

  /**
   * Delete an attachment with storage cleanup and database removal.
   */
  async deleteAttachment(attachmentId, user) {
    if (!attachmentId || !mongoose.Types.ObjectId.isValid(attachmentId)) {
      throw createError(404, 'Attachment not found');
    }

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      throw createError(404, 'Attachment not found');
    }

    // Shop isolation rule
    if (user.role === 'SHOP_USER') {
      const userShopId = user.shopId?._id ? user.shopId._id.toString() : user.shopId.toString();
      const attShopId = attachment.shopId?._id
        ? attachment.shopId._id.toString()
        : attachment.shopId.toString();

      if (userShopId !== attShopId) {
        throw createError(404, 'Attachment not found');
      }
    }

    // 1. Delete from external storage (Cloudinary or local)
    await storageService.deleteFile(attachment.storagePublicId, attachment.mimeType);

    // 2. Remove URL from Declaration.attachments array
    const declaration = await Declaration.findById(attachment.declarationId);
    if (declaration && declaration.attachments) {
      const declarationField = CATEGORY_TO_DECLARATION_FIELD[attachment.category];
      if (declarationField && declaration.attachments[declarationField]) {
        declaration.attachments[declarationField] = declaration.attachments[declarationField].filter(
          (url) => url !== attachment.storageUrl
        );
        await declaration.save();
      }
    }

    // 3. Remove Attachment record
    await Attachment.findByIdAndDelete(attachmentId);

    return { success: true, message: 'Attachment deleted successfully' };
  }
}

module.exports = new AttachmentService();
