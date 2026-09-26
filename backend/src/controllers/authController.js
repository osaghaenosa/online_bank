const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '30d'
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, email, password, phone, country, location, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const resolvedLocation = location || address?.city || '';
    const resolvedCountry = country || address?.country || '';
    const user = new User({
      firstName, lastName, email, password, phone,
      location: resolvedLocation,
      address: { ...(address || {}), city: resolvedLocation, country: resolvedCountry },
      balance: 0.00,
      kyc: 'Pending'
    });
    await user.save();

    // Welcome notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to NexaBanking!',
      message: `Hi ${firstName}! Your account has been created. Complete KYC verification to unlock all features.`,
      type: 'system',
      priority: 'high'
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact support.' });

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = signToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, country, location, notifications, savingsGoal } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (notifications !== undefined) user.notifications = notifications;
    if (savingsGoal !== undefined) user.savingsGoal = savingsGoal;

    if (address || country !== undefined || location !== undefined) {
      const nextAddress = { ...(user.address?.toObject?.() || user.address || {}), ...(address || {}) };
      if (location !== undefined) {
        user.location = location;
        nextAddress.city = location;
      } else if (address?.city !== undefined) {
        user.location = address.city;
      }
      if (country !== undefined) nextAddress.country = country;
      user.address = nextAddress;
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
};
