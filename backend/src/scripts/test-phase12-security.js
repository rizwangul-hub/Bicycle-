/**
 * Phase 12 Final Security, Testing & Stability Audit Suite
 * Pixx Bicycle Owner's Declaration System
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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

async function runSecurityAudit() {
  console.log('\n🔒 Starting Phase 12 Security, Testing & Stability Audit...\n');

  try {
    await connectDB();

    // ── 1. Password Security Audit ──────────────────────────────
    console.log('🔑 [1] Password Security & Cryptographic Hashing:');
    const allUsers = await User.find().select('+passwordHash');
    const allHashed = allUsers.every(
      (u) => u.passwordHash && u.passwordHash.startsWith('$2') && u.passwordHash.length >= 50
    );
    assert(allHashed, 'All user passwords in database are cryptographically hashed using bcrypt');

    const defaultUserQuery = await User.findOne();
    assert(
      defaultUserQuery.passwordHash === undefined,
      'passwordHash is strictly hidden by default (select: false)'
    );

    let invalidAuthCaught = false;
    try {
      await authService.loginUser(defaultUserQuery.email, 'WrongPassword123!');
    } catch (err) {
      invalidAuthCaught = (err.statusCode === 401 && err.message === 'Invalid credentials');
    }
    assert(invalidAuthCaught, 'Invalid password attempt rejected with generic 401 Invalid credentials');

    // ── 2. JWT Security & Expiry ───────────────────────────────
    console.log('\n🎫 [2] JWT Signature Verification & Tamper Resistance:');
    assert(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16, 'JWT_SECRET is configured in environment');

    const adminUser = await User.findOne({ role: 'ADMIN' });
    const token = authService.generateToken(adminUser);
    const decoded = jwt.decode(token);
    assert(decoded.userId && decoded.role, 'JWT payload contains authenticated identity and role');
    assert(!decoded.password && !decoded.passwordHash, 'JWT payload does not leak credentials');

    let tamperedRejected = false;
    try {
      const tamperedToken = token.slice(0, -6) + 'XXXXXX';
      jwt.verify(tamperedToken, process.env.JWT_SECRET);
    } catch (err) {
      tamperedRejected = true;
    }
    assert(tamperedRejected, 'Tampered JWT signature is rejected');

    let expiredRejected = false;
    try {
      const expiredToken = jwt.sign(
        { userId: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      jwt.verify(expiredToken, process.env.JWT_SECRET);
    } catch (err) {
      expiredRejected = err.name === 'TokenExpiredError';
    }
    assert(expiredRejected, 'Expired JWT is rejected with TokenExpiredError');

    // ── 3. Cross-Shop Isolation Security ─────────────────────────
    console.log('\n🛡️ [3] Cross-Shop Data Isolation & Boundary Testing:');
    const stationShop = await Shop.findOne({ code: 'STATION' });
    const camdenShop = await Shop.findOne({ code: 'CAMDEN' });
    assert(stationShop && camdenShop, 'Station and Camden shops verified');

    const stationUser = await User.findOne({ shopId: stationShop._id, role: 'SHOP_USER' });
    const camdenUser = await User.findOne({ shopId: camdenShop._id, role: 'SHOP_USER' });
    assert(stationUser && camdenUser, 'Station and Camden shop users verified');

    // Create a Station Cycles declaration
    const stationDecl = await Declaration.create({
      shopId: stationShop._id,
      createdBy: stationUser._id,
      customerName: 'Audit Station Customer',
      bicycleModel: 'Station Commuter 100',
      frameNumber: 'AUDIT-STAT-999',
      legalOwnerConfirmed: true,
    });

    // Create a Camden Cycles declaration
    const camdenDecl = await Declaration.create({
      shopId: camdenShop._id,
      createdBy: camdenUser._id,
      customerName: 'Audit Camden Customer',
      bicycleModel: 'Camden Cruiser 200',
      frameNumber: 'AUDIT-CAM-888',
      legalOwnerConfirmed: true,
    });

    // Test: Station user attempting to access Camden declaration
    let stationAccessCamdenBlocked = false;
    try {
      await declarationService.getDeclarationById(String(camdenDecl._id), stationUser);
    } catch (err) {
      stationAccessCamdenBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(stationAccessCamdenBlocked, 'Station user access to Camden declaration is strictly rejected (404)');

    // Test: Camden user attempting to access Station declaration
    let camdenAccessStationBlocked = false;
    try {
      await declarationService.getDeclarationById(String(stationDecl._id), camdenUser);
    } catch (err) {
      camdenAccessStationBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(camdenAccessStationBlocked, 'Camden user access to Station declaration is strictly rejected (404)');

    // Test: Station user querying with spoofed shopId filter
    const spoofedQueryRes = await declarationService.getDeclarations(
      { shopId: String(camdenShop._id) },
      stationUser
    );
    const onlyOwnShop = spoofedQueryRes.declarations.every(
      (d) => String(d.shopId._id || d.shopId) === String(stationShop._id)
    );
    assert(onlyOwnShop, 'Backend ignored spoofed shopId in query and strictly enforced user.shopId');

    // Test: Station user cannot update Camden declaration
    let updateCamdenBlocked = false;
    try {
      await declarationService.updateDeclaration(
        String(camdenDecl._id),
        { customerName: 'Hacked Name' },
        stationUser
      );
    } catch (err) {
      updateCamdenBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(updateCamdenBlocked, 'Station user cannot update Camden declaration (rejected 404)');

    // Test: Station user cannot delete Camden declaration
    let deleteCamdenBlocked = false;
    try {
      await declarationService.deleteDeclaration(String(camdenDecl._id), stationUser);
    } catch (err) {
      deleteCamdenBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(deleteCamdenBlocked, 'Station user cannot delete Camden declaration (rejected 404)');

    // ── 4. Attachment Security & Shop Isolation ───────────────────
    console.log('\n📎 [4] Attachment Security & Shop Isolation:');
    const camdenAtt = await Attachment.create({
      declarationId: camdenDecl._id,
      shopId: camdenShop._id,
      uploadedBy: camdenUser._id,
      category: 'BICYCLE',
      originalFileName: 'camden_bike_evidence.jpg',
      fileName: 'camden_bike_evidence_111.jpg',
      mimeType: 'image/jpeg',
      fileType: 'image',
      fileSize: 102400,
      storageUrl: '/uploads/pixx-bicycle-declarations/camden/' + camdenDecl._id + '/bicycle/camden_bike_111.jpg',
      storagePublicId: 'camden/' + camdenDecl._id + '/bicycle/camden_bike_111',
    });

    let stationAttAccessBlocked = false;
    try {
      await attachmentService.getAttachmentById(String(camdenAtt._id), stationUser);
    } catch (err) {
      stationAttAccessBlocked = (err.statusCode === 404 || err.status === 404);
    }
    assert(stationAttAccessBlocked, 'Station user cannot view or download Camden attachment (rejected 404)');

    // Admin can view both
    const adminStationView = await declarationService.getDeclarationById(String(stationDecl._id), adminUser);
    const adminCamdenView = await declarationService.getDeclarationById(String(camdenDecl._id), adminUser);
    assert(
      adminStationView && adminCamdenView,
      'ADMIN maintains complete visibility across Station and Camden declarations'
    );

    // ── 5. Declaration Validation & Resilience ────────────────────
    console.log('\n📋 [5] Validation & Error Handling:');
    let missingNameCaught = false;
    try {
      await declarationService.createDeclaration({ bicycleModel: 'Model Only' }, stationUser);
    } catch (err) {
      missingNameCaught = err.statusCode === 400;
    }
    assert(missingNameCaught, 'Declaration creation without customerName rejected with 400');

    let missingModelCaught = false;
    try {
      await declarationService.createDeclaration({ customerName: 'Name Only' }, stationUser);
    } catch (err) {
      missingModelCaught = err.statusCode === 400;
    }
    assert(missingModelCaught, 'Declaration creation without bicycleModel rejected with 400');

    // Create minimal valid declaration
    const minimalDecl = await declarationService.createDeclaration(
      { customerName: 'Minimal Customer', bicycleModel: 'Minimal Model' },
      stationUser
    );
    assert(minimalDecl._id !== undefined, 'Declaration with only required fields created successfully');
    assert(minimalDecl.bicycleMake === null, 'Optional bicycleMake safely defaults to null');
    assert(minimalDecl.frameNumber === null, 'Optional frameNumber safely defaults to null');

    // ── 6. Cleanup ───────────────────────────────────────────────
    await Declaration.deleteMany({
      _id: { $in: [stationDecl._id, camdenDecl._id, minimalDecl._id] },
    });
    await Attachment.deleteMany({ _id: camdenAtt._id });
    console.log('\n🧹 Temporary security audit records purged cleanly.');
  } catch (err) {
    console.error('Security audit error:', err);
    failed++;
  } finally {
    console.log('\n══════════════════════════════════════════');
    console.log(`Phase 12 Security Audit: ${passed} passed, ${failed} failed.`);
    console.log('══════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runSecurityAudit();
