/**
 * upload-hnw-photos.js — Uploads generated profile photos to ImageKit 
 * and attaches them to the 5 HNW users already in the database.
 * Run: node src/utils/upload-hnw-photos.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexabank';

const PHOTO_DIR = 'C:\\Users\\NOSA\\.gemini\\antigravity\\brain\\8316f924-6f09-4e41-8170-e0216e5e71a2';

const USERS = [
  { email: 'james.whitfield@nexabanking.com',  photo: path.join(PHOTO_DIR, 'james_whitfield_1782291825025.png'),    key: 'james-avatar.png' },
  { email: 'victoria.osei@nexabanking.com',    photo: path.join(PHOTO_DIR, 'victoria_osei_1782291836248.png'),       key: 'victoria-avatar.png' },
  { email: 'daniel.hartmann@nexabanking.com',  photo: path.join(PHOTO_DIR, 'daniel_hartmann_1782291854849.png'),     key: 'daniel-avatar.png' },
  { email: 'sophia.ramirez@nexabanking.com',   photo: path.join(PHOTO_DIR, 'sophia_ramirez_1782291866091.png'),      key: 'sophia-avatar.png' },
  { email: 'nathaniel.bowers@nexabanking.com', photo: path.join(PHOTO_DIR, 'nathaniel_bowers_1782291876735.png'),    key: 'nathaniel-avatar.png' },
];

async function run() {
  await mongoose.connect(URI);
  console.log('✅ Connected to MongoDB');

  const { uploadToImageKit } = require('./imagekit');

  for (const u of USERS) {
    const user = await User.findOne({ email: u.email });
    if (!user) { console.warn(`⚠️  User not found: ${u.email}`); continue; }

    if (!fs.existsSync(u.photo)) {
      console.warn(`⚠️  Photo missing: ${u.photo}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(u.photo);
      const result = await uploadToImageKit(buffer, u.key, '/nexabank/avatars');
      user.profilePicture = result.url;
      user.profilePictureFileId = result.fileId;
      await user.save({ validateBeforeSave: false });
      console.log(`📷 Photo uploaded for ${user.firstName} ${user.lastName}: ${result.url}`);
    } catch (e) {
      console.warn(`⚠️  Upload failed for ${u.email}: ${e.message}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
