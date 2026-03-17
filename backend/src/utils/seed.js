require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Transaction = require('../models/Transaction')
const Notification = require('../models/Notification')

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexabank'

const SEED_USERS = [
  { firstName: 'Admin',    lastName: 'User',     email: 'admin@nexabank.com',   password: 'Admin1234!',  role: 'admin', balance: 99999, kyc: 'Verified', status: 'active' },
  { firstName: 'Jordan',   lastName: 'Mitchell', email: 'jordan@nexabank.com',  password: 'Test1234!',   role: 'user',  balance: 12840.50, kyc: 'Verified', status: 'active' },
  { firstName: 'Samantha', lastName: 'Lee',      email: 'sam@nexabank.com',     password: 'Test1234!',   role: 'user',  balance: 5200.00,  kyc: 'Verified', status: 'active' },
  { firstName: 'Marcus',   lastName: 'Brown',    email: 'marcus@nexabank.com',  password: 'Test1234!',   role: 'user',  balance: 890.25,   kyc: 'Pending',  status: 'suspended' },
  { firstName: 'Priya',    lastName: 'Patel',    email: 'priya@nexabank.com',   password: 'Test1234!',   role: 'user',  balance: 31500.00, kyc: 'Verified', status: 'active' },
  { firstName: 'Carlos',   lastName: 'Rivera',   email: 'carlos@nexabank.com',  password: 'Test1234!',   role: 'user',  balance: 2100.80,  kyc: 'Verified', status: 'active' },
]

const TX_TEMPLATES = [
  { type: 'credit', category: 'deposit',      method: 'ach',        desc: 'ACH Deposit' },
  { type: 'credit', category: 'salary',       method: 'bank_transfer', desc: 'Salary Deposit' },
  { type: 'debit',  category: 'withdrawal',   method: 'ach',        desc: 'ACH Withdrawal' },
  { type: 'credit', category: 'transfer_in',  method: 'internal',   desc: 'Transfer Received' },
  { type: 'debit',  category: 'transfer_out', method: 'internal',   desc: 'Transfer Sent' },
  { type: 'debit',  category: 'bill',         method: 'internal',   desc: 'Electricity Bill' },
  { type: 'debit',  category: 'bill',         method: 'internal',   desc: 'Internet Bill' },
  { type: 'credit', category: 'deposit',      method: 'crypto_btc', desc: 'Bitcoin Deposit' },
  { type: 'debit',  category: 'withdrawal',   method: 'crypto_eth', desc: 'Ethereum Withdrawal' },
  { type: 'debit',  category: 'bill',         method: 'internal',   desc: 'Rent Payment' },
  { type: 'credit', category: 'deposit',      method: 'paypal',     desc: 'PayPal Deposit' },
  { type: 'debit',  category: 'transfer_out', method: 'wire',       desc: 'Wire Transfer' },
]

const STATUSES = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed']

async function seed() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing
    await User.deleteMany({})
    await Transaction.deleteMany({})
    await Notification.deleteMany({})
    console.log('🗑  Cleared existing data')

    // Create users
    const createdUsers = []
    for (const userData of SEED_USERS) {
      const user = new User(userData)
      await user.save()
      createdUsers.push(user)
      console.log(`👤 Created: ${user.firstName} ${user.lastName} (${user.email})`)
    }

    // Create transactions for each non-admin user
    const normalUsers = createdUsers.filter(u => u.role === 'user')
    for (const user of normalUsers) {
      const txCount = 8 + Math.floor(Math.random() * 8)
      for (let i = 0; i < txCount; i++) {
        const tpl = TX_TEMPLATES[Math.floor(Math.random() * TX_TEMPLATES.length)]
        const amount = parseFloat((20 + Math.random() * 1500).toFixed(2))
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
        const daysAgo = Math.floor(Math.random() * 90)
        const createdAt = new Date(Date.now() - daysAgo * 86400000)

        const tx = new Transaction({
          userId: user._id,
          type: tpl.type,
          category: tpl.category,
          method: tpl.method,
          amount,
          fee: 0,
          description: tpl.desc,
          status,
          balanceAfter: user.balance,
          createdAt,
          updatedAt: createdAt,
          ...(status === 'completed' ? { completedAt: createdAt } : {}),
        })
        await tx.save()
      }
      console.log(`💳 Transactions created for ${user.firstName}`)
    }

    // Welcome notifications
    for (const user of normalUsers) {
      await Notification.create({
        userId: user._id,
        title: 'Welcome to NexaBank!',
        message: `Hi ${user.firstName}! Your account is ready. Your starting balance is $${user.balance.toFixed(2)}.`,
        type: 'system',
        priority: 'high',
      })
    }

    console.log('\n✅ Seed complete!\n')
    console.log('─────────────────────────────────────────')
    console.log('Login credentials:')
    console.log('  Admin:   admin@nexabank.com / Admin1234!')
    console.log('  User:    jordan@nexabank.com / Test1234!')
    console.log('  User:    sam@nexabank.com / Test1234!')
    console.log('─────────────────────────────────────────\n')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()
