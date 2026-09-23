const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Role definitions
// ─────────────────────────────────────────────
const ROLES = Object.freeze({
  SHOP_USER: 'SHOP_USER',
  ADMIN:     'ADMIN',
});

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    /**
     * IMPORTANT: passwordHash is NEVER returned in normal API responses.
     * select: false ensures it is excluded from all queries unless
     * explicitly requested with .select('+passwordHash').
     */
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    /**
     * shopId:
     *  - SHOP_USER: required — belongs to exactly one shop
     *  - ADMIN:     null     — can access all shops
     *
     * CRITICAL: The shopId stored here is the authoritative source
     * of a user's shop. The backend MUST derive shopId from the
     * authenticated user record — never from the client request body.
     */
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ shopId: 1, role: 1 });

// ─────────────────────────────────────────────
// Validation: SHOP_USER must have a shopId
// ─────────────────────────────────────────────
userSchema.pre('save', function () {
  if (this.role === ROLES.SHOP_USER && !this.shopId) {
    throw new Error('A SHOP_USER must be associated with a shop (shopId required)');
  }
});

// ─────────────────────────────────────────────
// Expose constants on the model
// ─────────────────────────────────────────────
userSchema.statics.ROLES = ROLES;

const User = mongoose.model('User', userSchema);

module.exports = User;
