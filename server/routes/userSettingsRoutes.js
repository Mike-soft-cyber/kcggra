const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const userSettingsController = require('../controllers/userSettingsController');

const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kcggra/profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
    ],
  },
});

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});
router.patch('/profile', protect, userSettingsController.updateProfile);
router.patch(
  '/profile-picture',
  protect,
  uploadProfilePicture.single('profilePic'),
  userSettingsController.updateProfilePicture
);
router.patch('/notifications', protect, userSettingsController.updateNotifications);
router.get('/sessions', protect, userSettingsController.getActiveSessions);
router.post('/signout-all', protect, userSettingsController.signOutAllDevices);
router.post('/proxy', protect, userSettingsController.addProxyAccount);
router.post('/change-password', protect, userSettingsController.changePassword);

module.exports = router;