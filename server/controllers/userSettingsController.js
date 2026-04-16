const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { cloudinary } = require('../config/cloudinary');

exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const profilePicUrl = req.file.path;
    const user = await User.findById(userId);

    if (user.profilePic && user.profilePic.includes('cloudinary')) {
      try {
        const urlParts = user.profilePic.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `kcggra/profile-pictures/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('⚠️ Failed to delete old profile pic (non-critical):', err.message);
      }
    }

    user.profilePic = profilePicUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePic: profilePicUrl,
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile picture', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // ✅ SECURITY: 'role' intentionally NOT destructured or applied
    const { username, email, street } = req.body;
    const user = req.user;

    if (username) user.username = username;
    if (email)    user.email    = email;
    if (street)   user.street   = street;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id, username: user.username,
        email: user.email, phone: user.phone,
        street: user.street, role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const user = req.user;
    user.notification_preferences = { ...user.notification_preferences, ...req.body };
    await user.save();
    return res.status(200).json({ success: true, message: 'Notification preferences updated', preferences: user.notification_preferences });
  } catch (error) {
    console.error('Update notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { security_alerts, payment_reminders, community_updates, sms_notifications } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.notification_preferences = {
      security_alerts:    security_alerts    !== undefined ? security_alerts    : user.notification_preferences.security_alerts,
      payment_reminders:  payment_reminders  !== undefined ? payment_reminders  : user.notification_preferences.payment_reminders,
      community_updates:  community_updates  !== undefined ? community_updates  : user.notification_preferences.community_updates,
      sms_notifications:  sms_notifications  !== undefined ? sms_notifications  : user.notification_preferences.sms_notifications,
    };

    await user.save();
    res.status(200).json({ success: true, message: 'Notification preferences updated', notification_preferences: user.notification_preferences });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: 'Password change not available for this account' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('active_sessions');
    res.status(200).json({ success: true, sessions: user.active_sessions || [] });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions' });
  }
};

exports.signOutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.active_sessions = [];
    await user.save();
    res.status(200).json({ success: true, message: 'Signed out of all devices successfully' });
  } catch (error) {
    console.error('Sign out all error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign out of all devices' });
  }
};

exports.addProxyAccount = async (req, res) => {
  try {
    const { proxy_username, proxy_phone, relationship } = req.body;
    let proxyUser = await User.findOne({ phone: proxy_phone });

    if (!proxyUser) {
      proxyUser = await User.create({
        username: proxy_username,
        phone: proxy_phone,
        role: 'resident', // ✅ proxy accounts always resident
        street: req.user.street,
        isActive: true,
      });
    }

    const mainUser = await User.findById(req.user._id);
    mainUser.proxy_user_id = proxyUser._id;
    await mainUser.save();

    res.status(200).json({
      success: true,
      message: 'Proxy account added successfully',
      proxy_user: { _id: proxyUser._id, username: proxyUser.username, phone: proxyUser.phone },
    });
  } catch (error) {
    console.error('Add proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to add proxy account' });
  }
};