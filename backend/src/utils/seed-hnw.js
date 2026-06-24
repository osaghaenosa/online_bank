/**
 * seed-hnw.js  — Seeds 5 additional High-Net-Worth user accounts
 * Run with:  node src/utils/seed-hnw.js
 *
 * Each account mirrors the depth of Robert Chase:
 *   - Large balance
 *   - Full linked accounts, crypto, treasury, investments
 *   - Rich transaction history
 *   - Profile picture (uploaded to ImageKit if configured, else skipped)
 *
 * IMPORTANT: Does NOT clear existing data. Only adds these 5 users.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const User     = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexabank';

// ── Profile picture paths (generated images) ─────────────────────────────────
// Swap these paths to wherever the images actually live on your system.
// If a path doesn't exist the script will silently skip uploading the photo.
const PHOTO_DIR = 'C:\\Users\\NOSA\\.gemini\\antigravity\\brain\\8316f924-6f09-4e41-8170-e0216e5e71a2';

const PHOTOS = {
  james:    path.join(PHOTO_DIR, 'james_whitfield_1782291825025.png'),
  victoria: path.join(PHOTO_DIR, 'victoria_osei_1782291836248.png'),
  daniel:   path.join(PHOTO_DIR, 'daniel_hartmann_1782291854849.png'),
  sophia:   path.join(PHOTO_DIR, 'sophia_ramirez_1782291866091.png'),
  nathaniel:path.join(PHOTO_DIR, 'nathaniel_bowers_1782291876735.png'),
};

async function uploadPhoto(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  Photo not found: ${filePath} — skipping`);
    return null;
  }
  try {
    const { uploadToImageKit } = require('./imagekit');
    const buffer = fs.readFileSync(filePath);
    const result = await uploadToImageKit(buffer, fileName, '/nexabank/avatars');
    console.log(`  📷 Uploaded: ${fileName}`);
    return { url: result.url, fileId: result.fileId };
  } catch (e) {
    console.warn(`  ⚠️  ImageKit upload failed (${e.message}) — account will have no photo`);
    return null;
  }
}

// ── Shared asset templates (varied per user) ──────────────────────────────────
function makeCrypto(multiplier = 1) {
  return [
    { coin:'Bitcoin',  symbol:'BTC', quantity: parseFloat((4 * multiplier).toFixed(4)), avgBuyPrice:28000, currentPrice:67420, valueUSD: Math.round(4 * multiplier * 67420),  walletAddress:'1BitcoinEaterAddressDontSendLRUXjPt', network:'Bitcoin', acquiredAt:new Date('2020-06-01') },
    { coin:'Ethereum', symbol:'ETH', quantity: parseFloat((60 * multiplier).toFixed(2)), avgBuyPrice:1100, currentPrice:3210,  valueUSD: Math.round(60 * multiplier * 3210),   walletAddress:'0xAbCd1234EfGh5678IjKl9012MnOp3456QrSt',  network:'ERC-20',  acquiredAt:new Date('2021-01-15') },
    { coin:'Solana',   symbol:'SOL', quantity: parseFloat((800 * multiplier).toFixed(0)), avgBuyPrice:20, currentPrice:172,   valueUSD: Math.round(800 * multiplier * 172),    walletAddress:'SoLaNA4Nd1maBCDEFGH890123456789ABCDEF',     network:'Solana',  acquiredAt:new Date('2021-08-10') },
    { coin:'USDT',     symbol:'USDT',quantity: parseFloat((85000 * multiplier).toFixed(0)), avgBuyPrice:1, currentPrice:1,  valueUSD: Math.round(85000 * multiplier),         walletAddress:'TUsdt1234567890ABCDEFghijKLmnoP',          network:'TRC-20',  acquiredAt:new Date('2022-03-01') },
  ];
}

function makeTreasury(theme = 'standard') {
  const bases = {
    standard: [
      { category:'gold',    name:'Gold Bullion Bars (1kg)',          description:'LBMA certified, stored in Singapore freeport vault', quantity:8,  unitPrice:65000, totalValue:520000, acquiredAt:new Date('2019-05-12'), location:'Freeport, Singapore', serialNo:'AU-SG-2019-081', notes:"Insured by Lloyd's of London" },
      { category:'watch',   name:'Audemars Piguet Royal Oak',        description:'Stainless steel, blue tapisserie dial, 41mm',        quantity:1,  unitPrice:175000,totalValue:175000, acquiredAt:new Date('2020-02-28'), location:'Home Safe, Miami',    serialNo:'AP-ROO-SS-0441', notes:'Original papers and box included' },
      { category:'art',     name:'Abstract Canvas Collection',       description:'3 signed originals by mid-career artists',           quantity:3,  unitPrice:80000, totalValue:240000, acquiredAt:new Date('2018-11-30'), location:'Private Gallery, Miami', serialNo:'ART-MIA-2018', notes:'Art advisor managed' },
      { category:'vehicle', name:'Ferrari 488 GTB',                  description:'2021 Rosso Corsa, full carbon package',             quantity:1,  unitPrice:310000,totalValue:310000, acquiredAt:new Date('2021-04-10'), location:'Private Garage, Miami',  serialNo:'ZFF79ALA0L0239241', notes:'Ferrari maintenance plan' },
      { category:'bonds',   name:'US Treasury Notes (5yr)',          description:'Series issued via Fidelity custodian',              quantity:3,  unitPrice:100000,totalValue:300000, acquiredAt:new Date('2020-09-01'), location:'Custodian: Fidelity',  serialNo:'USTN-2020-003', notes:'Maturity: Sep 2025' },
    ],
    tech: [
      { category:'gold',    name:'Gold ETF Holdings (GLD)',          description:'Physical gold-backed ETF, custodian SPDR',          quantity:5,  unitPrice:195000,totalValue:975000, acquiredAt:new Date('2020-01-15'), location:'Custodian: SPDR',     serialNo:'GLD-2020-005', notes:'Quarterly rebalanced' },
      { category:'watch',   name:'Patek Philippe Calatrava',         description:'White gold, ivory enamel dial',                     quantity:1,  unitPrice:95000, totalValue:95000,  acquiredAt:new Date('2021-06-18'), location:'Bank Safe, NYC',      serialNo:'PP-CAL-WG-0228', notes:'Serviced 2023' },
      { category:'art',     name:'Digital Art NFT Portfolio',        description:'Blue-chip NFT collection (Bored Ape, CryptoPunks)', quantity:12, unitPrice:45000, totalValue:540000, acquiredAt:new Date('2021-09-05'), location:'Cold Wallet Storage', serialNo:'NFT-COLL-2021', notes:'Custodied on Ledger hardware wallet' },
      { category:'bonds',   name:'Corporate Bond Ladder',            description:'Investment-grade 2-10yr maturities',               quantity:4,  unitPrice:125000,totalValue:500000, acquiredAt:new Date('2019-07-22'), location:'Custodian: Schwab',   serialNo:'CBL-2019-004', notes:'BlackRock managed ladder' },
    ],
    realestate: [
      { category:'gold',    name:'Gold Sovereign Coins',             description:'British sovereign 1oz coins, Royal Mint certified', quantity:60, unitPrice:2600,  totalValue:156000, acquiredAt:new Date('2019-03-01'), location:'Swiss Vault, Zurich', serialNo:'GBP-SOV-2019-060', notes:'Certified by Royal Mint' },
      { category:'jewelry', name:'Emerald Pendant Necklace',         description:'18k gold, 8ct Colombian emerald, GIA certified',   quantity:1,  unitPrice:88000, totalValue:88000,  acquiredAt:new Date('2021-11-22'), location:'Bank Vault, London', serialNo:'JWL-EME-0011', notes:'GIA certified, appraised 2023' },
      { category:'vehicle', name:'Bentley Bentayga Speed',           description:'2022 Onyx Black, Mulliner spec',                  quantity:1,  unitPrice:230000,totalValue:230000, acquiredAt:new Date('2022-01-20'), location:'Private Garage, London', serialNo:'SJAAM2ZV3NC013541', notes:'Full service history' },
      { category:'bonds',   name:'Municipal Bond Portfolio',         description:'Tax-exempt muni bonds, A-rated issuers',           quantity:6,  unitPrice:90000, totalValue:540000, acquiredAt:new Date('2020-11-05'), location:'Custodian: JP Morgan',  serialNo:'MUNI-2020-006', notes:'Annual coupon 4.1%' },
    ],
  };
  return bases[theme] || bases.standard;
}

function makeLinkedAccounts(prefix) {
  return [
    { platform:'chase',       label:'Chase Private Client',         accountId:`****${Math.floor(1000+Math.random()*9000)}`, balance:Math.round(500000+Math.random()*1000000), currency:'USD' },
    { platform:'bofa',        label:'BofA Preferred Rewards',       accountId:`****${Math.floor(1000+Math.random()*9000)}`, balance:Math.round(300000+Math.random()*700000),  currency:'USD' },
    { platform:'wells_fargo', label:'Wells Fargo Private Bank',     accountId:`****${Math.floor(1000+Math.random()*9000)}`, balance:Math.round(400000+Math.random()*600000),  currency:'USD' },
    { platform:'paypal',      label:'PayPal Business',              accountId:`${prefix}@paypal.com`,                        balance:Math.round(80000 +Math.random()*120000),  currency:'USD' },
    { platform:'hsbc',        label:'HSBC Premier Banking',         accountId:`****${Math.floor(1000+Math.random()*9000)}`, balance:Math.round(600000+Math.random()*900000),  currency:'USD' },
  ];
}

function makeInvestments(profile = 'balanced') {
  const sets = {
    balanced: [
      { name:'Apple Inc (AAPL)',          type:'stocks',      ticker:'AAPL',  amount:180000, currentValue:295000, returnPct:63.9, startDate:new Date('2018-04-10'), status:'active', broker:'Goldman Sachs',  notes:'Long-term core holding' },
      { name:'S&P 500 ETF (SPY)',         type:'etf',         ticker:'SPY',   amount:300000, currentValue:458000, returnPct:52.7, startDate:new Date('2018-08-01'), status:'active', broker:'Fidelity',       notes:'Index exposure' },
      { name:'Manhattan Real Estate',     type:'real_estate', ticker:null,    amount:600000, currentValue:930000, returnPct:55.0, startDate:new Date('2017-12-01'), status:'active', broker:'Blackstone',     notes:'Commercial RE fund' },
      { name:'Microsoft (MSFT)',          type:'stocks',      ticker:'MSFT',  amount:160000, currentValue:264000, returnPct:65.0, startDate:new Date('2019-03-15'), status:'active', broker:'JP Morgan',      notes:'Cloud & AI play' },
      { name:'Nvidia (NVDA)',             type:'stocks',      ticker:'NVDA',  amount:90000,  currentValue:384000, returnPct:327, startDate:new Date('2020-11-02'), status:'active', broker:'Morgan Stanley', notes:'GPU/AI semiconductor' },
      { name:'Private Credit Fund',       type:'bonds',       ticker:null,    amount:250000, currentValue:293000, returnPct:17.2, startDate:new Date('2021-06-01'), status:'active', broker:'Ares Management',notes:'Direct lending strategy' },
      { name:'Vanguard Total Market ETF', type:'etf',         ticker:'VTI',   amount:200000, currentValue:302000, returnPct:51.0, startDate:new Date('2019-02-14'), status:'active', broker:'Vanguard',       notes:'Broad market exposure' },
      { name:'Amazon (AMZN)',             type:'stocks',      ticker:'AMZN',  amount:220000, currentValue:356000, returnPct:61.8, startDate:new Date('2018-07-20'), status:'active', broker:'Goldman Sachs',  notes:'E-commerce & cloud' },
      { name:'Dubai Real Estate Trust',   type:'real_estate', ticker:null,    amount:450000, currentValue:666000, returnPct:48.0, startDate:new Date('2019-09-01'), status:'active', broker:'DAMAC',          notes:'Two luxury units, Downtown Dubai' },
      { name:'AI Infrastructure Fund',    type:'startup',     ticker:null,    amount:120000, currentValue:384000, returnPct:220, startDate:new Date('2021-04-10'), status:'active', broker:'Sequoia Capital',notes:'Series B — AI data center infra' },
    ],
    growth: [
      { name:'Tesla (TSLA)',              type:'stocks',      ticker:'TSLA',  amount:140000, currentValue:240000, returnPct:71.4, startDate:new Date('2019-08-10'), status:'active', broker:'Morgan Stanley', notes:'EV sector exposure' },
      { name:'Google (GOOGL)',            type:'stocks',      ticker:'GOOGL', amount:200000, currentValue:318000, returnPct:59.0, startDate:new Date('2018-10-01'), status:'active', broker:'Goldman Sachs',  notes:'Digital ads & AI' },
      { name:'Palantir (PLTR)',           type:'stocks',      ticker:'PLTR',  amount:70000,  currentValue:115000, returnPct:64.3, startDate:new Date('2020-10-01'), status:'active', broker:'Robinhood',      notes:'Government data analytics' },
      { name:'SoftBank Vision Fund II',   type:'private_equity',ticker:null, amount:400000, currentValue:580000, returnPct:45.0, startDate:new Date('2020-06-15'), status:'active', broker:'SoftBank',       notes:'Global tech PE fund' },
      { name:'Coinbase (COIN)',           type:'stocks',      ticker:'COIN',  amount:85000,  currentValue:130000, returnPct:52.9, startDate:new Date('2021-04-14'), status:'active', broker:'Fidelity',       notes:'Crypto exchange exposure' },
      { name:'BlackRock World Mining',    type:'mutual_fund', ticker:null,    amount:180000, currentValue:222000, returnPct:23.3, startDate:new Date('2018-07-01'), status:'exited', broker:'BlackRock',      notes:'Exited Q4 2023 at profit' },
      { name:'S&P 500 ETF (SPY)',         type:'etf',         ticker:'SPY',   amount:250000, currentValue:381000, returnPct:52.4, startDate:new Date('2019-01-10'), status:'active', broker:'Charles Schwab', notes:'Core index holding' },
      { name:'Berkshire Hathaway (BRK.B)',type:'stocks',      ticker:'BRK.B', amount:160000, currentValue:207000, returnPct:29.4, startDate:new Date('2018-02-01'), status:'active', broker:'JP Morgan',      notes:'Value core position' },
      { name:'Gold Futures (COMEX)',      type:'commodity',   ticker:'GC=F',  amount:200000, currentValue:255000, returnPct:27.5, startDate:new Date('2020-08-14'), status:'active', broker:'Interactive Brokers',notes:'Inflation hedge' },
      { name:'US Corporate Bond Fund',    type:'bonds',       ticker:'LQD',   amount:300000, currentValue:327000, returnPct:9.0,  startDate:new Date('2021-01-07'), status:'active', broker:'BlackRock',      notes:'IG fixed income' },
    ],
  };
  return sets[profile] || sets.balanced;
}

function makeTxHistory(userId, balance, namePrefix) {
  const templates = [
    { type:'credit', category:'deposit',      method:'wire',         desc:`Incoming Wire — ${namePrefix} Holdings LLC`,       daysAgo:4  },
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire Transfer — Blackstone Investment Partners',   daysAgo:8  },
    { type:'credit', category:'transfer_in',  method:'wire',         desc:'Quarterly Dividend — Investment Portfolio',        daysAgo:15 },
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — JP Morgan Private Bank Rebalance',          daysAgo:22 },
    { type:'credit', category:'salary',       method:'bank_transfer',desc:`Annual Bonus — ${namePrefix} Capital Group`,       daysAgo:30 },
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'International Wire — HSBC Premier Account',        daysAgo:40 },
    { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Real Estate Rental Income (Q3)',   daysAgo:52 },
    { type:'debit',  category:'bill',         method:'internal',     desc:'Property Management — Luxury Residence',           daysAgo:60 },
    { type:'credit', category:'transfer_in',  method:'wire',         desc:'Trust Distribution — Annual Income',               daysAgo:72 },
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Goldman Sachs Portfolio Funding',           daysAgo:85 },
    { type:'credit', category:'deposit',      method:'crypto_btc',   desc:'Bitcoin Partial Liquidation — Coinbase Prime',     daysAgo:95 },
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Vanguard Investment Account Top-Up',        daysAgo:105},
    { type:'credit', category:'salary',       method:'bank_transfer',desc:'Consulting Retainer — Q4 Advisory Fee',           daysAgo:118},
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Trust Fund Annual Contribution',            daysAgo:130},
    { type:'credit', category:'deposit',      method:'wire',         desc:'Incoming Wire — Private Equity Distribution',      daysAgo:142},
    { type:'debit',  category:'bill',         method:'internal',     desc:"Annual Insurance Premium — Lloyd's of London",     daysAgo:155},
    { type:'credit', category:'transfer_in',  method:'wire',         desc:'HSBC Balance Transfer — Portfolio Consolidation',  daysAgo:168},
    { type:'debit',  category:'transfer_out', method:'wire',         desc:'Wire — Blackstone RE Fund Capital Call',           daysAgo:178},
  ];
  const amounts = [2200000, 1500000, 580000, 890000, 420000, 600000, 155000, 75000, 480000, 950000, 445000, 380000, 310000, 500000, 720000, 115000, 1100000, 650000];
  return templates.map((t, i) => ({
    userId, type: t.type, category: t.category, method: t.method,
    amount: amounts[i], fee: 0, description: t.desc, status: 'completed',
    balanceAfter: balance,
    createdAt: new Date(Date.now() - t.daysAgo * 86400000),
    completedAt: new Date(Date.now() - t.daysAgo * 86400000),
  }));
}

// ── The 5 HNW Users ───────────────────────────────────────────────────────────
const HNW_USERS = [
  {
    key: 'james',
    data: {
      firstName: 'James', lastName: 'Whitfield',
      email: 'james.whitfield@nexabanking.com',
      password: 'James2024!',
      phone: '+1 (646) 555-2210',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 1850000, savingsBalance: 320000, savingsGoal: 600000,
      transfersEnabled: false,
      transfersBlockReason: 'Account under enhanced due diligence review. Transfer capabilities restricted pending compliance verification.',
      transferRequirements: [
        { type: 'kyc_upgrade',     label: 'Enhanced KYC (Tier 3)',              fulfilled: false, notes: 'Tier 3 ID verification required' },
        { type: 'document_upload', label: 'Source of Funds Declaration',        fulfilled: false, notes: 'Certified documentation for fund origins' },
        { type: 'admin_review',    label: 'Compliance Review & Approval',       fulfilled: false, notes: 'Pending manual compliance officer review' },
      ],
      withdrawalsEnabled: true,
      trust: { enabled: true, name: 'Whitfield Family Trust', balance: 4200000, type: 'irrevocable', trustee: 'James Whitfield', beneficiary: 'Catherine Whitfield & Oliver Whitfield', established: new Date('2015-03-22'), notes: 'Managed by Davis Polk & Wardwell LLP.' },
    },
    linkedAccounts: () => makeLinkedAccounts('james.whitfield'),
    cryptoAssets: () => makeCrypto(1.1),
    treasuryAssets: () => makeTreasury('standard'),
    investments: () => makeInvestments('balanced'),
    txPrefix: 'Whitfield',
  },
  {
    key: 'victoria',
    data: {
      firstName: 'Victoria', lastName: 'Osei-Mensah',
      email: 'victoria.osei@nexabanking.com',
      password: 'Victoria2024!',
      phone: '+1 (212) 555-7740',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 2100000, savingsBalance: 450000, savingsGoal: 800000,
      transfersEnabled: false,
      transfersBlockReason: 'Large inbound transfers flagged for AML review. Transfers disabled pending compliance clearance.',
      transferRequirements: [
        { type: 'kyc_upgrade',     label: 'Enhanced KYC Verification (Tier 3)', fulfilled: false, notes: 'AML enhanced verification required' },
        { type: 'admin_review',    label: 'AML Compliance Review',              fulfilled: false, notes: 'Anti-money laundering review in progress' },
      ],
      withdrawalsEnabled: true,
      trust: { enabled: true, name: 'Osei Family Foundation', balance: 6500000, type: 'charitable', trustee: 'Victoria Osei-Mensah', beneficiary: 'Education & Healthcare charities, Ghana', established: new Date('2018-07-10'), notes: 'Managed by Cleary Gottlieb LLP.' },
    },
    linkedAccounts: () => makeLinkedAccounts('victoria.osei'),
    cryptoAssets: () => makeCrypto(1.3),
    treasuryAssets: () => makeTreasury('tech'),
    investments: () => makeInvestments('growth'),
    txPrefix: 'Osei-Mensah',
  },
  {
    key: 'daniel',
    data: {
      firstName: 'Daniel', lastName: 'Hartmann',
      email: 'daniel.hartmann@nexabanking.com',
      password: 'Daniel2024!',
      phone: '+49 30 555 8822',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 3200000, savingsBalance: 580000, savingsGoal: 1000000,
      transfersEnabled: false,
      transfersBlockReason: 'Cross-border transfers require FATF compliance review. Account restricted pending additional documentation.',
      transferRequirements: [
        { type: 'kyc_upgrade',     label: 'Enhanced KYC (Tier 3)',              fulfilled: false, notes: 'International compliance verification' },
        { type: 'document_upload', label: 'Source of Funds Declaration',        fulfilled: false, notes: 'EU regulatory documentation required' },
        { type: 'admin_review',    label: 'FATF Compliance Review',             fulfilled: false, notes: 'Cross-border compliance officer review' },
      ],
      withdrawalsEnabled: true,
      trust: { enabled: true, name: 'Hartmann Vermögen Trust', balance: 8000000, type: 'revocable', trustee: 'Daniel Hartmann & Ingrid Hartmann', beneficiary: 'Klaus Hartmann, Anna Hartmann (children)', established: new Date('2013-09-15'), notes: 'Managed by Freshfields Bruckhaus Deringer, Frankfurt.' },
    },
    linkedAccounts: () => makeLinkedAccounts('d.hartmann'),
    cryptoAssets: () => makeCrypto(1.8),
    treasuryAssets: () => makeTreasury('realestate'),
    investments: () => makeInvestments('balanced'),
    txPrefix: 'Hartmann',
  },
  {
    key: 'sophia',
    data: {
      firstName: 'Sophia', lastName: 'Ramirez',
      email: 'sophia.ramirez@nexabanking.com',
      password: 'Sophia2024!',
      phone: '+1 (305) 555-9930',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 1650000, savingsBalance: 280000, savingsGoal: 500000,
      transfersEnabled: false,
      transfersBlockReason: 'High-value account flagged for enhanced monitoring. Transfers suspended pending identity re-verification.',
      transferRequirements: [
        { type: 'kyc_upgrade',     label: 'Enhanced KYC Verification (Tier 3)', fulfilled: false, notes: 'Enhanced identity verification required' },
        { type: 'document_upload', label: 'Source of Funds Certificate',        fulfilled: false, notes: 'Certified source of funds document' },
        { type: 'admin_review',    label: 'Senior Compliance Officer Review',   fulfilled: false, notes: 'Pending senior officer sign-off' },
      ],
      withdrawalsEnabled: true,
      trust: { enabled: true, name: 'Ramirez Family Living Trust', balance: 3800000, type: 'revocable', trustee: 'Sophia & Carlos Ramirez', beneficiary: 'Isabella Ramirez, Mateo Ramirez (children)', established: new Date('2017-04-20'), notes: 'Managed by Greenberg Traurig, Miami.' },
    },
    linkedAccounts: () => makeLinkedAccounts('sophia.ramirez'),
    cryptoAssets: () => makeCrypto(0.9),
    treasuryAssets: () => makeTreasury('standard'),
    investments: () => makeInvestments('growth'),
    txPrefix: 'Ramirez',
  },
  {
    key: 'nathaniel',
    data: {
      firstName: 'Nathaniel', lastName: 'Bowers',
      email: 'nathaniel.bowers@nexabanking.com',
      password: 'Nathaniel2024!',
      phone: '+1 (404) 555-6615',
      role: 'user', status: 'active', kyc: 'Verified',
      balance: 2750000, savingsBalance: 500000, savingsGoal: 900000,
      transfersEnabled: false,
      transfersBlockReason: 'Account flagged during routine transaction monitoring. Transfers paused for enhanced due diligence review.',
      transferRequirements: [
        { type: 'kyc_upgrade',     label: 'Enhanced KYC Verification (Tier 3)', fulfilled: false, notes: 'Submit Tier-3 government ID' },
        { type: 'document_upload', label: 'Source of Funds Declaration',        fulfilled: false, notes: 'Wealth source documentation required' },
        { type: 'admin_review',    label: 'Compliance Team Review',             fulfilled: false, notes: 'Pending compliance board review' },
      ],
      withdrawalsEnabled: true,
      trust: { enabled: true, name: 'Bowers Legacy Trust', balance: 5500000, type: 'irrevocable', trustee: 'Nathaniel Bowers & Renée Bowers', beneficiary: 'Jordan Bowers, Imani Bowers (children)', established: new Date('2016-01-08'), notes: 'Managed by Kirkland & Ellis LLP, Atlanta.' },
    },
    linkedAccounts: () => makeLinkedAccounts('n.bowers'),
    cryptoAssets: () => makeCrypto(1.5),
    treasuryAssets: () => makeTreasury('tech'),
    investments: () => makeInvestments('balanced'),
    txPrefix: 'Bowers',
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB\n');

    for (const u of HNW_USERS) {
      // Skip if already exists
      const existing = await User.findOne({ email: u.data.email });
      if (existing) {
        console.log(`⏭️  ${u.data.firstName} ${u.data.lastName} already exists — skipping`);
        continue;
      }

      // Upload profile photo
      const photo = await uploadPhoto(PHOTOS[u.key], `${u.key}-avatar.jpg`);

      // Build user document
      const user = new User({
        ...u.data,
        linkedAccounts:  u.linkedAccounts(),
        cryptoAssets:    u.cryptoAssets(),
        treasuryAssets:  u.treasuryAssets(),
        investments:     u.investments(),
        ...(photo ? { profilePicture: photo.url, profilePictureFileId: photo.fileId } : {}),
      });
      await user.save();
      console.log(`💎 Created: ${user.firstName} ${user.lastName} (balance: $${user.balance.toLocaleString()})`);

      // Transaction history
      const txs = makeTxHistory(user._id, user.balance, u.txPrefix);
      for (const t of txs) {
        await new Transaction(t).save();
      }
      console.log(`   📊 Created ${txs.length} transactions`);

      // Notifications
      await Notification.create({ userId: user._id, title: 'Welcome to NexaBank!', message: `Hi ${user.firstName}! Your premium account is active and ready.`, type: 'system', priority: 'high' });
      await Notification.create({
        userId: user._id,
        title: '⚠️ Transfer Capability Restricted',
        message: u.data.transfersBlockReason,
        type: 'security', priority: 'high',
      });
      console.log(`   🔔 Created notifications`);
    }

    console.log('\n✅ HNW seed complete!');
    console.log('─────────────────────────────────────────');
    console.log('Credentials:');
    HNW_USERS.forEach(u => console.log(`  ${u.data.firstName} ${u.data.lastName}: ${u.data.email} / ${u.data.password}`));
    console.log('─────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message, err.stack);
    process.exit(1);
  }
}

seed();
