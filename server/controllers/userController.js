const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/smsService');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otpUtils');

// ─────────────────────────────────────────────────────────
// REQUEST OTP
// ─────────────────────────────────────────────────────────
exports.requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const phoneRegex = /^254[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Start with 254XXXX',
      });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = new User({
        phone,
        username: `User_${phone.slice(-4)}`,
        street: 'Not specified',
        role: 'resident', // ✅ Always resident — role never set at signup
        otp: { code: otp, expiresAt },
      });
    } else {
      user.otp = { code: otp, expiresAt };
    }

    await user.save();

    let smsSent = false;
    try {
      await sendOTP(`+${phone}`, otp);
      smsSent = true;
    } catch (error) {
      console.error('⚠️ SMS failed:', error.message);
    }

    res.status(200).json({
      success: true,
      message: smsSent ? 'OTP sent to your phone' : 'OTP generated (check console)',
      isNewUser,
      ...(process.env.NODE_ENV === 'development' && { otp }),
      smsSent,
    });
  } catch (error) {
    console.error('❌ Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    // ✅ SECURITY: 'role' intentionally NOT destructured
    // Client can never set their own role through this endpoint
    const { phone, otp, username, street } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found. Request OTP first.',
      });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Request a new one.',
      });
    }

    if (isOTPExpired(user.otp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Request a new one.',
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    if (username) user.username = username;
    if (street)   user.street   = street;

    // ✅ SECURITY: role is NEVER updated here
    // Role changes only happen via /auth/grant-role (secret endpoint)

    user.otp = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        phone: user.phone,
        username: user.username,
        email: user.email,
        street: user.street,
        role: user.role,
        subStatus: user.subStatus,
        profilePic: user.profilePic,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// SIGNUP (email + password)
// ─────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { username, email, password, phone, street } = req.body;

    if (!username || !email || !password || !phone || !street) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    // ✅ SECURITY: role always 'resident' regardless of what client sends
    const user = await User.create({
      username, email,
      password: hashedPass,
      phone, street,
      role: 'resident',
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      user: {
        _id: user._id, username: user.username,
        email: user.email, phone: user.phone,
        street: user.street, role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Signup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// LOGIN (email + password — for residents who used signup)
// ─────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';

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
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id, username: user.username,
        email: user.email, phone: user.phone,
        street: user.street, role: user.role,
        subStatus: user.subStatus,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    // ✅ SECURITY: role intentionally excluded — cannot be changed via profile update
    const { username, street, email } = req.body;
    const user = req.user;

    if (username) user.username = username;
    if (street)   user.street   = street;
    if (email)    user.email    = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id, username: user.username,
        phone: user.phone, email: user.email,
        street: user.street, role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -otp')
      .populate('proxy_user_id', 'username phone');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id, username: user.username,
        email: user.email, phone: user.phone,
        street: user.street, role: user.role,
        subStatus: user.subStatus, lastPayment: user.lastPayment,
        profilePic: user.profilePic, isActive: user.isActive,
        notification_preferences: user.notification_preferences || {
          security_alerts: true, payment_reminders: true,
          community_updates: true, sms_notifications: false,
        },
        proxy_user_id: user.proxy_user_id,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// GRANT ROLE (secret endpoint — only you know it exists)
//
// POST /auth/grant-role
// Body: { phone, role, secret }
//
// Set ADMIN_GRANT_SECRET in Railway environment variables.
// Returns 404 for wrong secret so it looks like a dead route.
//
// Use this to:
//   - Promote yourself to admin after first signup
//   - Grant 'guard' role to security staff
//
// Example curl (run once):
//   curl -X POST https://your-app.railway.app/auth/grant-role \
//     -H "Content-Type: application/json" \
//     -d '{"phone":"254XXXXXXXXX","role":"admin","secret":"your-secret"}'
// ─────────────────────────────────────────────────────────
exports.grantRole = async (req, res) => {
  try {
    const { phone, role, secret } = req.body;

    // Wrong secret → generic 404 (looks like dead route)
    if (!secret || secret !== process.env.ADMIN_GRANT_SECRET) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (!['admin', 'guard', 'resident'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`🔐 Role granted: ${user.username} → ${role} (was ${oldRole})`);

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user: {
        _id: user._id, username: user.username,
        phone: user.phone, role: user.role,
      },
    });
  } catch (error) {
    console.error('Grant role error:', error);
    res.status(500).json({ success: false, message: 'Failed to grant role' });
  }
};