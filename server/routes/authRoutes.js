const passport = require('passport');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── Cookie config helper ──────────────────────────────────
// On localhost (http) the browser silently drops cookies with
// secure:true + sameSite:'none'. This caused Google OAuth to fail
// on first attempt — the cookie was set but immediately discarded.
// Fix: use lax/false in dev, none/true in production.
const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure:   isProd,                    // false on localhost, true on Railway/Vercel
  sameSite: isProd ? 'none' : 'lax',  // 'none' requires secure:true (only in prod)
  maxAge:   maxAgeMs,
});

// ── OTP Auth ──────────────────────────────────────────────
router.post('/request-otp', userController.requestOTP);
router.post('/verify-otp',  userController.verifyOTP);

// ── Email/Password ────────────────────────────────────────
router.post('/signup', userController.signup);
router.post('/login',  userController.login);

// ── Profile ───────────────────────────────────────────────
router.patch('/update-profile', protect, userController.updateProfile);
router.get('/me', protect, userController.getMe);

// ── 2FA ───────────────────────────────────────────────────
router.post('/2fa/enable',  protect, authController.enable2FA);
router.post('/2fa/verify',  protect, authController.verify2FA);
router.post('/2fa/disable', protect, authController.disable2FA);

// ── Google OAuth ──────────────────────────────────────────
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
      const user  = req.user;
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // ✅ Cookie works on localhost now (secure:false + sameSite:lax)
      res.cookie('token', token, cookieOptions(30 * 24 * 60 * 60 * 1000));

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

// ── Logout ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions(0));
  res.json({ success: true, message: 'Logout Successful' });
});

// ── Admin-only login ──────────────────────────────────────
// Called from secret URL (web) or 7 taps + PIN (mobile)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email }).select('+password');

    // Same error for wrong password AND non-admin — prevents user enumeration
    if (!user || !user.password || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || 'Unknown';
    if (!user.active_sessions) user.active_sessions = [];
    user.active_sessions.push({
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      ip_address: ipAddress, login_time: new Date(),
      last_active: new Date(), user_agent: userAgent,
    });
    if (user.active_sessions.length > 5) {
      user.active_sessions = user.active_sessions.slice(-5);
    }
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, cookieOptions(12 * 60 * 60 * 1000));
    console.log(`🔐 Admin login: ${user.username} from ${ipAddress}`);

    res.status(200).json({
      success: true,
      message: 'Authenticated',
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// ── Secret role grant ─────────────────────────────────────
// POST /auth/grant-role  { phone, role, secret }
// Returns 404 for wrong secret (looks like dead route)
router.post('/grant-role', userController.grantRole);

module.exports = router;