/**
 * End-to-End & Integration Test Suite for Phase 3:
 * BICYCLE OWNER'S DECLARATION SYSTEM
 *
 * Tests all 12 required security & functional test scenarios plus:
 *  - Pagination
 *  - Sorting
 *  - Multi-field search
 *  - Immutable fields protection
 *
 * Run with: node src/scripts/test-declarations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../models/Shop.model');
const User = require('../models/User.model');
const Declaration = require('../models/Declaration.model');
const declarationService = require('../services/declaration.service');
const { loginUser } = require('../services/auth.service');

async function runDeclarationTests() {
  console.log('\n🚲 Running Phase 3 Declaration Backend Tests...\n');
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

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}\n`);

  // Clean up any previous test declarations
  await Declaration.deleteMany({ customerName: /^Test / });

  // ── Setup: Retrieve Users & Shops ──
  const stationShop = await Shop.findOne({ code: 'STATION' });
  const camdenShop = await Shop.findOne({ code: 'CAMDEN' });

  assert(stationShop && camdenShop, 'Station and Camden shops exist in DB');

  const { user: stationUser } = await loginUser(
    'user.station@pixx.co.uk',
    process.env.SEED_SHOP_PASSWORD || 'ShopPass123!'
  );
  const { user: camdenUser } = await loginUser(
    'user.camden@pixx.co.uk',
    process.env.SEED_SHOP_PASSWORD || 'ShopPass123!'
  );
  const { user: adminUser } = await loginUser(
    process.env.SEED_ADMIN_EMAIL || 'admin@pixx.co.uk',
    process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!'
  );

  assert(stationUser && camdenUser && adminUser, 'Station user, Camden user, and Admin authenticated');

  // ════════════════════════════════════════════════════════
  // TEST 1: Station user creates declaration -> shopId is Station
  // ════════════════════════════════════════════════════════
  const stationDeclData = {
    customerName: 'Test Alice Smith',
    bicycleModel: 'Roadmaster 3000',
    bicycleMake: 'Trek',
    frameNumber: 'FR-STATION-001',
    phone: '07111222333',
    email: 'alice@example.com',
    bicycleCost: '450.00',
    legalOwnerConfirmed: true,
  };

  const stationDeclaration = await declarationService.createDeclaration(stationDeclData, stationUser);
  assert(
    stationDeclaration.shopId._id.toString() === stationShop._id.toString(),
    'TEST 1: Station user creates declaration -> shopId belongs to Station Cycles'
  );
  assert(stationDeclaration.customerName === 'Test Alice Smith', 'Customer name is saved properly');
  assert(stationDeclaration.bicycleModel === 'Roadmaster 3000', 'Bicycle model is saved properly');

  // ════════════════════════════════════════════════════════
  // TEST 2: Station user tries to create using Camden's shopId
  // ════════════════════════════════════════════════════════
  const spoofDeclData = {
    customerName: 'Test Spoof Customer',
    bicycleModel: 'Speedster 500',
    shopId: camdenShop._id.toString(), // Trying to spoof Camden shopId
  };

  const spoofedDeclaration = await declarationService.createDeclaration(spoofDeclData, stationUser);
  assert(
    spoofedDeclaration.shopId._id.toString() === stationShop._id.toString(),
    'TEST 2: Backend ignored spoofed shopId and assigned Station Cycles shopId'
  );
  assert(
    spoofedDeclaration.shopId._id.toString() !== camdenShop._id.toString(),
    'TEST 2: Spoofed declaration does NOT belong to Camden Cycles'
  );

  // Create a genuine Camden declaration for cross-shop testing
  const camdenDeclData = {
    customerName: 'Test Bob Jones',
    bicycleModel: 'Mountain Peak 7',
    bicycleMake: 'Specialized',
    frameNumber: 'FR-CAMDEN-999',
    phone: '07999888777',
    email: 'bob.camden@example.com',
    legalOwnerConfirmed: true,
  };
  const camdenDeclaration = await declarationService.createDeclaration(camdenDeclData, camdenUser);
  assert(
    camdenDeclaration.shopId._id.toString() === camdenShop._id.toString(),
    'Genuine Camden declaration created under Camden shopId'
  );

  // ════════════════════════════════════════════════════════
  // TEST 3: Station user gets declarations -> only Station records
  // ════════════════════════════════════════════════════════
  const stationList = await declarationService.getDeclarations({}, stationUser);
  const allBelongToStation = stationList.declarations.every(
    (d) => d.shopId._id.toString() === stationShop._id.toString()
  );
  assert(allBelongToStation, 'TEST 3: Station user list returns ONLY Station Cycles records');

  // Even if Station user queries with ?shopId=CAMDEN
  const stationHackedQuery = await declarationService.getDeclarations(
    { shopId: camdenShop._id.toString() },
    stationUser
  );
  const stillAllStation = stationHackedQuery.declarations.every(
    (d) => d.shopId._id.toString() === stationShop._id.toString()
  );
  assert(stillAllStation, 'TEST 3: Station user cannot override shopId via query parameters');

  // ════════════════════════════════════════════════════════
  // TEST 4: Station user tries to access Camden declaration ID
  // ════════════════════════════════════════════════════════
  let accessDenied = false;
  try {
    await declarationService.getDeclarationById(camdenDeclaration._id.toString(), stationUser);
  } catch (err) {
    if (err.statusCode === 404) accessDenied = true;
  }
  assert(accessDenied, 'TEST 4: Station user access to Camden declaration ID is rejected with 404 Not Found');

  // ════════════════════════════════════════════════════════
  // TEST 5: Station user searches for Camden customer name
  // ════════════════════════════════════════════════════════
  const stationSearch = await declarationService.getDeclarations(
    { search: 'Bob Jones' },
    stationUser
  );
  assert(
    stationSearch.declarations.length === 0,
    'TEST 5: Station user search for Camden customer "Bob Jones" returns 0 records'
  );

  // ════════════════════════════════════════════════════════
  // TEST 6: ADMIN requests declarations -> sees across all shops
  // ════════════════════════════════════════════════════════
  const adminList = await declarationService.getDeclarations({ search: 'Test' }, adminUser);
  const hasStation = adminList.declarations.some(
    (d) => d.shopId._id.toString() === stationShop._id.toString()
  );
  const hasCamden = adminList.declarations.some(
    (d) => d.shopId._id.toString() === camdenShop._id.toString()
  );
  assert(hasStation && hasCamden, 'TEST 6: ADMIN can see declarations across all shops (Station & Camden)');

  // ════════════════════════════════════════════════════════
  // TEST 7: ADMIN filters by shopId
  // ════════════════════════════════════════════════════════
  const adminCamdenFilter = await declarationService.getDeclarations(
    { shopId: camdenShop._id.toString(), search: 'Test' },
    adminUser
  );
  const onlyCamden = adminCamdenFilter.declarations.every(
    (d) => d.shopId._id.toString() === camdenShop._id.toString()
  );
  assert(onlyCamden && adminCamdenFilter.declarations.length > 0, 'TEST 7: ADMIN filters by Camden shopId -> returns only Camden records');

  // ════════════════════════════════════════════════════════
  // TEST 8: SHOP_USER tries to update another shop's declaration
  // ════════════════════════════════════════════════════════
  let updateRejected = false;
  try {
    await declarationService.updateDeclaration(
      camdenDeclaration._id.toString(),
      { customerName: 'Hacked Name' },
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 404) updateRejected = true;
  }
  assert(updateRejected, 'TEST 8: Station user cannot update Camden declaration (rejected with 404)');

  // Verify own update works and protects immutable fields
  const updatedStation = await declarationService.updateDeclaration(
    stationDeclaration._id.toString(),
    {
      customerName: 'Test Alice Updated',
      shopId: camdenShop._id.toString(), // attempting to change shopId
      createdAt: new Date('2020-01-01'), // attempting to change createdAt
    },
    stationUser
  );
  assert(updatedStation.customerName === 'Test Alice Updated', 'Station user can update own declaration');
  assert(
    updatedStation.shopId._id.toString() === stationShop._id.toString(),
    'Immutable check: shopId cannot be modified during update'
  );
  assert(
    updatedStation.createdAt.getFullYear() !== 2020,
    'Immutable check: createdAt cannot be modified during update'
  );

  // ════════════════════════════════════════════════════════
  // TEST 9: SHOP_USER tries to delete another shop's declaration
  // ════════════════════════════════════════════════════════
  let deleteRejected = false;
  try {
    await declarationService.deleteDeclaration(
      camdenDeclaration._id.toString(),
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 404) deleteRejected = true;
  }
  assert(deleteRejected, 'TEST 9: Station user cannot delete Camden declaration (rejected with 404)');

  // ════════════════════════════════════════════════════════
  // TEST 10: Missing customerName -> validation fails
  // ════════════════════════════════════════════════════════
  let missingNameFailed = false;
  try {
    await declarationService.createDeclaration(
      { customerName: '   ', bicycleModel: 'Model X' },
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('Customer name')) {
      missingNameFailed = true;
    }
  }
  assert(missingNameFailed, 'TEST 10: Blank or missing customerName is rejected with 400');

  // ════════════════════════════════════════════════════════
  // TEST 11: Missing bicycleModel -> validation fails
  // ════════════════════════════════════════════════════════
  let missingModelFailed = false;
  try {
    await declarationService.createDeclaration(
      { customerName: 'Valid Name', bicycleModel: '' },
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('Bicycle model')) {
      missingModelFailed = true;
    }
  }
  assert(missingModelFailed, 'TEST 11: Blank or missing bicycleModel is rejected with 400');

  // ════════════════════════════════════════════════════════
  // TEST 12: Only customerName and bicycleModel provided -> succeeds
  // ════════════════════════════════════════════════════════
  const minimalDecl = await declarationService.createDeclaration(
    {
      customerName: 'Test Minimalist Customer',
      bicycleModel: 'Basic Cruiser 100',
    },
    stationUser
  );
  assert(minimalDecl && minimalDecl._id, 'TEST 12: Declaration created with ONLY customerName and bicycleModel');
  assert(minimalDecl.bicycleMake === null, 'Optional bicycleMake defaults to null');
  assert(minimalDecl.frameNumber === null, 'Optional frameNumber defaults to null');
  assert(minimalDecl.phone === null, 'Optional phone defaults to null');

  // ════════════════════════════════════════════════════════
  // BONUS: Search & Pagination & Sorting Verification
  // ════════════════════════════════════════════════════════
  const searchByFrame = await declarationService.getDeclarations(
    { search: 'FR-CAMDEN-999' },
    camdenUser
  );
  assert(
    searchByFrame.declarations.length === 1 && searchByFrame.declarations[0].frameNumber === 'FR-CAMDEN-999',
    'Search by frame number returns matching record'
  );

  const paginated = await declarationService.getDeclarations(
    { page: 1, limit: 2 },
    adminUser
  );
  assert(paginated.pagination.page === 1, 'Pagination: page number is correct');
  assert(paginated.pagination.limit === 2, 'Pagination: limit is enforced');
  assert(paginated.pagination.total >= 3, 'Pagination: total count is accurate');
  assert(paginated.pagination.totalPages >= 2, 'Pagination: totalPages is calculated');

  // Clean up test declarations
  await Declaration.deleteMany({ customerName: /^Test / });
  console.log('\n🧹 Cleaned up test records from database.');

  console.log(`\n══════════════════════════════════════════`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`══════════════════════════════════════════\n`);

  if (failed > 0) process.exit(1);
}

runDeclarationTests()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
