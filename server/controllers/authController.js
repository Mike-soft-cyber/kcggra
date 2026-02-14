const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `KCGGRA (${user.email || user.phone})`,
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Save secret (temporarily)
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false; // Not enabled until verified
    await user.save();
    
    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });
    
    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
      
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    
    res.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};