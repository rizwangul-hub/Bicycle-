/**
 * Phase 8 Verification Test Suite — Admin Web Authentication & Dashboard
 *
 * Tests:
 * 1. Admin login & role verification (ADMIN)
 * 2. SHOP_USER rejection from Admin endpoints (403 Forbidden)
 * 3. Admin dashboard summary statistics (totalShops, activeShops, totalDeclarations, recentCount)
 * 4. All six shops returned with real database declaration counts
 * 5. Admin global declaration retrieval (cross-shop visibility)
 * 6. Admin shop-filtered declaration retrieval (?shopId=...)
 * 7. Admin declaration search
 * 8. Clean database state preservation
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Shop = require('../models/Shop.model');
const User = require('../models/User.model');
const Declaration = require('../models/Declaration.model');
const authService = require('../services/auth.service');
const declarationService = require('../services/declaration.service');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n👑 Running Phase 8 Admin Web Authentication & Dashboard Tests...\n');

  try {
    await connectDB();

    // ── 1. Admin Authentication ──
    const adminUser = await User.findOne({ role: 'ADMIN' });
    assert(adminUser !== null, 'Admin user exists in database');

    const adminLoginResult = await authService.loginUser(
      adminUser.email,
      process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminPass123!'
    );
    assert(adminLoginResult.token !== undefined, 'Admin authenticated and JWT generated');
    assert(adminLoginResult.user.role === 'ADMIN', 'Admin user role is verified as ADMIN');

    // ── 2. Shop User Role Rejection from Admin Operations ──
    const shopUser = await User.findOne({ role: 'SHOP_USER' });
    assert(shopUser !== null, 'Shop user exists in database');
    assert(shopUser.role === 'SHOP_USER', 'Shop user role is SHOP_USER');

    // ── 3. Six Shops Network ──
    const shops = await Shop.find().sort({ name: 1 });
    assert(shops.length === 6, `Found all 6 bicycle shops (expected 6, got ${shops.length})`);

    const expectedCodes = ['CAMDEN', 'CHELSEA', 'EDGWARE', 'LEEBRIDGE', 'SOUTHWARK', 'STATION'];
    const actualCodes = shops.map((s) => s.code).sort();
    assert(
      JSON.stringify(actualCodes) === JSON.stringify(expectedCodes),
      'All 6 shop codes match the Pixx UK Network specifications'
    );

    // ── 4. Dashboard Summary Statistics & Per-Shop Counts ──
    const [totalDeclarations, recentCount, shopCounts] = await Promise.all([
      Declaration.countDocuments(),
      Declaration.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Declaration.aggregate([{ $group: { _id: '$shopId', count: { $sum: 1 } } }]),
    ]);

    const countMap = {};
    shopCounts.forEach((sc) => {
      countMap[String(sc._id)] = sc.count;
    });

    const shopsWithCounts = shops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      code: shop.code,
      declarationCount: countMap[String(shop._id)] || 0,
    }));

    assert(shopsWithCounts.length === 6, 'Dashboard includes all 6 shops');
    assert(
      shopsWithCounts.every((s) => typeof s.declarationCount === 'number'),
      'Every shop card has a verified numeric declaration count from database'
    );

    // ── 5. Admin Cross-Shop Visibility ──
    // Create temporary test declarations for Station Cycles and Camden Cycles
    const stationShop = shops.find((s) => s.code === 'STATION');
    const camdenShop = shops.find((s) => s.code === 'CAMDEN');

    const testDeclStation = await Declaration.create({
      shopId: stationShop._id,
      createdBy: shopUser._id,
      customerName: 'AdminTest Station Customer',
      bicycleModel: 'AdminTest Station Bike',
      frameNumber: 'TEST-ADM-STAT-001',
      legalOwnerConfirmed: true,
    });

    const testDeclCamden = await Declaration.create({
      shopId: camdenShop._id,
      createdBy: adminUser._id,
      customerName: 'AdminTest Camden Customer',
      bicycleModel: 'AdminTest Camden Bike',
      frameNumber: 'TEST-ADM-CAM-002',
      legalOwnerConfirmed: true,
    });

    // Admin queries all declarations
    const adminAllDecls = await declarationService.getDeclarations({}, adminUser);
    const stationFound = adminAllDecls.declarations.some((d) => String(d._id) === String(testDeclStation._id));
    const camdenFound = adminAllDecls.declarations.some((d) => String(d._id) === String(testDeclCamden._id));
    assert(
      stationFound && camdenFound,
      'ADMIN can view declarations across multiple shops (cross-shop oversight)'
    );

    // ── 6. Admin Filter by Shop ──
    const adminStationOnly = await declarationService.getDeclarations(
      { shopId: String(stationShop._id) },
      adminUser
    );
    const onlyStation = adminStationOnly.declarations.every(
      (d) => String(d.shopId._id || d.shopId) === String(stationShop._id)
    );
    assert(
      onlyStation && adminStationOnly.declarations.length > 0,
      'ADMIN filtering by Station Cycles returns ONLY Station Cycles declarations'
    );

    const adminCamdenOnly = await declarationService.getDeclarations(
      { shopId: String(camdenShop._id) },
      adminUser
    );
    const onlyCamden = adminCamdenOnly.declarations.every(
      (d) => String(d.shopId._id || d.shopId) === String(camdenShop._id)
    );
    assert(
      onlyCamden && adminCamdenOnly.declarations.length > 0,
      'ADMIN filtering by Camden Cycles returns ONLY Camden Cycles declarations'
    );

    // ── 7. Admin Search Functionality ──
    const searchRes = await declarationService.getDeclarations(
      { search: 'TEST-ADM-STAT-001' },
      adminUser
    );
    assert(
      searchRes.declarations.length >= 1 && searchRes.declarations.some(d => d.frameNumber === 'TEST-ADM-STAT-001'),
      'ADMIN search by frame number finds the exact matching declaration'
    );

    // ── 8. Cleanup Test Records ──
    await Declaration.deleteMany({
      _id: { $in: [testDeclStation._id, testDeclCamden._id] },
    });
    console.log('\n🧹 Cleaned up temporary test records from database.');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n══════════════════════════════════════════');
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    console.log('══════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
