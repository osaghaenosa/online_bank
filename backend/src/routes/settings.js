const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');
const { protect, adminOnly } = require('../middleware/auth');

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
    res.json({ fee: s ? Number(s.value) : 50 });
  } catch (err) {
    next(err);
  }
});

// Admin route to set card fee
router.post('/card-fee', protect, adminOnly, async (req, res, next) => {
  try {
    const { fee } = req.body;
    await AppSettings.findOneAndUpdate(
      { key: 'card_fee' },
      { key: 'card_fee', value: Number(fee) || 0, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, fee: Number(fee) || 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
