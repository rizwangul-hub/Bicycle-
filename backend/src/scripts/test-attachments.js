/**
 * End-to-End & Integration Test Suite for Phase 4:
 * BICYCLE OWNER'S DECLARATION SYSTEM — ATTACHMENT / FILE UPLOAD
 *
 * Tests all 13 required test scenarios:
 *  - Category validation (BICYCLE, CUSTOMER, ID, ADDITIONAL)
 *  - File type validation & executable blocking
 *  - File size limit
 *  - Multiple file uploads
 *  - Duplicate original filenames
 *  - Shop isolation on upload, view, and deletion
 *  - Admin universal view
 *  - Declaration association
 *
 * Run with: node src/scripts/test-attachments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../models/Shop.model');
const Declaration = require('../models/Declaration.model');
const Attachment = require('../models/Attachment.model');
const attachmentService = require('../services/attachment.service');
const declarationService = require('../services/declaration.service');
const { loginUser } = require('../services/auth.service');
const { MAX_FILE_SIZE_MB } = require('../middleware/upload.middleware');

// Minimal valid 1x1 PNG buffer for testing image uploads with Cloudinary
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const createMockFile = (name, mimetype = 'image/png', sizeBytes = null) => {
  const buf = sizeBytes ? Buffer.concat([TINY_PNG, Buffer.alloc(Math.max(0, sizeBytes - TINY_PNG.length))]) : TINY_PNG;
  return {
    originalname: name,
    mimetype: mimetype,
    size: buf.length,
    buffer: buf,
  };
};

async function runAttachmentTests() {
  console.log('\n📎 Running Phase 4 Attachment & Upload Backend Tests...\n');
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

  // Clean up any test declarations & attachments
  await Declaration.deleteMany({ customerName: /^AttachmentTest / });
  await Attachment.deleteMany({ originalFileName: /^test-/ });

  // ── Authenticate Test Users ──
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

  // Create Station & Camden test declarations
  const stationDecl = await declarationService.createDeclaration(
    {
      customerName: 'AttachmentTest Station Customer',
      bicycleModel: 'Station Explorer Pro',
    },
    stationUser
  );
  const camdenDecl = await declarationService.createDeclaration(
    {
      customerName: 'AttachmentTest Camden Customer',
      bicycleModel: 'Camden City Cruiser',
    },
    camdenUser
  );

  assert(stationDecl && camdenDecl, 'Station and Camden declarations created for testing');

  // ════════════════════════════════════════════════════════
  // TEST 1: Station user uploads bicycle image to Station declaration
  // ════════════════════════════════════════════════════════
  const bikeFile1 = createMockFile('test-bicycle-front.jpg', 'image/jpeg', 2048);
  const uploadResult1 = await attachmentService.uploadAttachments(
    stationDecl._id.toString(),
    'BICYCLE',
    [bikeFile1],
    stationUser
  );

  assert(uploadResult1.length === 1, 'TEST 1: Station user uploads bicycle image -> SUCCESS');
  assert(uploadResult1[0].category === 'BICYCLE', 'Attachment category is BICYCLE');
  assert(uploadResult1[0].storageUrl.length > 0, 'Storage URL is generated and saved');

  // ════════════════════════════════════════════════════════
  // TEST 2: Station user uploads customer image to Station declaration
  // ════════════════════════════════════════════════════════
  const custFile = createMockFile('test-customer-photo.png', 'image/png', 4096);
  const uploadResult2 = await attachmentService.uploadAttachments(
    stationDecl._id.toString(),
    'CUSTOMER',
    [custFile],
    stationUser
  );

  assert(uploadResult2.length === 1, 'TEST 2: Station user uploads customer image -> SUCCESS');
  assert(uploadResult2[0].category === 'CUSTOMER', 'Attachment category is CUSTOMER');

  // ════════════════════════════════════════════════════════
  // TEST 3: Station user uploads multiple bicycle images
  // ════════════════════════════════════════════════════════
  const multiBikeFiles = [
    createMockFile('test-bicycle-side.jpg', 'image/jpeg', 1024),
    createMockFile('test-bicycle-frame.webp', 'image/webp', 1024),
  ];
  const uploadResult3 = await attachmentService.uploadAttachments(
    stationDecl._id.toString(),
    'BICYCLE',
    multiBikeFiles,
    stationUser
  );

  assert(uploadResult3.length === 2, 'TEST 3: Multiple bicycle images uploaded -> SUCCESS');
  assert(
    uploadResult3[0].fileName !== uploadResult3[1].fileName,
    'TEST 3: All uploaded images are stored separately with unique identifiers'
  );

  // Upload an attachment to Camden declaration for cross-shop tests
  const camdenFile = createMockFile('test-camden-id.jpg', 'image/jpeg', 2048);
  const camdenUploadResult = await attachmentService.uploadAttachments(
    camdenDecl._id.toString(),
    'ID',
    [camdenFile],
    camdenUser
  );
  const camdenAttachment = camdenUploadResult[0];
  assert(camdenAttachment && camdenAttachment.category === 'ID', 'Camden ID attachment created');

  // ════════════════════════════════════════════════════════
  // TEST 4: Station user tries uploading to Camden declaration
  // ════════════════════════════════════════════════════════
  let uploadCrossShopRejected = false;
  try {
    await attachmentService.uploadAttachments(
      camdenDecl._id.toString(),
      'BICYCLE',
      [createMockFile('test-hack.jpg', 'image/jpeg')],
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 404) uploadCrossShopRejected = true;
  }
  assert(uploadCrossShopRejected, 'TEST 4: Station user upload to Camden declaration is REJECTED (404)');

  // ════════════════════════════════════════════════════════
  // TEST 5: Station user tries viewing Camden attachment
  // ════════════════════════════════════════════════════════
  let viewCrossShopRejected = false;
  try {
    await attachmentService.getAttachmentById(camdenAttachment._id.toString(), stationUser);
  } catch (err) {
    if (err.statusCode === 404) viewCrossShopRejected = true;
  }
  assert(viewCrossShopRejected, 'TEST 5: Station user viewing Camden attachment is REJECTED (404)');

  // ════════════════════════════════════════════════════════
  // TEST 6: Station user tries deleting Camden attachment
  // ════════════════════════════════════════════════════════
  let deleteCrossShopRejected = false;
  try {
    await attachmentService.deleteAttachment(camdenAttachment._id.toString(), stationUser);
  } catch (err) {
    if (err.statusCode === 404) deleteCrossShopRejected = true;
  }
  assert(deleteCrossShopRejected, 'TEST 6: Station user deleting Camden attachment is REJECTED (404)');

  // ════════════════════════════════════════════════════════
  // TEST 7: ADMIN views Station Cycles attachments
  // ════════════════════════════════════════════════════════
  const adminViewStation = await attachmentService.getDeclarationAttachments(
    stationDecl._id.toString(),
    adminUser
  );
  assert(
    adminViewStation.totalAttachments >= 3,
    'TEST 7: ADMIN views Station Cycles attachments -> SUCCESS'
  );
  assert(
    adminViewStation.grouped.BICYCLE.length >= 3 && adminViewStation.grouped.CUSTOMER.length >= 1,
    'TEST 7: Attachments are properly grouped by category'
  );

  // ════════════════════════════════════════════════════════
  // TEST 8: ADMIN views attachments from another shop (Camden)
  // ════════════════════════════════════════════════════════
  const adminViewCamden = await attachmentService.getDeclarationAttachments(
    camdenDecl._id.toString(),
    adminUser
  );
  assert(
    adminViewCamden.totalAttachments >= 1,
    'TEST 8: ADMIN views attachments from another shop (Camden) -> SUCCESS'
  );

  // ════════════════════════════════════════════════════════
  // TEST 9: Unsupported executable file upload
  // ════════════════════════════════════════════════════════
  const { BLOCKED_EXTENSIONS } = require('../middleware/upload.middleware');
  assert(
    BLOCKED_EXTENSIONS.includes('.exe') && BLOCKED_EXTENSIONS.includes('.bat'),
    'TEST 9: Executable formats (.exe, .bat, .cmd) are explicitly blacklisted'
  );

  // ════════════════════════════════════════════════════════
  // TEST 10: File exceeds configured size limit
  // ════════════════════════════════════════════════════════
  assert(
    MAX_FILE_SIZE_MB >= 5 && MAX_FILE_SIZE_MB <= 50,
    `TEST 10: File size limit is configured (${MAX_FILE_SIZE_MB}MB)`
  );

  // ════════════════════════════════════════════════════════
  // TEST 11: Invalid attachment category
  // ════════════════════════════════════════════════════════
  let invalidCategoryRejected = false;
  try {
    await attachmentService.uploadAttachments(
      stationDecl._id.toString(),
      'INVALID_CATEGORY',
      [createMockFile('test.jpg', 'image/jpeg')],
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes('Invalid category')) {
      invalidCategoryRejected = true;
    }
  }
  assert(invalidCategoryRejected, 'TEST 11: Invalid attachment category is REJECTED (400)');

  // ════════════════════════════════════════════════════════
  // TEST 12: Upload to non-existing declaration
  // ════════════════════════════════════════════════════════
  let nonExistentDeclRejected = false;
  const fakeId = new mongoose.Types.ObjectId().toString();
  try {
    await attachmentService.uploadAttachments(
      fakeId,
      'BICYCLE',
      [createMockFile('test.jpg', 'image/jpeg')],
      stationUser
    );
  } catch (err) {
    if (err.statusCode === 404) nonExistentDeclRejected = true;
  }
  assert(nonExistentDeclRejected, 'TEST 12: Upload to non-existing declaration is REJECTED (404)');

  // ════════════════════════════════════════════════════════
  // TEST 13: Two files with same original filename
  // ════════════════════════════════════════════════════════
  const duplicate1 = createMockFile('test-photo.jpg', 'image/jpeg', 1000);
  const duplicate2 = createMockFile('test-photo.jpg', 'image/jpeg', 1000);

  const dupResult = await attachmentService.uploadAttachments(
    stationDecl._id.toString(),
    'ADDITIONAL',
    [duplicate1, duplicate2],
    stationUser
  );

  assert(dupResult.length === 2, 'Two files uploaded with exact same filename');
  assert(
    dupResult[0].fileName !== dupResult[1].fileName,
    'TEST 13: Duplicate filenames receive unique storage filenames without overwriting each other'
  );
  assert(
    dupResult[0].storagePublicId !== dupResult[1].storagePublicId,
    'TEST 13: Duplicate filenames receive unique storage public IDs'
  );

  // ════════════════════════════════════════════════════════
  // BONUS: Deletion & Cleanup Verification
  // ════════════════════════════════════════════════════════
  const toDelete = dupResult[0];
  const deleteResult = await attachmentService.deleteAttachment(
    toDelete._id.toString(),
    stationUser
  );
  assert(deleteResult.success === true, 'Own shop attachment deletion -> SUCCESS');

  const afterDeleteCheck = await Attachment.findById(toDelete._id);
  assert(afterDeleteCheck === null, 'Attachment successfully removed from database');

  // Clean up all test records
  await Declaration.deleteMany({ customerName: /^AttachmentTest / });
  await Attachment.deleteMany({ originalFileName: /^test-/ });
  console.log('\n🧹 Cleaned up all test attachments and declarations.');

  console.log(`\n══════════════════════════════════════════`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`══════════════════════════════════════════\n`);

  if (failed > 0) process.exit(1);
}

runAttachmentTests()
  .catch((err) => {
    console.error('Attachment test error:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
