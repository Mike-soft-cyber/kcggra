const passport = require('passport');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController')
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

// OTP routes
router.post('/request-otp', userController.requestOTP);
router.post('/verify-otp', userController.verifyOTP);

// Email/Password routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// Profile routes
router.patch('/update-profile', protect, userController.updateProfile);
router.get('/me', protect, userController.getMe);

// 2FA routes
router.post('/2fa/enable', protect, authController.enable2FA);
router.post('/2fa/verify', protect, authController.verify2FA);
router.post('/2fa/disable', protect, authController.disable2FA);

router.get('/google', (req, res, next) => {
  // ✅ Save role to session if provided
  const role = req.query.role;
  if (role && ['resident', 'guard', 'admin'].includes(role)) {
    req.session = req.session || {};
    req.session.signupRole = role;
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false,
    state: role || 'resident' // ✅ Pass role as state
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`, 
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Set role from state parameter if it's a new user
      const roleFromState = req.query.state;
      if (roleFromState && ['resident', 'guard', 'admin'].includes(roleFromState)) {
        // Only update role if user was just created (has default username pattern)
        if (user.username && user.username.includes('@')) {
          user.role = roleFromState;
          await user.save();
        }
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      if (user.role === 'admin') {
        res.redirect(`${frontendUrl}/admin/dashboard`);
      } else if (user.role === 'guard') {
        res.redirect(`${frontendUrl}/guard/dashboard`);
      } else {
        res.redirect(`${frontendUrl}/dashboard`);
      }
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout Successful'
  });
});

module.exports = router;