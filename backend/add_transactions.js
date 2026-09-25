require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Transaction = require('./src/models/Transaction');

const URI = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB');

    const email = 'mothersummer2@gmail.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log(`User ${email} not found. Creating...`);
      user = new User({
        firstName: 'Summer',
        lastName: 'Mother',
        email: email,
        password: 'Password123!', // will be hashed
        role: 'user',
        balance: 0,
        kyc: 'Verified',
        status: 'active'
      });
      await user.save();
      console.log(`👤 Created user: ${user.firstName} ${user.lastName}`);
    } else {
      console.log(`👤 Found user: ${user.firstName} ${user.lastName}`);
    }

    // Delete existing transactions for this user to avoid exceeding the $10000 limit
    await Transaction.deleteMany({ userId: user._id });
    console.log('🗑  Cleared existing transactions for this user');

    // Generate transactions for the past 3 months (90 days)
    // The sum of all transaction amounts should not exceed $10000. Let's aim for ~$8000 total.
    
    const numTransactions = 15;
    let totalTransacted = 0;
    let currentBalance = 1500; // Starting balance

    for (let i = 0; i < numTransactions; i++) {
      // Random days ago between 1 and 90
      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      
      // Amount between $50 and $500
      let amount = parseFloat((Math.random() * 450 + 50).toFixed(2));
      
      // Stop if we would exceed $10000 total
      if (totalTransacted + amount > 9500) {
        break;
      }

      // Randomly choose credit or debit
      const isCredit = Math.random() > 0.5 || currentBalance < amount;
      const type = isCredit ? 'credit' : 'debit';
      
      let category, method, desc;
      if (isCredit) {
        category = 'deposit';
        method = 'ach';
        desc = 'Direct Deposit';
        currentBalance += amount;
      } else {
        category = 'shopping';
        method = 'card';
        desc = 'Card Purchase';
        currentBalance -= amount;
      }

      totalTransacted += amount;

      const tx = new Transaction({
        userId: user._id,
        type,
        category,
        method,
        amount,
        fee: 0,
        description: desc,
        status: 'completed',
        balanceAfter: currentBalance,
        createdAt,
        updatedAt: createdAt,
        completedAt: createdAt,
      });

      await tx.save();
    }

    user.balance = currentBalance;
    await user.save();

    console.log(`📊 Created transactions for ${email}`);
    console.log(`Total amount transacted: $${totalTransacted.toFixed(2)}`);
    console.log(`Current Balance: $${currentBalance.toFixed(2)}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
  }
}

run();
