require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexabank';

const LINKED_ACCOUNTS = [
  { platform:'paypal',      label:'PayPal Business',        accountId:'robert.chase@paypal.com',  balance:1200000, currency:'USD' },
  { platform:'chase',       label:'Chase Sapphire Private', accountId:'****4821',                  balance:1500000, currency:'USD' },
  { platform:'bofa',        label:'Bank of America Wealth', accountId:'****7739',                  balance:950000,  currency:'USD' },
  { platform:'hsbc',        label:'HSBC Premier',           accountId:'****2204',                  balance:850000,  currency:'USD' },
  { platform:'cashapp',     label:'Cash App',               accountId:'$robertchase',              balance:500000,  currency:'USD' },
  { platform:'wells_fargo', label:'Wells Fargo Private',    accountId:'****6612',                  balance:800000,  currency:'USD' },
];

const CRYPTO_ASSETS = [
  { coin:'Bitcoin',  symbol:'BTC', quantity:8.5,    avgBuyPrice:32000, currentPrice:67420, valueUSD:573070,  walletAddress:'1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna', network:'Bitcoin', acquiredAt:new Date('2020-03-15') },
  { coin:'Ethereum', symbol:'ETH', quantity:95,     avgBuyPrice:1200,  currentPrice:3210,  valueUSD:304950,  walletAddress:'0x742d35Cc6634C0532925a3b8D4C9D5E123', network:'ERC-20',  acquiredAt:new Date('2020-09-10') },
  { coin:'Solana',   symbol:'SOL', quantity:1800,   avgBuyPrice:22,    currentPrice:172,   valueUSD:309600,  walletAddress:'4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1', network:'Solana',  acquiredAt:new Date('2021-06-05') },
  { coin:'BNB',      symbol:'BNB', quantity:310,    avgBuyPrice:180,   currentPrice:580,   valueUSD:179800,  walletAddress:'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', network:'BEP-20', acquiredAt:new Date('2021-02-20') },
  { coin:'USDT',     symbol:'USDT',quantity:102580, avgBuyPrice:1,     currentPrice:1,     valueUSD:102580,  walletAddress:'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',  network:'TRC-20',  acquiredAt:new Date('2022-01-01') },
];

const TREASURY_ASSETS = [
  { category:'gold',    name:'Gold Bullion Bars',              description:'24-karat investment-grade gold bars stored in Swiss vault', quantity:12, unitPrice:65000,  totalValue:780000, acquiredAt:new Date('2018-04-10'), location:'Swiss Vault, Zurich', serialNo:'AU-2018-00441', notes:"Insured by Lloyd's of London" },
  { category:'watch',   name:'Patek Philippe Nautilus 5711',   description:'18k white gold, blue dial — limited edition', quantity:2, unitPrice:185000, totalValue:370000, acquiredAt:new Date('2019-07-22'), location:'Home Safe, New York', serialNo:'PP-5711-WG-0193', notes:'Certificate of authenticity included' },
  { category:'watch',   name:'Richard Mille RM 11-03',         description:'Flyback chronograph, titanium & carbon TPT', quantity:1, unitPrice:220000, totalValue:220000, acquiredAt:new Date('2020-11-05'), location:'Home Safe, New York', serialNo:'RM-11-03-0827', notes:'Full set with original box' },
  { category:'art',     name:'Contemporary Oil Paintings',     description:'Collection of 4 signed works by emerging artists', quantity:4, unitPrice:95000, totalValue:380000, acquiredAt:new Date('2017-09-14'), location:'Private Gallery, NYC', serialNo:'ART-COLL-2017', notes:'Art advisory managed portfolio' },
  { category:'jewelry', name:'Diamond Tennis Bracelet',        description:'18k white gold, 12ct total diamond weight, VVS1', quantity:1, unitPrice:145000, totalValue:145000, acquiredAt:new Date('2021-03-08'), location:'Bank Vault, NYC', serialNo:'JWL-DTB-0044', notes:'GIA certified' },
  { category:'vehicle', name:'Rolls Royce Phantom VIII',       description:'2022 model, extended wheelbase, bespoke interior', quantity:1, unitPrice:480000, totalValue:480000, acquiredAt:new Date('2022-05-20'), location:'Private Garage, Greenwich CT', serialNo:'SCA665C0XNU100192', notes:'Full service history' },
  { category:'bonds',   name:'US Treasury Bonds (10yr)',       description:'Series EE savings bonds, US government backed', quantity:5, unitPrice:100000, totalValue:500000, acquiredAt:new Date('2019-01-15'), location:'Custodian: Fidelity', serialNo:'USTB-2019-RC-05', notes:'Maturity date: Jan 2029' },
  { category:'gold',    name:'Gold Krugerrand Coins',          description:'1oz South African Gold Krugerrands', quantity:40, unitPrice:2800, totalValue:112000, acquiredAt:new Date('2020-08-03'), location:'Swiss Vault, Zurich', serialNo:'KGR-2020-040', notes:'Certified by South African Mint' },
  { category:'jewelry', name:'Rolex Daytona Platinum',         description:'Platinum case, meteorite dial, ice blue bezel', quantity:1, unitPrice:113000, totalValue:113000, acquiredAt:new Date('2022-12-01'), location:'Home Safe, New York', serialNo:'RLX-DAYT-PT-0022', notes:'Full factory papers' },
];

