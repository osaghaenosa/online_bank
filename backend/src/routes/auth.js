const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], ctrl.register);

router.post('/login', ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.patch('/profile', protect, ctrl.updateProfile);
router.patch('/password', protect, ctrl.changePassword);

module.exports = router;
