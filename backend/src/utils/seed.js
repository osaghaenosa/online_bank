require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexabank';

// ── Robert Chase dummy account data ─────────────────────────────────────────
// Total target: $22,700,000
// Breakdown:
//   balance (main checking)  : $1,430,000
//   linkedAccounts           : $5,800,000  (split among 6 platforms)
//   cryptoAssets             : $1,470,000
//   treasuryAssets           : $3,000,000
//   investments              : $6,000,000
//   trust                    : $5,000,000
//                              ──────────
//   TOTAL                    : $22,700,000

const LINKED_ACCOUNTS = [
  { platform: 'paypal',      label: 'PayPal Business',       accountId: 'robert.chase@paypal.com',      balance: 1200000, currency: 'USD' },
  { platform: 'chase',       label: 'Chase Sapphire Private',accountId: '****4821',                     balance: 1500000, currency: 'USD' },
  { platform: 'bofa',        label: 'Bank of America Wealth',accountId: '****7739',                     balance: 950000,  currency: 'USD' },
  { platform: 'hsbc',        label: 'HSBC Premier',          accountId: '****2204',                     balance: 850000,  currency: 'USD' },
  { platform: 'cashapp',     label: 'Cash App',              accountId: '$robertchase',                 balance: 500000,  currency: 'USD' },
  { platform: 'wells_fargo', label: 'Wells Fargo Private',   accountId: '****6612',                     balance: 800000,  currency: 'USD' },
];

const CRYPTO_ASSETS = [
  { coin:'Bitcoin',  symbol:'BTC', quantity:8.5,    avgBuyPrice:32000, currentPrice:67420, valueUSD:573070,  walletAddress:'1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna', network:'Bitcoin', acquiredAt:new Date('2020-03-15') },
  { coin:'Ethereum', symbol:'ETH', quantity:95,     avgBuyPrice:1200,  currentPrice:3210,  valueUSD:304950,  walletAddress:'0x742d35Cc6634C0532925a3b8D4C9D5E123',network:'ERC-20', acquiredAt:new Date('2020-09-10') },
  { coin:'Solana',   symbol:'SOL', quantity:1800,   avgBuyPrice:22,    currentPrice:172,   valueUSD:309600,  walletAddress:'4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1', network:'Solana', acquiredAt:new Date('2021-06-05') },
  { coin:'BNB',      symbol:'BNB', quantity:310,    avgBuyPrice:180,   currentPrice:580,   valueUSD:179800,  walletAddress:'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',network:'BEP-20',acquiredAt:new Date('2021-02-20') },
  { coin:'USDT',     symbol:'USDT',quantity:102580, avgBuyPrice:1,     currentPrice:1,     valueUSD:102580,  walletAddress:'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',  network:'TRC-20', acquiredAt:new Date('2022-01-01') },
];
// Total crypto: ~$1,470,000

const TREASURY_ASSETS = [
  { category:'gold',       name:'Gold Bullion Bars',            description:'24-karat investment-grade gold bars stored in Swiss vault', quantity:12,  unitPrice:65000,  totalValue:780000, acquiredAt:new Date('2018-04-10'), location:'Swiss Vault, Zurich', serialNo:'AU-2018-00441', notes:'Insured by Lloyd\'s of London' },
  { category:'watch',      name:'Patek Philippe Nautilus 5711', description:'18k white gold, blue dial — limited edition', quantity:2,   unitPrice:185000, totalValue:370000, acquiredAt:new Date('2019-07-22'), location:'Home Safe, New York', serialNo:'PP-5711-WG-0193', notes:'Certificate of authenticity included' },
  { category:'watch',      name:'Richard Mille RM 11-03',       description:'Flyback chronograph, titanium & carbon TPT', quantity:1,   unitPrice:220000, totalValue:220000, acquiredAt:new Date('2020-11-05'), location:'Home Safe, New York', serialNo:'RM-11-03-0827', notes:'Full set with original box' },
  { category:'art',        name:'Contemporary Oil Paintings',   description:'Collection of 4 signed works by emerging artists', quantity:4, unitPrice:95000, totalValue:380000, acquiredAt:new Date('2017-09-14'), location:'Private Gallery, NYC', serialNo:'ART-COLL-2017', notes:'Art advisory managed portfolio' },
  { category:'jewelry',    name:'Diamond Tennis Bracelet',      description:'18k white gold, 12ct total diamond weight, VVS1', quantity:1, unitPrice:145000, totalValue:145000, acquiredAt:new Date('2021-03-08'), location:'Bank Vault, NYC', serialNo:'JWL-DTB-0044', notes:'GIA certified' },
  { category:'vehicle',    name:'Rolls Royce Phantom VIII',     description:'2022 model, extended wheelbase, bespoke interior', quantity:1, unitPrice:480000, totalValue:480000, acquiredAt:new Date('2022-05-20'), location:'Private Garage, Greenwich CT', serialNo:'SCA665C0XNU100192', notes:'Full service history' },
  { category:'bonds',      name:'US Treasury Bonds (10yr)',     description:'Series EE savings bonds, US government backed', quantity:5,  unitPrice:100000, totalValue:500000, acquiredAt:new Date('2019-01-15'), location:'Custodian: Fidelity', serialNo:'USTB-2019-RC-05', notes:'Maturity date: Jan 2029' },
  { category:'gold',       name:'Gold Krugerrand Coins',        description:'1oz South African Gold Krugerrands — full set', quantity:40, unitPrice:2800,   totalValue:112000, acquiredAt:new Date('2020-08-03'), location:'Swiss Vault, Zurich', serialNo:'KGR-2020-040', notes:'Certified by South African Mint' },
  { category:'jewelry',    name:'Rolex Daytona Platinum',       description:'Platinum case, meteorite dial, ice blue bezel', quantity:1,  unitPrice:113000, totalValue:113000, acquiredAt:new Date('2022-12-01'), location:'Home Safe, New York', serialNo:'RLX-DAYT-PT-0022', notes:'Full factory papers' },
];
// Total treasury: ~$3,100,000