const INVESTMENTS = [
  { name:'Apple Inc (AAPL)',           type:'stocks',         ticker:'AAPL',  amount:250000, currentValue:412000,  returnPct:64.8,  startDate:new Date('2018-01-15'), status:'active',  broker:'Goldman Sachs',    notes:'Long-term hold position' },
  { name:'Amazon (AMZN)',              type:'stocks',         ticker:'AMZN',  amount:300000, currentValue:485000,  returnPct:61.7,  startDate:new Date('2018-03-20'), status:'active',  broker:'Goldman Sachs',    notes:'Core portfolio position' },
  { name:'Tesla (TSLA)',               type:'stocks',         ticker:'TSLA',  amount:180000, currentValue:310000,  returnPct:72.2,  startDate:new Date('2019-06-10'), status:'active',  broker:'Morgan Stanley',   notes:'EV sector exposure' },
  { name:'Manhattan Real Estate Fund', type:'real_estate',    ticker:null,    amount:800000, currentValue:1240000, returnPct:55.0,  startDate:new Date('2017-09-05'), status:'active',  broker:'Blackstone',       notes:'Commercial RE fund — NYC/NJ' },
  { name:'S&P 500 ETF (SPY)',          type:'etf',            ticker:'SPY',   amount:400000, currentValue:611000,  returnPct:52.8,  startDate:new Date('2018-07-01'), status:'active',  broker:'Fidelity',         notes:'Index exposure — core holding' },
  { name:'Vanguard Total Market ETF',  type:'etf',            ticker:'VTI',   amount:250000, currentValue:378000,  returnPct:51.2,  startDate:new Date('2019-01-10'), status:'active',  broker:'Vanguard',         notes:'Broad market exposure' },
  { name:'SoftBank Vision Fund II',    type:'private_equity', ticker:null,    amount:500000, currentValue:720000,  returnPct:44.0,  startDate:new Date('2020-04-15'), status:'active',  broker:'SoftBank',         notes:'Tech-focused private equity' },
  { name:'Microsoft (MSFT)',           type:'stocks',         ticker:'MSFT',  amount:220000, currentValue:365000,  returnPct:65.9,  startDate:new Date('2018-11-22'), status:'active',  broker:'JP Morgan',        notes:'Cloud & AI exposure' },
  { name:'AI Startup Seed Round',      type:'startup',        ticker:null,    amount:150000, currentValue:480000,  returnPct:220.0, startDate:new Date('2021-03-08'), status:'active',  broker:'Sequoia Capital',  notes:'Series B AI infrastructure startup' },
  { name:'US Corporate Bond Fund',     type:'bonds',          ticker:'LQD',   amount:350000, currentValue:382000,  returnPct:9.1,   startDate:new Date('2020-02-14'), status:'active',  broker:'BlackRock',        notes:'Investment-grade fixed income' },
  { name:'Google (GOOGL)',             type:'stocks',         ticker:'GOOGL', amount:280000, currentValue:447000,  returnPct:59.6,  startDate:new Date('2019-08-19'), status:'active',  broker:'Goldman Sachs',    notes:'Digital advertising & AI moat' },
  { name:'Berkshire Hathaway (BRK.B)', type:'stocks',         ticker:'BRK.B', amount:195000, currentValue:254000,  returnPct:30.3,  startDate:new Date('2017-12-01'), status:'active',  broker:'JP Morgan',        notes:'Value investing core position' },
  { name:'Dubai Luxury Apartments',    type:'real_estate',    ticker:null,    amount:600000, currentValue:890000,  returnPct:48.3,  startDate:new Date('2019-05-15'), status:'active',  broker:'DAMAC Properties', notes:'Two units in Downtown Dubai tower' },
  { name:'Nvidia (NVDA)',              type:'stocks',         ticker:'NVDA',  amount:120000, currentValue:510000,  returnPct:325.0, startDate:new Date('2020-10-05'), status:'active',  broker:'Morgan Stanley',   notes:'GPU/AI semiconductor play' },
  { name:'BlackRock World Mining Fund',type:'mutual_fund',    ticker:null,    amount:200000, currentValue:248000,  returnPct:24.0,  startDate:new Date('2018-06-12'), status:'exited',  broker:'BlackRock',        notes:'Exited at profit, Q3 2023' },
  { name:'Fintech Series A (exited)',  type:'startup',        ticker:null,    amount:100000, currentValue:0,       returnPct:180.0, startDate:new Date('2018-02-28'), status:'exited',  broker:'Y Combinator',     notes:'Exited at 2.8x. Payments app acquisition.' },
  { name:'Gold Futures (COMEX)',       type:'commodity',      ticker:'GC=F',  amount:250000, currentValue:318000,  returnPct:27.2,  startDate:new Date('2020-07-20'), status:'active',  broker:'Interactive Brokers', notes:'Inflation hedge — rolling contracts' },
  { name:'Palantir (PLTR)',            type:'stocks',         ticker:'PLTR',  amount:90000,  currentValue:148000,  returnPct:64.4,  startDate:new Date('2020-09-30'), status:'active',  broker:'Robinhood',        notes:'Data analytics — government contracts' },
  { name:'iShares MSCI Emerging Mkts', type:'etf',           ticker:'EEM',   amount:175000, currentValue:189000,  returnPct:8.0,   startDate:new Date('2021-01-07'), status:'active',  broker:'iShares',          notes:'EM diversification' },
  { name:'Private Credit Fund',        type:'bonds',         ticker:null,    amount:280000, currentValue:329000,  returnPct:17.5,  startDate:new Date('2022-03-01'), status:'active',  broker:'Ares Management',  notes:'Private credit — direct lending' },
];

