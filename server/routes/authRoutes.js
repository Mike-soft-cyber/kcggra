const passport = require('passport');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController')
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

router.post('/request-otp', userController.requestOTP);
router.post('/verify-otp', userController.verifyOTP);
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.patch('/update-profile', protect, userController.updateProfile);
router.get('/me', protect, userController.getMe);

router.post('/2fa/enable', protect, authController.enable2FA);
router.post('/2fa/verify', protect, authController.verify2FA);
router.post('/2fa/disable', protect, authController.disable2FA);

router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'], 
  session: false 
}));

router.get('/google/callback', passport.authenticate('google', { 
  failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`, 
  session: false 
}),
async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (req.user.role === 'admin') {
      res.redirect(`${frontendUrl}/admin/dashboard`);
    } else {
      res.redirect(`${frontendUrl}/dashboard`);
    }
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout Successful'
  });
});

module.exports = router;