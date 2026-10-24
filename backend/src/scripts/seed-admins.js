/**
 * Seed Additional Administrators Script
 * Pixx Bicycle Owner's Declaration System
 *
 * Adds or updates the 3 requested admin accounts with full ADMIN privileges:
 * 1. Fahad Rasheed (fahad@gmail.com / fahad123)
 * 2. Khurshid Anwar (khurshid@gmail.com / khurshid123)
 * 3. Kamran Ijaz (kamran@gmail.com / kamran123)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const { hashPassword } = require('../services/auth.service');

const ADMINS_TO_SEED = [
  {
    name: 'Fahad Rasheed',
    email: 'fahad@gmail.com',
    password: 'fahad123',
  },
  {
    name: 'Khurshid Anwar',
    email: 'khurshid@gmail.com',
    password: 'khurshid123',
  },
  {
    name: 'Kamran Ijaz',
    email: 'kamran@gmail.com',
    password: 'kamran123',
  },
];

async function seedAdmins() {
  console.log('\n👑 Seeding 3 Full-Access Administrators...');
  console.log('Connecting to MongoDB:', process.env.MONGODB_URI ? 'URI defined' : 'NO URI');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to database successfully!\n');

  for (const admin of ADMINS_TO_SEED) {
    const passwordHash = await hashPassword(admin.password);

    const user = await User.findOneAndUpdate(
      { email: admin.email.toLowerCase() },
      {
        $set: {
          name: admin.name,
          email: admin.email.toLowerCase(),
          passwordHash,
          role: 'ADMIN',
          shopId: null,
          isActive: true,
        },
      },
      { upsert: true, new: true, runValidators: false }
    );

    console.log(`✅ Admin created/updated: ${user.name} (${user.email}) [Role: ${user.role}]`);
  }

  console.log('\n🎉 All 3 administrators have been granted full ADMIN access!');
}

seedAdmins()
  .catch((err) => {
    console.error('❌ Error seeding admins:', err);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
