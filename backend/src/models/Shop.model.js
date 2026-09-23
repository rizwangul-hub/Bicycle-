const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Shop codes — one per shop, never duplicated
// ─────────────────────────────────────────────
const SHOP_CODES = Object.freeze({
  STATION:   'STATION',
  CAMDEN:    'CAMDEN',
  CHELSEA:   'CHELSEA',
  EDGWARE:   'EDGWARE',
  SOUTHWARK: 'SOUTHWARK',
  LEEBRIDGE: 'LEEBRIDGE',
});

// ─────────────────────────────────────────────
// Initial shop seed data
// ─────────────────────────────────────────────
const INITIAL_SHOPS = [
  { name: 'Station Cycles',   code: 'STATION'   },
  { name: 'Camden Cycles',    code: 'CAMDEN'    },
  { name: 'Chelsea Bikes',    code: 'CHELSEA'   },
  { name: 'Edgware Cycles',   code: 'EDGWARE'   },
  { name: 'Southwark Cycles', code: 'SOUTHWARK' },
  { name: 'Leebridge Cycles', code: 'LEEBRIDGE' },
];

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Shop code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      enum: {
        values: Object.values(SHOP_CODES),
        message: '{VALUE} is not a recognised shop code',
      },
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Expose constants on the model
shopSchema.statics.SHOP_CODES   = SHOP_CODES;
shopSchema.statics.INITIAL_SHOPS = INITIAL_SHOPS;

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
