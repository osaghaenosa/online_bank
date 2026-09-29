const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');
const { protect, adminOnly } = require('../middleware/auth');

const DEFAULT_TOKEN_PACKAGES = [
  { tokens: 100, price: 10 },
  { tokens: 300, price: 20 },
  { tokens: 500, price: 30 },
];

// Public route to check maintenance mode
router.get('/maintenance', async (req, res, next) => {
  try {
    const s = await AppSettings.findOne({ key: 'maintenance_mode' });
    res.json({ maintenance: s?.value === true });
  } catch (err) {
    next(err);
  }
});

// Admin route to toggle maintenance mode
router.post('/maintenance', protect, adminOnly, async (req, res, next) => {
  try {
    const { enabled } = req.body;
    await AppSettings.findOneAndUpdate(
      { key: 'maintenance_mode' },
      { key: 'maintenance_mode', value: !!enabled, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, maintenance: !!enabled });
  } catch (err) {
    next(err);
  }
});

// Public route to check card fee
router.get('/card-fee', async (req, res, next) => {
  try {
    const s = await AppSettings.findOne({ key: 'card_fee' });
    res.json({ cardFee: s ? Number(s.value) : 50 });
  } catch (err) {
    next(err);
  }
});

// Admin route to set card fee
router.post('/card-fee', protect, adminOnly, async (req, res, next) => {
  try {
    const { cardFee } = req.body;
    await AppSettings.findOneAndUpdate(
      { key: 'card_fee' },
      { key: 'card_fee', value: Number(cardFee) || 0, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, cardFee: Number(cardFee) || 0 });
  } catch (err) {
    next(err);
  }
});

// Public route to retrieve token package pricing
router.get('/token-packages', async (req, res, next) => {
  try {
    const setting = await AppSettings.findOne({ key: 'token_packages' });
    const packages = Array.isArray(setting?.value) && setting.value.length === DEFAULT_TOKEN_PACKAGES.length
      ? setting.value
      : DEFAULT_TOKEN_PACKAGES;
    res.json({ packages });
  } catch (err) {
    next(err);
  }
});

// Admin route to update token package pricing
router.post('/token-packages', protect, adminOnly, async (req, res, next) => {
  try {
    const packages = req.body.packages;
    if (!Array.isArray(packages) || packages.length !== DEFAULT_TOKEN_PACKAGES.length) {
      return res.status(400).json({ error: 'Exactly three token packages are required' });
    }

    const normalizedPackages = packages.map(pkg => ({
      tokens: Number(pkg?.tokens),
      price: Number(pkg?.price),
    }));
    if (normalizedPackages.some(pkg => !Number.isSafeInteger(pkg.tokens) || pkg.tokens <= 0)) {
      return res.status(400).json({ error: 'Each token amount must be a positive whole number' });
    }
    if (normalizedPackages.some(pkg => !Number.isFinite(pkg.price) || pkg.price <= 0)) {
      return res.status(400).json({ error: 'Each package price must be greater than zero' });
    }

    await AppSettings.findOneAndUpdate(
      { key: 'token_packages' },
      { key: 'token_packages', value: normalizedPackages, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, packages: normalizedPackages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
