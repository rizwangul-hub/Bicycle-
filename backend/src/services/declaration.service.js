const mongoose = require('mongoose');
const Declaration = require('../models/Declaration.model');
const Shop = require('../models/Shop.model');
const { createError } = require('../utils/createError');

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'customerName',
  'bicycleModel',
  'bicycleMake',
  'date',
];

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Clean and sanitize string inputs.
 */
const cleanString = (val) => {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Validate basic email format if provided.
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Service to handle all Declaration business logic.
 */
class DeclarationService {
  /**
   * Create a new declaration.
   */
  async createDeclaration(data, user) {
    let shopId;

    if (user.role === 'SHOP_USER') {
      // SHOP_USER: Strictly derive shopId from authenticated user
      shopId = user.shopId?._id || user.shopId;
      if (!shopId) {
        throw createError(400, 'Authenticated shop user has no assigned shop');
      }
    } else if (user.role === 'ADMIN') {
      // ADMIN: May specify shopId, but must validate that it exists and is active
      if (!data.shopId) {
        throw createError(400, 'shopId is required when creating a declaration as ADMIN');
      }

      if (!mongoose.Types.ObjectId.isValid(data.shopId)) {
        throw createError(400, 'Invalid shopId format');
      }

      const shop = await Shop.findById(data.shopId);
      if (!shop || !shop.isActive) {
        throw createError(400, 'Specified shop does not exist or is inactive');
      }
      shopId = shop._id;
    } else {
      throw createError(403, 'Forbidden — insufficient role permissions');
    }

    // Required fields validation
    const customerName = cleanString(data.customerName);
    const bicycleModel = cleanString(data.bicycleModel);

    if (!customerName) {
      throw createError(400, 'Customer name is required');
    }
    if (!bicycleModel) {
      throw createError(400, 'Bicycle model is required');
    }

    // Optional email validation if provided
    const email = cleanString(data.email);
    if (email && !isValidEmail(email)) {
      throw createError(400, 'Invalid email address format');
    }

    // Cost / Price validation and synchronization
    let bicycleCost = cleanString(data.cyclePrice || data.bicycleCost);
    if (bicycleCost !== null && !isNaN(bicycleCost)) {
      bicycleCost = String(parseFloat(bicycleCost));
    }
    const cyclePrice = bicycleCost;

    const newDeclaration = await Declaration.create({
      shopId,
      customerName,
      bicycleModel,
      createdBy: user._id,
      date: data.date ? new Date(data.date) : null,
      address: cleanString(data.address),
      phone: cleanString(data.phone),
      cashPurchasePageNo: cleanString(data.cashPurchasePageNo),
      email: email ? email.toLowerCase() : null,
      mobile: cleanString(data.mobile),
      postcode: cleanString(data.postcode) ? cleanString(data.postcode).toUpperCase() : null,
      signature: cleanString(data.signature),
      sellerSignature: cleanString(data.sellerSignature),
      bicycleMake: cleanString(data.bicycleMake),
      bicycleColour: cleanString(data.bicycleColour),
      frameNumber: cleanString(data.frameNumber),
      distinguishingMarkings: cleanString(data.distinguishingMarkings),
      bicycleSource: cleanString(data.bicycleSource),
      ownershipDuration: cleanString(data.ownershipDuration),
      bicycleCost,
      cyclePrice,
      bicycleFault: cleanString(data.bicycleFault),
      legalOwnerConfirmed: Boolean(data.legalOwnerConfirmed),
    });

    return await Declaration.findById(newDeclaration._id)
      .populate('shopId', 'name code address phone email')
      .populate('createdBy', 'name email role');
  }

  /**
   * Get declarations list with search, filter, sorting, and pagination.
   */
  async getDeclarations(queryParams, user) {
    const {
      page = 1,
      limit = 20,
      search,
      q,
      shopId,
      customerName,
      bicycleModel,
      bicycleMake,
      bicycleColour,
      frameNumber,
      date,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryParams;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    // ── Build Query Filters ──
    const filter = {};

    // Shop isolation rule:
    if (user.role === 'SHOP_USER') {
      filter.shopId = user.shopId?._id || user.shopId;
    } else if (user.role === 'ADMIN') {
      if (shopId) {
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
          throw createError(400, 'Invalid shopId filter format');
        }
        filter.shopId = shopId;
      }
    }

    // Search functionality across multiple fields
    const searchQuery = cleanString(search || q);
    if (searchQuery) {
      const regex = new RegExp(escapeRegex(searchQuery), 'i');
      filter.$or = [
        { customerName: regex },
        { bicycleModel: regex },
        { bicycleMake: regex },
        { frameNumber: regex },
        { phone: regex },
        { mobile: regex },
        { email: regex },
        { cashPurchasePageNo: regex },
      ];
    }

    // Dedicated field filters
    if (customerName) {
      filter.customerName = new RegExp(escapeRegex(customerName.trim()), 'i');
    }
    if (bicycleModel) {
      filter.bicycleModel = new RegExp(escapeRegex(bicycleModel.trim()), 'i');
    }
    if (bicycleMake) {
      filter.bicycleMake = new RegExp(escapeRegex(bicycleMake.trim()), 'i');
    }
    if (bicycleColour) {
      filter.bicycleColour = new RegExp(escapeRegex(bicycleColour.trim()), 'i');
    }
    if (frameNumber) {
      filter.frameNumber = new RegExp(escapeRegex(frameNumber.trim()), 'i');
    }

    // Date filters
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) filter.date.$lte = end;
      }
    }

    // ── Sorting ──
    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = String(sortOrder).toLowerCase() === 'asc' || sortOrder === '1' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // ── Execute count and find ──
    const [total, declarations] = await Promise.all([
      Declaration.countDocuments(filter),
      Declaration.find(filter)
        .populate('shopId', 'name code address phone email')
        .populate('createdBy', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit),
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return {
      declarations,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single declaration by ID with strict shop isolation.
   */
  async getDeclarationById(id, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(404, 'Declaration not found');
    }

    const query = { _id: id };
    if (user.role === 'SHOP_USER') {
      query.shopId = user.shopId?._id || user.shopId;
    }

    const declaration = await Declaration.findOne(query)
      .populate('shopId', 'name code address phone email')
      .populate('createdBy', 'name email role');

    if (!declaration) {
      throw createError(404, 'Declaration not found');
    }

    return declaration;
  }

  /**
   * Update declaration with strict shop isolation and protected immutable fields.
   */
  async updateDeclaration(id, updateData, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(404, 'Declaration not found');
    }

    const query = { _id: id };
    if (user.role === 'SHOP_USER') {
      query.shopId = user.shopId?._id || user.shopId;
    }

    const declaration = await Declaration.findOne(query);
    if (!declaration) {
      throw createError(404, 'Declaration not found');
    }

    // Validate required fields if they are explicitly being updated
    if (updateData.customerName !== undefined) {
      const customerName = cleanString(updateData.customerName);
      if (!customerName) {
        throw createError(400, 'Customer name cannot be empty');
      }
      declaration.customerName = customerName;
    }

    if (updateData.bicycleModel !== undefined) {
      const bicycleModel = cleanString(updateData.bicycleModel);
      if (!bicycleModel) {
        throw createError(400, 'Bicycle model cannot be empty');
      }
      declaration.bicycleModel = bicycleModel;
    }

    if (updateData.email !== undefined) {
      const email = cleanString(updateData.email);
      if (email && !isValidEmail(email)) {
        throw createError(400, 'Invalid email address format');
      }
      declaration.email = email ? email.toLowerCase() : null;
    }

    // Optional fields
    if (updateData.date !== undefined) {
      declaration.date = updateData.date ? new Date(updateData.date) : null;
    }
    if (updateData.address !== undefined) {
      declaration.address = cleanString(updateData.address);
    }
    if (updateData.phone !== undefined) {
      declaration.phone = cleanString(updateData.phone);
    }
    if (updateData.cashPurchasePageNo !== undefined) {
      declaration.cashPurchasePageNo = cleanString(updateData.cashPurchasePageNo);
    }
    if (updateData.mobile !== undefined) {
      declaration.mobile = cleanString(updateData.mobile);
    }
    if (updateData.postcode !== undefined) {
      const pc = cleanString(updateData.postcode);
      declaration.postcode = pc ? pc.toUpperCase() : null;
    }
    if (updateData.signature !== undefined) {
      declaration.signature = cleanString(updateData.signature);
    }
    if (updateData.sellerSignature !== undefined) {
      declaration.sellerSignature = cleanString(updateData.sellerSignature);
    }
    if (updateData.bicycleMake !== undefined) {
      declaration.bicycleMake = cleanString(updateData.bicycleMake);
    }
    if (updateData.bicycleColour !== undefined) {
      declaration.bicycleColour = cleanString(updateData.bicycleColour);
    }
    if (updateData.frameNumber !== undefined) {
      declaration.frameNumber = cleanString(updateData.frameNumber);
    }
    if (updateData.distinguishingMarkings !== undefined) {
      declaration.distinguishingMarkings = cleanString(updateData.distinguishingMarkings);
    }
    if (updateData.bicycleSource !== undefined) {
      declaration.bicycleSource = cleanString(updateData.bicycleSource);
    }
    if (updateData.ownershipDuration !== undefined) {
      declaration.ownershipDuration = cleanString(updateData.ownershipDuration);
    }
    if (updateData.bicycleCost !== undefined || updateData.cyclePrice !== undefined) {
      const priceVal = cleanString(updateData.cyclePrice || updateData.bicycleCost);
      declaration.bicycleCost = priceVal;
      declaration.cyclePrice = priceVal;
    }
    if (updateData.bicycleFault !== undefined) {
      declaration.bicycleFault = cleanString(updateData.bicycleFault);
    }
    if (updateData.legalOwnerConfirmed !== undefined) {
      declaration.legalOwnerConfirmed = Boolean(updateData.legalOwnerConfirmed);
    }

    // CRITICAL: Prevent modifying shopId, createdBy, createdAt
    // (Ignored by not assigning them from updateData)

    await declaration.save();

    return await Declaration.findById(declaration._id)
      .populate('shopId', 'name code address phone email')
      .populate('createdBy', 'name email role');
  }

  /**
   * Delete declaration with strict shop isolation and attachment cleanup.
   */
  async deleteDeclaration(id, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(404, 'Declaration not found');
    }

    const query = { _id: id };
    if (user.role === 'SHOP_USER') {
      query.shopId = user.shopId?._id || user.shopId;
    }

    const declaration = await Declaration.findOneAndDelete(query);
    if (!declaration) {
      throw createError(404, 'Declaration not found');
    }

    // Cleanup associated attachments from storage and database
    try {
      const Attachment = require('../models/Attachment.model');
      const storageService = require('./storage.service');
      const attachments = await Attachment.find({ declarationId: declaration._id });
      for (const att of attachments) {
        await storageService.deleteFile(att.storagePublicId, att.mimeType);
      }
      await Attachment.deleteMany({ declarationId: declaration._id });
    } catch (cleanupErr) {
      console.warn('Attachment cleanup warning on declaration delete:', cleanupErr.message);
    }

    return { success: true, message: 'Declaration deleted successfully' };
  }
}

module.exports = new DeclarationService();