// ── Robert's huge transaction history ─────────────────────────────────────────
// These are large completed transfers — all showing as completed in history
const ROBERT_TRANSACTIONS = [
  { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Goldman Sachs Private Wealth',          amount:2500000,  daysAgo:5 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire Transfer — Blackstone Real Estate Partners IX',    amount:1800000,  daysAgo:9 },
  { type:'credit', category:'transfer_in',  method:'wire',         desc:'Dividend Disbursement — Manhattan RE Fund Q4',          amount:620000,   daysAgo:14 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire to JP Morgan Private Bank — Portfolio Rebalance',  amount:950000,   daysAgo:21 },
  { type:'credit', category:'deposit',      method:'bank_transfer',desc:'Settlement — Fintech Series A Exit Proceeds',           amount:3200000,  daysAgo:30 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire Transfer — Chase Sapphire Private Account',        amount:750000,   daysAgo:38 },
  { type:'credit', category:'salary',       method:'bank_transfer',desc:'Annual Bonus — Chase Consulting Group LLC',             amount:480000,   daysAgo:45 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'International Wire — HSBC Dubai Branch',                amount:620000,   daysAgo:52 },
  { type:'credit', category:'transfer_in',  method:'wire',         desc:'Incoming Wire — SoftBank Vision Fund Distribution',     amount:1100000,  daysAgo:60 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire Transfer — Rolls Royce Purchase (Phantom VIII)',   amount:480000,   daysAgo:67 },
  { type:'credit', category:'deposit',      method:'crypto_btc',   desc:'Bitcoin Liquidation — Coinbase Prime',                  amount:573070,   daysAgo:75 },
  { type:'debit',  category:'bill',         method:'internal',     desc:'Property Management & Maintenance — Greenwich Estate',  amount:85000,    daysAgo:82 },
  { type:'credit', category:'transfer_in',  method:'wire',         desc:'Real Estate Rental Income — Dubai Apartments (6mo)',    amount:168000,   daysAgo:90 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Trust Fund Annual Contribution',                 amount:500000,   daysAgo:98 },
  { type:'credit', category:'salary',       method:'bank_transfer',desc:'Quarterly Dividend — AAPL, MSFT, GOOGL, AMZN',         amount:142000,   daysAgo:105 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Incoming Payment Forwarded — Wells Fargo Private',      amount:800000,   daysAgo:112 },
  { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Sequoia Capital (Portfolio Co. Exit)',   amount:890000,   daysAgo:120 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Vanguard Investment Account Funding',            amount:550000,   daysAgo:128 },
  { type:'credit', category:'transfer_in',  method:'bank_transfer',desc:'PayPal Business Settlement — Q3 Consulting Fees',       amount:320000,   daysAgo:135 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire Transfer — Patek Philippe & Richard Mille Purchase',amount:590000,  daysAgo:142 },
  { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Ares Management Credit Distribution',   amount:760000,   daysAgo:150 },
  { type:'debit',  category:'bill',         method:'internal',     desc:'Annual Insurance Premium — Lloyd\'s of London',         amount:125000,   daysAgo:158 },
  { type:'credit', category:'transfer_in',  method:'wire',         desc:'HSBC Premier Balance Transfer — Portfolio Consolidation',amount:1200000, daysAgo:165 },
  { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Gold Purchase (12 Bars, Swiss Vault)',           amount:780000,   daysAgo:172 },
  { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Morgan Stanley Wealth Management',      amount:1500000,  daysAgo:180 },
];

async function seed() {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑  Cleared existing data');

    // ── Standard users ────────────────────────────────────────────────────────
    const STANDARD = [
      { firstName:'Admin',    lastName:'User',     email:'admin@nexabank.com',  password:'Admin1234!', role:'admin', balance:99999,    kyc:'Verified', status:'active', withdrawalsEnabled: true },
      { firstName:'Jordan',   lastName:'Mitchell', email:'jordan@nexabank.com', password:'Test1234!',  role:'user',  balance:12840.50, kyc:'Verified', status:'active', withdrawalsEnabled: false, withdrawalsBlockReason: 'Withdrawal capability requires administrator approval. Please contact support.' },
      { firstName:'Samantha', lastName:'Lee',      email:'sam@nexabank.com',    password:'Test1234!',  role:'user',  balance:5200.00,  kyc:'Verified', status:'active', withdrawalsEnabled: false, withdrawalsBlockReason: 'Withdrawal capability requires administrator approval. Please contact support.' },
      { firstName:'Marcus',   lastName:'Brown',    email:'marcus@nexabank.com', password:'Test1234!',  role:'user',  balance:890.25,   kyc:'Pending',  status:'suspended', withdrawalsEnabled: false, withdrawalsBlockReason: 'Account suspended — withdrawals disabled.' },
      { firstName:'Priya',    lastName:'Patel',    email:'priya@nexabank.com',  password:'Test1234!',  role:'user',  balance:31500.00, kyc:'Verified', status:'active', withdrawalsEnabled: false, withdrawalsBlockReason: 'Withdrawal capability requires administrator approval. Please contact support.' },
    ];
    for (const u of STANDARD) {
      const user = new User(u);
      await user.save();
      console.log(`👤 Created: ${user.firstName} ${user.lastName}`);
    }

    // ── Robert Chase — HNW with BLOCKED transfers ────────────────────────────
    const robert = new User({
      firstName: 'Robert', lastName: 'Chase',
      email: 'robert_chase224@gmail.com', password: 'robert001#',
      phone: '+1 (212) 555-8800',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 1430000, savingsBalance: 250000, savingsGoal: 500000,

      // ── TRANSFERS BLOCKED ─────────────────────────────────────────────────
      transfersEnabled: false,
      transfersBlockReason: 'Your account has been flagged for enhanced due diligence review. Large transaction volumes require additional compliance verification before transfer capabilities can be restored.',
      transferRequirements: [
        { type: 'kyc_upgrade', label: 'Enhanced KYC Verification (Tier 3)', fulfilled: false, notes: 'Submit government-issued ID and proof of funds documentation' },
        { type: 'document_upload', label: 'Source of Funds Declaration', fulfilled: false, notes: 'Provide certified documentation verifying the source of all funds above $1M' },
        { type: 'admin_review', label: 'Compliance Team Review & Approval', fulfilled: false, notes: 'Pending manual review by compliance officer' },
      ],
      // Withdrawals still allowed
      withdrawalsEnabled: true,

      linkedAccounts: LINKED_ACCOUNTS,
      cryptoAssets:   CRYPTO_ASSETS,
      treasuryAssets: TREASURY_ASSETS,
      investments:    INVESTMENTS,
      trust: {
        enabled: true, name: 'Chase Family Revocable Living Trust',
        balance: 5000000, type: 'revocable',
        trustee: 'Robert Chase & Margaret Chase',
        beneficiary: 'Emily Chase, James Chase (children)',
        established: new Date('2016-08-15'),
        notes: 'Managed by Sullivan & Cromwell LLP. Includes real estate, securities, and personal property. Annual review scheduled every December.'
      },
    });
    await robert.save();
    console.log('💎 Created: Robert Chase (HNW — transfers BLOCKED)');

    // ── Robert's big transaction history ─────────────────────────────────────
    for (const t of ROBERT_TRANSACTIONS) {
      const createdAt = new Date(Date.now() - t.daysAgo * 86400000);
      const tx = new Transaction({
        userId: robert._id, type: t.type, category: t.category,
        method: t.method, amount: t.amount, fee: 0,
        description: t.desc, status: 'completed',
        balanceAfter: robert.balance,
        createdAt, updatedAt: createdAt, completedAt: createdAt,
      });
      await tx.save();
    }
    console.log(`📊 Created ${ROBERT_TRANSACTIONS.length} large transactions for Robert Chase`);

    // ── Standard user transactions ────────────────────────────────────────────
    const normalUsers = await User.find({ role: 'user', email: { $ne: 'robert_chase224@gmail.com' } });
    const TX_TPL = [
      { type:'credit', category:'deposit',     method:'ach',          desc:'ACH Deposit' },
      { type:'credit', category:'salary',      method:'bank_transfer',desc:'Salary Deposit' },
      { type:'debit',  category:'withdrawal',  method:'ach',          desc:'ACH Withdrawal' },
      { type:'debit',  category:'bill',        method:'internal',     desc:'Electricity Bill' },
      { type:'debit',  category:'bill',        method:'internal',     desc:'Rent Payment' },
      { type:'credit', category:'deposit',     method:'paypal',       desc:'PayPal Deposit' },
      { type:'debit',  category:'transfer_out',method:'wire',         desc:'Wire Transfer' },
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
      await Notification.create({ userId: user._id, title: 'Welcome to NexaBank!', message: `Hi ${user.firstName}! Your account is ready.`, type: 'system', priority: 'high' });
    }

    // Blocked notification for Robert
    await Notification.create({
      userId: robert._id,
      title: '⚠️ Transfer Capability Restricted',
      message: 'Your account has been flagged for enhanced due diligence. Transfer functionality is currently suspended pending compliance review. Please contact your account manager.',
      type: 'security', priority: 'high'
    });

    const totalNW = 1430000 + CRYPTO_ASSETS.reduce((s,a)=>s+a.valueUSD,0) + TREASURY_ASSETS.reduce((s,a)=>s+a.totalValue,0) + INVESTMENTS.reduce((s,a)=>s+a.currentValue,0) + LINKED_ACCOUNTS.reduce((s,a)=>s+a.balance,0) + 5000000;
    console.log('\n✅ Seed complete!');
    console.log('─────────────────────────────────────────────────');
    console.log(`Robert Chase Net Worth: ~$${Math.round(totalNW).toLocaleString()}`);
    console.log('Transfer status: 🔴 BLOCKED (3 requirements pending)');
    console.log('─────────────────────────────────────────────────');
    console.log('Credentials:');
    console.log('  Admin:  admin@nexabank.com   / Admin1234!');
    console.log('  HNW:    robert_chase224@gmail.com / robert001#');
    console.log('  User:   jordan@nexabank.com  / Test1234!');
    console.log('─────────────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}
seed();