const INVESTMENTS = [
  { name:'Apple Inc (AAPL)',          type:'stocks',         ticker:'AAPL', amount:250000, currentValue:412000,  returnPct:64.8,  startDate:new Date('2018-01-15'), status:'active',  broker:'Goldman Sachs',   notes:'Long-term hold position' },
  { name:'Amazon (AMZN)',             type:'stocks',         ticker:'AMZN', amount:300000, currentValue:485000,  returnPct:61.7,  startDate:new Date('2018-03-20'), status:'active',  broker:'Goldman Sachs',   notes:'Core portfolio position' },
  { name:'Tesla (TSLA)',              type:'stocks',         ticker:'TSLA', amount:180000, currentValue:310000,  returnPct:72.2,  startDate:new Date('2019-06-10'), status:'active',  broker:'Morgan Stanley',  notes:'EV sector exposure' },
  { name:'Manhattan Real Estate Fund',type:'real_estate',   ticker:null,   amount:800000, currentValue:1240000, returnPct:55.0,  startDate:new Date('2017-09-05'), status:'active',  broker:'Blackstone',      notes:'Commercial real estate fund — NYC/NJ' },
  { name:'S&P 500 ETF (SPY)',         type:'etf',            ticker:'SPY',  amount:400000, currentValue:611000,  returnPct:52.8,  startDate:new Date('2018-07-01'), status:'active',  broker:'Fidelity',        notes:'Index exposure — core holding' },
  { name:'Vanguard Total Market ETF', type:'etf',            ticker:'VTI',  amount:250000, currentValue:378000,  returnPct:51.2,  startDate:new Date('2019-01-10'), status:'active',  broker:'Vanguard',        notes:'Broad market exposure' },
  { name:'SoftBank Vision Fund II',   type:'private_equity', ticker:null,   amount:500000, currentValue:720000,  returnPct:44.0,  startDate:new Date('2020-04-15'), status:'active',  broker:'SoftBank',        notes:'Tech-focused private equity' },
  { name:'Microsoft (MSFT)',          type:'stocks',         ticker:'MSFT', amount:220000, currentValue:365000,  returnPct:65.9,  startDate:new Date('2018-11-22'), status:'active',  broker:'JP Morgan',       notes:'Cloud & AI exposure' },
  { name:'AI Startup Seed Round',     type:'startup',        ticker:null,   amount:150000, currentValue:480000,  returnPct:220.0, startDate:new Date('2021-03-08'), status:'active',  broker:'Sequoia Capital', notes:'Series B AI infrastructure startup' },
  { name:'US Corporate Bond Fund',    type:'bonds',          ticker:'LQD',  amount:350000, currentValue:382000,  returnPct:9.1,   startDate:new Date('2020-02-14'), status:'active',  broker:'BlackRock',       notes:'Investment-grade fixed income' },
  { name:'Google (GOOGL)',            type:'stocks',         ticker:'GOOGL',amount:280000, currentValue:447000,  returnPct:59.6,  startDate:new Date('2019-08-19'), status:'active',  broker:'Goldman Sachs',   notes:'Digital advertising & AI moat' },
  { name:'Berkshire Hathaway (BRK.B)',type:'stocks',         ticker:'BRK.B',amount:195000, currentValue:254000,  returnPct:30.3,  startDate:new Date('2017-12-01'), status:'active',  broker:'JP Morgan',       notes:'Value investing core position' },
  { name:'Dubai Luxury Apartments',   type:'real_estate',   ticker:null,   amount:600000, currentValue:890000,  returnPct:48.3,  startDate:new Date('2019-05-15'), status:'active',  broker:'DAMAC Properties',notes:'Two units in Downtown Dubai tower' },
  { name:'Nvidia (NVDA)',             type:'stocks',         ticker:'NVDA', amount:120000, currentValue:510000,  returnPct:325.0, startDate:new Date('2020-10-05'), status:'active',  broker:'Morgan Stanley',  notes:'GPU/AI semiconductor play' },
  { name:'BlackRock World Mining Fund',type:'mutual_fund',  ticker:null,   amount:200000, currentValue:248000,  returnPct:24.0,  startDate:new Date('2018-06-12'), status:'exited',  broker:'BlackRock',       notes:'Exited at profit, Q3 2023' },
  { name:'Fintech Series A (exited)', type:'startup',        ticker:null,   amount:100000, currentValue:0,       returnPct:180.0, startDate:new Date('2018-02-28'), status:'exited',  broker:'Y Combinator',    notes:'Exited at 2.8x. Payments app acquisition.' },
  { name:'Gold Futures (COMEX)',      type:'commodity',      ticker:'GC=F', amount:250000, currentValue:318000,  returnPct:27.2,  startDate:new Date('2020-07-20'), status:'active',  broker:'Interactive Brokers', notes:'Inflation hedge — rolling contracts' },
  { name:'Palantir (PLTR)',           type:'stocks',         ticker:'PLTR', amount:90000,  currentValue:148000,  returnPct:64.4,  startDate:new Date('2020-09-30'), status:'active',  broker:'Robinhood',       notes:'Data analytics — government contracts' },
  { name:'iShares MSCI Emerging Mkts',type:'etf',            ticker:'EEM',  amount:175000, currentValue:189000,  returnPct:8.0,   startDate:new Date('2021-01-07'), status:'active',  broker:'iShares',         notes:'EM diversification' },
  { name:'Private Credit Fund',       type:'bonds',          ticker:null,   amount:280000, currentValue:329000,  returnPct:17.5,  startDate:new Date('2022-03-01'), status:'active',  broker:'Ares Management', notes:'Private credit — direct lending' },
];
// Total investments: ~$7,720,000  (active current values)

