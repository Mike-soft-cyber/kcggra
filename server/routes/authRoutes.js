const passport = require('passport');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── Resident / Guard OTP Auth ─────────────────────────
router.post('/request-otp', userController.requestOTP);
router.post('/verify-otp',  userController.verifyOTP);

// ── Email/Password (residents) ────────────────────────
router.post('/signup', userController.signup);
router.post('/login',  userController.login);

// ── Profile updates (role excluded) ──────────────────
router.patch('/update-profile', protect, userController.updateProfile);
router.get('/me', protect, userController.getMe);

// ── 2FA ───────────────────────────────────────────────
router.post('/2fa/enable',  protect, authController.enable2FA);
router.post('/2fa/verify',  protect, authController.verify2FA);
router.post('/2fa/disable', protect, authController.disable2FA);

// ── Google OAuth ──────────────────────────────────────
// ✅ SECURITY: role is no longer passed via state param
// New Google users are always created as 'resident'
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      // ✅ Role comes from DB only — never from OAuth state
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.cookie('token', token, {
        httpOnly: true, secure: true, sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const base = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (user.role === 'admin')      res.redirect(`${base}/admin/dashboard`);
      else if (user.role === 'guard') res.redirect(`${base}/guard/dashboard`);
      else                            res.redirect(`${base}/dashboard`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

// ── Logout ────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logout Successful' });
});

// ════════════════════════════════════════════════════════
// ADMIN-ONLY LOGIN
// POST /auth/admin-login
//
// Called from:
//   Web:    AdminSecretLogin.jsx (secret URL only you know)
//   Mobile: LoginScreen.js after 7 logo taps + correct PIN
//
// Uses email + password, NOT phone OTP.
// Returns identical 401 for wrong password AND non-admin
// to prevent user enumeration.
// Admin sessions expire in 12h (shorter than resident 30d).
// ════════════════════════════════════════════════════════
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email }).select('+password');

    // ✅ Same error for: wrong password / no account / not admin
    if (!user || !user.password || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Track session
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || 'Unknown';
    if (!user.active_sessions) user.active_sessions = [];
    user.active_sessions.push({
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      ip_address: ipAddress,
      login_time: new Date(),
      last_active: new Date(),
      user_agent: userAgent,
    });
    if (user.active_sessions.length > 5) {
      user.active_sessions = user.active_sessions.slice(-5);
    }
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' } // ✅ Shorter expiry for admin
    );

    res.cookie('token', token, {
      httpOnly: true, secure: true, sameSite: 'none',
      maxAge: 12 * 60 * 60 * 1000,
    });

    console.log(`🔐 Admin login: ${user.username} from ${ipAddress}`);

    res.status(200).json({
      success: true,
      message: 'Authenticated',
      user: {
        _id: user._id, username: user.username,
        email: user.email, role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// ════════════════════════════════════════════════════════
// SECRET ROLE GRANT
// POST /auth/grant-role
// Body: { phone, role, secret }
//
// Use this ONCE to promote yourself to admin after
// first signup, then use it whenever you add a new guard.
// Returns 404 for wrong secret (looks like dead route).
//
// Set in Railway env vars:
//   ADMIN_GRANT_SECRET=long-random-string-only-you-know
// ════════════════════════════════════════════════════════
router.post('/grant-role', userController.grantRole);

module.exports = router;