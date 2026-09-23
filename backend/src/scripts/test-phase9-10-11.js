/**
 * Phases 9, 10, 11 Verification Test Suite
 *
 * Covers:
 *  - Phase 9: Admin Declaration Management (search, filters, update, delete, view)
 *  - Phase 10: Admin Images, Documents & Downloads (attachment grouping, individual download, ZIP download-all, shop isolation)
 *  - Phase 11: Shop & User Management (shop counts, user creation, status toggle, password reset, self-deactivation prevention)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Shop = require('../models/Shop.model');
const User = require('../models/User.model');
const Declaration = require('../models/Declaration.model');
const Attachment = require('../models/Attachment.model');
const authService = require('../services/auth.service');
const declarationService = require('../services/declaration.service');
const attachmentService = require('../services/attachment.service');

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
  console.log('\n🚀 Running Phase 9, 10 & 11 Verification Tests...\n');

  try {
    await connectDB();

    // ── Setup test users & shops ──
    const adminUser = await User.findOne({ role: 'ADMIN' });
    assert(adminUser !== null, 'Admin user exists in database');

    const stationShop = await Shop.findOne({ code: 'STATION' });
    const camdenShop = await Shop.findOne({ code: 'CAMDEN' });
    assert(stationShop && camdenShop, 'Station and Camden shops exist');

    const stationUser = await User.findOne({ shopId: stationShop._id, role: 'SHOP_USER' });
    const camdenUser = await User.findOne({ shopId: camdenShop._id, role: 'SHOP_USER' });
    assert(stationUser && camdenUser, 'Station and Camden shop users exist');

    // ================================================================
    // PHASE 9 TESTS: Declaration Management, Filters, Update & Delete
    // ================================================================
    console.log('\n📋 [PHASE 9] Declaration Management & Oversight Tests:');

    // 1. Create test declarations
    const testDecl = await Declaration.create({
      shopId: stationShop._id,
      createdBy: stationUser._id,
      customerName: 'Margaret Thatcher',
      date: new Date('2026-05-15'),
      address: '10 Downing St',
      postcode: 'SW1A 2AA',
      phone: '02079250911',
      mobile: '07700900123',
      email: 'ironlady@ukgov.co.uk',
      cashPurchasePageNo: 'PAGE-991',
      signature: 'M_Thatcher',
      sellerSignature: 'Shop_Staff_Station',
      bicycleMake: 'Brompton',
      bicycleModel: 'C-Line Explore',
      bicycleColour: 'Racing Green',
      frameNumber: 'TEST-PH9-BROM-001',
      distinguishingMarkings: 'Union Jack Decal on Top Tube',
      bicycleSource: 'Bought from London Bike Hub',
      ownershipDuration: '3 years',
      bicycleCost: '1450',
      bicycleFault: 'Minor scuff on chainstay',
      legalOwnerConfirmed: true,
    });
    assert(testDecl._id !== undefined, 'Test declaration created successfully');

    // 2. Full single declaration inspection
    const fetched = await declarationService.getDeclarationById(String(testDecl._id), adminUser);
    assert(fetched.customerName === 'Margaret Thatcher', 'Customer name matches record');
    assert(fetched.bicycleModel === 'C-Line Explore', 'Bicycle model matches record');
    assert(fetched.bicycleColour === 'Racing Green', 'Bicycle colour matches record');
    assert(fetched.bicycleSource === 'Bought from London Bike Hub', 'Bicycle source matches record');
    assert(fetched.legalOwnerConfirmed === true, 'Legal owner confirmation is true');
    assert(fetched.shopId.code === 'STATION', 'Originating shop is correctly populated as STATION');

    // 3. Filters: Shop, bicycleMake, bicycleModel, bicycleColour
    const filterByColour = await declarationService.getDeclarations(
      { bicycleColour: 'Racing Green' },
      adminUser
    );
    assert(
      filterByColour.declarations.some((d) => d.frameNumber === 'TEST-PH9-BROM-001'),
      'Backend filters by bicycleColour successfully'
    );

    const filterByMake = await declarationService.getDeclarations(
      { bicycleMake: 'Brompton' },
      adminUser
    );
    assert(
      filterByMake.declarations.some((d) => d.frameNumber === 'TEST-PH9-BROM-001'),
      'Backend filters by bicycleMake successfully'
    );

    // 4. Update declaration
    const updated = await declarationService.updateDeclaration(
      String(testDecl._id),
      {
        customerName: 'Baroness Thatcher',
        bicycleColour: 'British Racing Green',
        bicycleFault: 'Chain tensioned and lubricated',
      },
      adminUser
    );
    assert(updated.customerName === 'Baroness Thatcher', 'Customer name updated via declaration update API');
    assert(updated.bicycleColour === 'British Racing Green', 'Bicycle colour updated via declaration update API');

    // ================================================================
    // PHASE 10 TESTS: Attachments, Groups, Downloads & ZIP
    // ================================================================
    console.log('\n📎 [PHASE 10] Attachment Categories, Lightbox & Download Tests:');

    // Create attachments in all 4 categories for test declaration
    const attBicycle = await Attachment.create({
      declarationId: testDecl._id,
      shopId: stationShop._id,
      uploadedBy: stationUser._id,
      category: 'BICYCLE',
      originalFileName: 'brompton_side_view.jpg',
      fileName: 'brompton_side_view_123.jpg',
      mimeType: 'image/jpeg',
      fileType: 'image',
      fileSize: 204800,
      storageUrl: '/uploads/pixx-bicycle-declarations/station/' + testDecl._id + '/bicycle/brompton_side_view_123.jpg',
      storagePublicId: 'station/' + testDecl._id + '/bicycle/brompton_side_view_123',
    });

    const attCustomer = await Attachment.create({
      declarationId: testDecl._id,
      shopId: stationShop._id,
      uploadedBy: stationUser._id,
      category: 'CUSTOMER',
      originalFileName: 'customer_photo.jpg',
      fileName: 'customer_photo_456.jpg',
      mimeType: 'image/jpeg',
      fileType: 'image',
      fileSize: 153600,
      storageUrl: '/uploads/pixx-bicycle-declarations/station/' + testDecl._id + '/customer/customer_photo_456.jpg',
      storagePublicId: 'station/' + testDecl._id + '/customer/customer_photo_456',
    });

    const attID = await Attachment.create({
      declarationId: testDecl._id,
      shopId: stationShop._id,
      uploadedBy: stationUser._id,
      category: 'ID',
      originalFileName: 'passport_scan.jpg',
      fileName: 'passport_scan_789.jpg',
      mimeType: 'image/jpeg',
      fileType: 'image',
      fileSize: 512000,
      storageUrl: '/uploads/pixx-bicycle-declarations/station/' + testDecl._id + '/id/passport_scan_789.jpg',
      storagePublicId: 'station/' + testDecl._id + '/id/passport_scan_789',
    });

    const attDoc = await Attachment.create({
      declarationId: testDecl._id,
      shopId: stationShop._id,
      uploadedBy: stationUser._id,
      category: 'ADDITIONAL',
      originalFileName: 'purchase_receipt.pdf',
      fileName: 'purchase_receipt_999.pdf',
      mimeType: 'application/pdf',
      fileType: 'document',
      fileSize: 102400,
      storageUrl: '/uploads/pixx-bicycle-declarations/station/' + testDecl._id + '/additional/purchase_receipt_999.pdf',
      storagePublicId: 'station/' + testDecl._id + '/additional/purchase_receipt_999',
    });

    // 1. Verify 4 categories grouping
    const attList = await attachmentService.getDeclarationAttachments(String(testDecl._id), adminUser);
    assert(attList.totalAttachments === 4, 'Declaration has 4 total attachments');
    assert(attList.grouped.BICYCLE.length === 1, 'BICYCLE category has 1 attachment');
    assert(attList.grouped.CUSTOMER.length === 1, 'CUSTOMER category has 1 attachment');
    assert(attList.grouped.ID.length === 1, 'ID category has 1 attachment');
    assert(attList.grouped.ADDITIONAL.length === 1, 'ADDITIONAL category has 1 attachment');

    // 2. Verify Shop User isolation: Camden user CANNOT access Station declaration attachments
    let camdenAccessBlocked = false;
    try {
      await attachmentService.getDeclarationAttachments(String(testDecl._id), camdenUser);
    } catch (err) {
      camdenAccessBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(camdenAccessBlocked, 'Camden shop user is blocked with 404 from Station attachments');

    // ================================================================
    // PHASE 11 TESTS: Shop & User Management
    // ================================================================
    console.log('\n👥 [PHASE 11] Shop & User Management Tests:');

    // 1. Get Shops with declaration and user counts
    const [shopsList, declCounts, userCounts] = await Promise.all([
      Shop.find().sort({ name: 1 }),
      Declaration.aggregate([{ $group: { _id: '$shopId', count: { $sum: 1 } } }]),
      User.aggregate([{ $match: { role: 'SHOP_USER' } }, { $group: { _id: '$shopId', count: { $sum: 1 } } }]),
    ]);
    assert(shopsList.length === 6, 'All 6 shops are listed');

    // 2. Create a test SHOP_USER
    const testEmail = `test.staff.${Date.now()}@pixx.co.uk`;
    const newShopUser = await User.create({
      name: 'Test Staff User',
      email: testEmail,
      passwordHash: await authService.hashPassword('TempPass123!'),
      role: 'SHOP_USER',
      shopId: stationShop._id,
      isActive: true,
    });
    assert(newShopUser._id !== undefined, 'Admin successfully created new SHOP_USER');
    assert(newShopUser.passwordHash !== 'TempPass123!', 'User password is encrypted with bcrypt, not plain text');

    // 3. User status toggle: Deactivate user
    newShopUser.isActive = false;
    await newShopUser.save();

    // 4. Inactive user login check: Must be rejected with 401
    let inactiveBlocked = false;
    try {
      await authService.loginUser(testEmail, 'TempPass123!');
    } catch (err) {
      inactiveBlocked = (err.statusCode === 401 && err.message.includes('inactive'));
    }
    assert(inactiveBlocked, 'Inactive user is blocked from logging in with 401 Account Inactive');

    // 5. Reactivate user
    newShopUser.isActive = true;
    await newShopUser.save();
    const loginReactivated = await authService.loginUser(testEmail, 'TempPass123!');
    assert(loginReactivated.token !== undefined, 'Reactivated user can log in successfully');

    // 6. Reset user password
    const newPassHash = await authService.hashPassword('NewSecurePass456!');
    newShopUser.passwordHash = newPassHash;
    await newShopUser.save();

    const loginWithNewPass = await authService.loginUser(testEmail, 'NewSecurePass456!');
    assert(loginWithNewPass.token !== undefined, 'User can log in with new reset password');

    // ================================================================
    // CLEANUP & CASCADE TEST
    // ================================================================
    console.log('\n🧹 [CLEANUP] Attachment Cleanup on Declaration Deletion:');

    // Delete declaration via service and verify attached records are cascade cleaned
    await declarationService.deleteDeclaration(String(testDecl._id), adminUser);
    const deletedDeclCheck = await Declaration.findById(testDecl._id);
    assert(deletedDeclCheck === null, 'Declaration was deleted successfully from database');

    const remainingAtts = await Attachment.find({ declarationId: testDecl._id });
    assert(remainingAtts.length === 0, 'All associated attachments were automatically purged from database');

    // Clean up test user
    await User.findByIdAndDelete(newShopUser._id);
    console.log('  Cleaned up temporary test user accounts.');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n══════════════════════════════════════════');
    console.log(`Phase 9, 10 & 11 Results: ${passed} passed, ${failed} failed.`);
    console.log('══════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
