const mongoose = require('mongoose');

/**
 * Bicycle Owner's Declaration Model
 *
 * Based on the PixxTechnologiees paper Bicycle Owner's Declaration Form.
 *
 * REQUIRED fields:  customerName, bicycleModel, shopId
 * OPTIONAL fields:  all others (matching the paper form)
 *
 * shopId is ALWAYS derived from the authenticated user's account.
 * It is NEVER accepted from the mobile client request body.
 */
const declarationSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────
    // SHOP RELATIONSHIP
    // shopId comes from req.user.shopId (set by auth middleware in Phase 2).
    // Never trust shopId from the mobile client.
    // ─────────────────────────────────────────────
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop is required'],
    },

    // ─────────────────────────────────────────────
    // CUSTOMER INFORMATION
    // ─────────────────────────────────────────────
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    /**
     * cashPurchasePageNo — "Cash Purchase Page No." on the paper form.
     * Labelled "For shop use only".
     */
    cashPurchasePageNo: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    mobile: {
      type: String,
      trim: true,
      default: null,
    },
    postcode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    /**
     * signature / sellerSignature:
     * In Phase 1 these are plain String fields.
     * Phase 3+ will store a storage URL (Cloudinary / S3) pointing to
     * the captured signature image. The field type remains String.
     */
    signature: {
      type: String,
      trim: true,
      default: null,
    },
    sellerSignature: {
      type: String,
      trim: true,
      default: null,
    },

    // ─────────────────────────────────────────────
    // BICYCLE INFORMATION
    // ─────────────────────────────────────────────
    bicycleMake: {
      type: String,
      trim: true,
      default: null,
    },
    bicycleModel: {
      type: String,
      required: [true, 'Bicycle model is required'],
      trim: true,
    },
    bicycleColour: {
      type: String,
      trim: true,
      default: null,
    },
    frameNumber: {
      type: String,
      trim: true,
      default: null,
    },
    distinguishingMarkings: {
      type: String,
      trim: true,
      default: null,
    },
    /**
     * bicycleSource — "Where did you get the bicycle?" on the paper form.
     */
    bicycleSource: {
      type: String,
      trim: true,
      default: null,
    },
    /**
     * ownershipDuration — "How long have you had the bicycle?" on the paper form.
     */
    ownershipDuration: {
      type: String,
      trim: true,
      default: null,
    },
    /**
     * bicycleCost / cyclePrice — "How much did the bicycle cost you?" / Cycle Price.
     */
    bicycleCost: {
      type: String,
      trim: true,
      default: null,
    },
    cyclePrice: {
      type: String,
      trim: true,
      default: null,
    },
    /**
     * bicycleFault — "Please mention if there is any fault with bike?" on the paper form.
     */
    bicycleFault: {
      type: String,
      trim: true,
      default: null,
    },

    // ─────────────────────────────────────────────
    // LEGAL DECLARATION
    // Architecture prepared for Phase 2+ acknowledgement UI.
    // Corresponds to the legal-owner declaration text on the paper form.
    // ─────────────────────────────────────────────
    legalOwnerConfirmed: {
      type: Boolean,
      default: false,
    },

    // ─────────────────────────────────────────────
    // ATTACHMENT ARCHITECTURE
    // Phase 3+ will populate these arrays with storage URLs (Cloudinary etc.).
    // Large binary data is NEVER stored directly in MongoDB.
    // ─────────────────────────────────────────────
    attachments: {
      bicyclePhotos:       { type: [String], default: [] },
      customerPhotos:      { type: [String], default: [] },
      idPhotos:            { type: [String], default: [] },
      additionalDocuments: { type: [String], default: [] },
    },

    // ─────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─────────────────────────────────────────────
// INDEXES
// Prepared for efficient police / customer / bicycle record searches.
// ─────────────────────────────────────────────

// Primary shop filter + date ordering (most common query pattern)
declarationSchema.index({ shopId: 1, createdAt: -1 });

// Customer name search within a shop
declarationSchema.index({ shopId: 1, customerName: 1 });

// Bicycle model search within a shop
declarationSchema.index({ shopId: 1, bicycleModel: 1 });

// Frame number lookup (often used for police enquiries — global search)
declarationSchema.index({ frameNumber: 1 });

// ─────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────
const Declaration = mongoose.model('Declaration', declarationSchema);

module.exports = Declaration;
