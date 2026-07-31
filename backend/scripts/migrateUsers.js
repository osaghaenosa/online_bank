const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const result = await User.updateMany(
      {},
      { 
        $set: { 
          tokenBalance: 0,
          kyc: 'Not Started'
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users to have tokenBalance=0 and kyc='Not Started'`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
