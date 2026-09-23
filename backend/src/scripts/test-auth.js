/**
 * Unit & Integration Test Suite for Phase 2 Authentication & Authorization
 * Run with: node src/scripts/test-auth.js
 */
require('dotenv').config();
const { hashPassword, verifyPassword, generateToken } = require('../services/auth.service');
const { formatUser } = require('../controllers/auth.controller');
const { requireRole, shopIsolation } = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('\n🔐 Running Phase 2 Authentication & Authorization Tests...\n');
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

  // ── Test 1: Password Hashing & Verification
  const plain = 'SecretPass123!';
  const hash = await hashPassword(plain);
  assert(hash !== plain, 'Password is never stored in plain text');
  assert(hash.startsWith('$2'), 'Password uses bcrypt hash format');
  const isMatch = await verifyPassword(plain, hash);
  assert(isMatch === true, 'Valid password matches hash');
  const isWrong = await verifyPassword('WrongPass', hash);
  assert(isWrong === false, 'Invalid password is rejected');

  // ── Test 2: JWT Generation & Security
  const mockShopId = '507f1f77bcf86cd799439011';
  const mockShopUser = {
    _id: '507f1f77bcf86cd799439012',
    role: 'SHOP_USER',
    shopId: mockShopId,
  };
  const token = generateToken(mockShopUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token is properly formatted');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert(decoded.userId === mockShopUser._id, 'JWT contains userId');
  assert(decoded.role === 'SHOP_USER', 'JWT contains user role');
  assert(decoded.shopId === mockShopId, 'JWT contains shopId context');
  assert(!decoded.password && !decoded.passwordHash, 'JWT does not contain passwords or hashes');

  // ── Test 3: formatUser Safe API Responses (No passwordHash leakage)
  const userWithHash = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Southwark User',
    email: 'user.southwark@pixx.co.uk',
    passwordHash: '$2a$12$somehashthatshouldneverleak',
    role: 'SHOP_USER',
    shopId: { _id: mockShopId, name: 'Southwark Cycles', code: 'SOUTHWARK' },
    isActive: true,
    lastLoginAt: new Date(),
  };
  const safeUser = formatUser(userWithHash);
  assert(safeUser.passwordHash === undefined, 'formatUser strips passwordHash');
  assert(safeUser.password === undefined, 'formatUser strips password');
  assert(safeUser.shop.name === 'Southwark Cycles', 'formatUser formats shop info for SHOP_USER');

  // ── Test 4: formatUser for ADMIN (shop is null)
  const adminUser = {
    _id: '507f1f77bcf86cd799439099',
    name: 'Pixx Admin',
    email: 'admin@pixx.co.uk',
    role: 'ADMIN',
    shopId: null,
    isActive: true,
    lastLoginAt: new Date(),
  };
  const safeAdmin = formatUser(adminUser);
  assert(safeAdmin.shop === null, 'Admin shop is null');
  assert(safeAdmin.role === 'ADMIN', 'Admin role is ADMIN');
  assert(safeAdmin.passwordHash === undefined, 'Admin passwordHash is never returned');

  // ── Test 5: Role Authorization Middleware (requireRole)
  const mockReqShopUser = { user: { role: 'SHOP_USER' } };
  const mockReqAdmin = { user: { role: 'ADMIN' } };

  let adminRouteBlocked = false;
  requireRole('ADMIN')(mockReqShopUser, {}, (err) => {
    if (err && err.statusCode === 403) adminRouteBlocked = true;
  });
  assert(adminRouteBlocked, 'SHOP_USER is blocked with 403 from ADMIN routes');

  let adminRouteAllowed = false;
  requireRole('ADMIN')(mockReqAdmin, {}, (err) => {
    if (!err) adminRouteAllowed = true;
  });
  assert(adminRouteAllowed, 'ADMIN is allowed on ADMIN routes');

  // ── Test 6: Shop Data Isolation Middleware
  let stationFilter = null;
  const stationUserReq = {
    user: {
      role: 'SHOP_USER',
      shopId: { _id: 'shop_station_123', name: 'Station Cycles' }
    }
  };
  shopIsolation(stationUserReq, {}, () => {
    stationFilter = stationUserReq.shopFilter;
  });
  assert(stationFilter && stationFilter.shopId === 'shop_station_123', 'Station Cycles user query is strictly filtered to Station Cycles shopId');

  let camdenFilter = null;
  const camdenUserReq = {
    user: {
      role: 'SHOP_USER',
      shopId: { _id: 'shop_camden_456', name: 'Camden Cycles' }
    }
  };
  shopIsolation(camdenUserReq, {}, () => {
    camdenFilter = camdenUserReq.shopFilter;
  });
  assert(camdenFilter && camdenFilter.shopId === 'shop_camden_456', 'Camden Cycles user query is strictly filtered to Camden Cycles shopId');
  assert(stationFilter.shopId !== camdenFilter.shopId, 'Shop users are strictly isolated from each other');

  let adminFilter = null;
  const adminReq = { user: { role: 'ADMIN', shopId: null } };
  shopIsolation(adminReq, {}, () => {
    adminFilter = adminReq.shopFilter;
  });
  assert(adminFilter && Object.keys(adminFilter).length === 0, 'ADMIN filter is empty ({}) allowing access across all shops');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