async function seed() {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑  Cleared existing data');

    // ── Standard users ───────────────────────────────────────────────────────
    const STANDARD_USERS = [
      { firstName:'Admin',    lastName:'User',     email:'admin@nexabank.com',   password:'Admin1234!', role:'admin', balance:99999,    kyc:'Verified', status:'active' },
      { firstName:'Jordan',   lastName:'Mitchell', email:'jordan@nexabank.com',  password:'Test1234!',  role:'user',  balance:12840.50, kyc:'Verified', status:'active' },
      { firstName:'Samantha', lastName:'Lee',      email:'sam@nexabank.com',     password:'Test1234!',  role:'user',  balance:5200.00,  kyc:'Verified', status:'active' },
      { firstName:'Marcus',   lastName:'Brown',    email:'marcus@nexabank.com',  password:'Test1234!',  role:'user',  balance:890.25,   kyc:'Pending',  status:'suspended' },
      { firstName:'Priya',    lastName:'Patel',    email:'priya@nexabank.com',   password:'Test1234!',  role:'user',  balance:31500.00, kyc:'Verified', status:'active' },
    ];

    for (const u of STANDARD_USERS) {
      const user = new User(u);
      await user.save();
      console.log(`👤 Created: ${user.firstName} ${user.lastName}`);
    }

    // ── Robert Chase — HNW account ───────────────────────────────────────────
    const robert = new User({
      firstName: 'Robert',
      lastName:  'Chase',
      email:     'robert_chase224@gmail.com',
      password:  'robert001#',
      phone:     '+1 (212) 555-8800',
      role:      'user',
      status:    'active',
      kyc:       'Verified',
      balance:   1430000,
      savingsBalance: 250000,
      savingsGoal: 500000,

      linkedAccounts: LINKED_ACCOUNTS,
      cryptoAssets:   CRYPTO_ASSETS,
      treasuryAssets: TREASURY_ASSETS,
      investments:    INVESTMENTS,

      trust: {
        enabled:     true,
        name:        'Chase Family Revocable Living Trust',
        balance:     5000000,
        type:        'revocable',
        trustee:     'Robert Chase & Margaret Chase',
        beneficiary: 'Emily Chase, James Chase (children)',
        established: new Date('2016-08-15'),
        notes:       'Managed by Sullivan & Cromwell LLP. Includes real estate, securities, and personal property. Annual review scheduled every December.'
      },
    });

    await robert.save();
    console.log('💎 Created: Robert Chase (HNW account)');

    // Add sample transactions for Robert
    const txTemplates = [
      { type:'credit', category:'deposit',      method:'wire',         desc:'Wire Transfer — Goldman Sachs',      amount:500000 },
      { type:'credit', category:'transfer_in',  method:'internal',     desc:'Portfolio Distribution Q4 2024',     amount:120000 },
      { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire to Blackstone RE Fund',         amount:200000 },
      { type:'credit', category:'deposit',      method:'crypto_btc',   desc:'Bitcoin Deposit — Coinbase Prime',   amount:85000 },
      { type:'debit',  category:'bill',         method:'internal',     desc:'Property Management Fee',            amount:18500 },
      { type:'credit', category:'salary',       method:'bank_transfer',desc:'Dividend Income — AAPL, MSFT, GOOGL',amount:42000 },
      { type:'debit',  category:'transfer_out', method:'internal',     desc:'Trust Fund Contribution',            amount:100000 },
      { type:'credit', category:'deposit',      method:'bank_transfer',desc:'Real Estate Rental Income — Dubai',  amount:28000 },
    ];

    for (let i = 0; i < txTemplates.length; i++) {
      const t = txTemplates[i];
      const daysAgo = (i + 1) * 12;
      const tx = new Transaction({
        userId: robert._id,
        type: t.type, category: t.category, method: t.method,
        amount: t.amount, fee: 0, description: t.desc,
        status: 'completed', balanceAfter: robert.balance,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      });
      await tx.save();
    }

    // Seed standard user transactions
    const normalUsers = await User.find({ role: 'user', email: { $ne: 'robert_chase224@gmail.com' } });
    const TX_TPL = [
      { type:'credit', category:'deposit',    method:'ach',         desc:'ACH Deposit' },
      { type:'credit', category:'salary',     method:'bank_transfer',desc:'Salary Deposit' },
      { type:'debit',  category:'withdrawal', method:'ach',         desc:'ACH Withdrawal' },
      { type:'debit',  category:'bill',       method:'internal',    desc:'Electricity Bill' },
      { type:'debit',  category:'bill',       method:'internal',    desc:'Rent Payment' },
      { type:'credit', category:'deposit',    method:'paypal',      desc:'PayPal Deposit' },
      { type:'debit',  category:'transfer_out',method:'wire',       desc:'Wire Transfer' },
    ];
    const STATUSES = ['completed','completed','completed','pending','failed'];
    for (const user of normalUsers) {
      for (let i = 0; i < 10; i++) {
        const tpl = TX_TPL[Math.floor(Math.random() * TX_TPL.length)];
        const amount = parseFloat((50 + Math.random() * 2000).toFixed(2));
        const tx = new Transaction({
          userId: user._id, type: tpl.type, category: tpl.category,
          method: tpl.method, amount, fee: 0, description: tpl.desc,
          status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
          balanceAfter: user.balance,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000),
        });
        await tx.save();
      }
    }

    // Welcome notifications
    for (const user of await User.find({ role: 'user' })) {
      await Notification.create({
        userId: user._id,
        title: 'Welcome to NexaBank!',
        message: `Hi ${user.firstName}! Your account is ready.`,
        type: 'system', priority: 'high',
      });
    }

    // Calculate and log Robert's net worth
    const crypto   = CRYPTO_ASSETS.reduce((s, a) => s + a.valueUSD, 0);
    const treasury = TREASURY_ASSETS.reduce((s, a) => s + a.totalValue, 0);
    const invest   = INVESTMENTS.reduce((s, a) => s + a.currentValue, 0);
    const linked   = LINKED_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
    const total    = 1430000 + crypto + treasury + invest + linked + 5000000;

    console.log('\n✅ Seed complete!');
    console.log('─────────────────────────────────────────────');
    console.log('Robert Chase Net Worth Breakdown:');
    console.log(`  Checking balance : $${(1430000).toLocaleString()}`);
    console.log(`  Linked accounts  : $${linked.toLocaleString()}`);
    console.log(`  Crypto assets    : $${Math.round(crypto).toLocaleString()}`);
    console.log(`  Treasury/Assets  : $${treasury.toLocaleString()}`);
    console.log(`  Investments      : $${Math.round(invest).toLocaleString()}`);
    console.log(`  Trust            : $${(5000000).toLocaleString()}`);
    console.log(`  TOTAL            : $${Math.round(total).toLocaleString()}`);
    console.log('─────────────────────────────────────────────');
    console.log('Login credentials:');
    console.log('  Admin:  admin@nexabank.com   / Admin1234!');
    console.log('  HNW:    robert_chase224@gmail.com / robert001#');
    console.log('  User:   jordan@nexabank.com  / Test1234!');
    console.log('─────────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
