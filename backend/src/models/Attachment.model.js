const mongoose = require('mongoose');

const ATTACHMENT_CATEGORIES = Object.freeze({
  BICYCLE:    'BICYCLE',
  CUSTOMER:   'CUSTOMER',
  ID:         'ID',
  ADDITIONAL: 'ADDITIONAL',
});

const attachmentSchema = new mongoose.Schema(
  {
    declarationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Declaration',
      required: [true, 'Declaration reference is required'],
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop reference is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      uppercase: true,
      enum: {
        values: Object.values(ATTACHMENT_CATEGORIES),
        message: '{VALUE} is not a valid attachment category',
      },
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'Unique file name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'document'],
      default: 'image',
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
    },
    storageUrl: {
      type: String,
      required: [true, 'Storage URL is required'],
      trim: true,
    },
    storagePublicId: {
      type: String,
      required: [true, 'Storage public identifier is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast grouped queries by declaration and category
attachmentSchema.index({ declarationId: 1, category: 1 });
attachmentSchema.index({ createdAt: -1 });

attachmentSchema.statics.CATEGORIES = ATTACHMENT_CATEGORIES;

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
