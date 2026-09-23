/**
 * Database Seed Script
 * Pixx Bicycle Owner's Declaration System
 * PixxTechnologiees — UK Bicycle Business
 *
 * Seeds:
 *   - 6 UK bicycle shops
 *   - 6 SHOP_USER accounts (one per shop)
 *   - 1 ADMIN account
 *
 * Run from the backend/ directory:
 *   npm run seed
 *
 * Idempotent — safe to run multiple times (uses upsert).
 *
 * ─────────────────────────────────────────────────────────
 * IMPORTANT:
 *   Dev passwords are read from .env (SEED_SHOP_PASSWORD,
 *   SEED_ADMIN_PASSWORD). Set strong passwords in production.
 *   NEVER commit real passwords to version control.
 * ─────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const Shop       = require('../models/Shop.model');
const User       = require('../models/User.model');
const { hashPassword } = require('../services/auth.service');

// ─── Dev / seed passwords ─────────────────────────────────
// Override these in .env for different environments.
const SHOP_PASSWORD  = process.env.SEED_SHOP_PASSWORD  || 'ShopPass123!';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!';
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@pixx.co.uk';

// ─── Shop definitions ─────────────────────────────────────
const SHOPS = [
  { name: 'Station Cycles',   code: 'STATION',   email: 'station@pixx.co.uk'   },
  { name: 'Camden Cycles',    code: 'CAMDEN',    email: 'camden@pixx.co.uk'    },
  { name: 'Chelsea Bikes',    code: 'CHELSEA',   email: 'chelsea@pixx.co.uk'   },
  { name: 'Edgware Cycles',   code: 'EDGWARE',   email: 'edgware@pixx.co.uk'   },
  { name: 'Southwark Cycles', code: 'SOUTHWARK', email: 'southwark@pixx.co.uk' },
  { name: 'Leebridge Cycles', code: 'LEEBRIDGE', email: 'leebridge@pixx.co.uk' },
];

// ─── Main seed function ───────────────────────────────────
const seed = async () => {
  console.log('\n🚲 Pixx Bicycle — Database Seed');
  console.log('══════════════════════════════════════════\n');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ Connected: ${mongoose.connection.host}\n`);

  // ── 1. Seed Shops ─────────────────────────────────────
  console.log('📍 Seeding shops...');
  const shopMap = {}; // code → Shop document

  for (const shopData of SHOPS) {
    const shop = await Shop.findOneAndUpdate(
      { code: shopData.code },
      { $set: shopData },
      { upsert: true, new: true, runValidators: true }
    );
    shopMap[shopData.code] = shop;
    console.log(`   ✓ ${shop.name} (${shop.code}) — _id: ${shop._id}`);
  }

  // ── 2. Seed Shop Users ────────────────────────────────
  console.log('\n👤 Seeding shop users...');
  const shopPasswordHash = await hashPassword(SHOP_PASSWORD);

  for (const shopData of SHOPS) {
    const shop  = shopMap[shopData.code];
    const email = `user.${shopData.code.toLowerCase()}@pixx.co.uk`;

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name:         `${shop.name} User`,
          email,
          passwordHash: shopPasswordHash,
          role:         'SHOP_USER',
          shopId:       shop._id,
          isActive:     true,
        },
      },
      { upsert: true, new: true, runValidators: false }
    );
    console.log(`   ✓ ${email}  →  ${shop.name}`);
  }

  // ── 3. Seed Admin ──────────────────────────────────────
  console.log('\n🔑 Seeding admin account...');
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name:         'Pixx Administrator',
        email:        ADMIN_EMAIL,
        passwordHash: adminPasswordHash,
        role:         'ADMIN',
        shopId:       null,
        isActive:     true,
      },
    },
    { upsert: true, new: true, runValidators: false }
  );
  console.log(`   ✓ ${ADMIN_EMAIL}  →  ADMIN (all shops)\n`);

  // ── Summary ───────────────────────────────────────────
  console.log('══════════════════════════════════════════');
  console.log('✅ Seed complete\n');
  console.log('📋 Development Credentials');
  console.log('   (Change these for production!)\n');
  console.log('   ADMIN:');
  console.log(`     Email    : ${ADMIN_EMAIL}`);
  console.log(`     Password : ${ADMIN_PASSWORD}\n`);
  console.log('   SHOP USERS:');
  for (const s of SHOPS) {
    const email = `user.${s.code.toLowerCase()}@pixx.co.uk`;
    console.log(`     ${s.name.padEnd(18)} : ${email}`);
  }
  console.log(`     Password (all): ${SHOP_PASSWORD}`);
  console.log('\n   ⚠️  Set SEED_SHOP_PASSWORD and SEED_ADMIN_PASSWORD');
  console.log('      in .env before running in production.\n');
};

seed()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
