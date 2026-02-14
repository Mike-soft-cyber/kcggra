const express = require('express');
const router = express.Router();
const userSettingsController = require('../controllers/userSettingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);


router.patch('/profile', userSettingsController.updateProfile);
router.patch('/notifications', userSettingsController.updateNotificationPreferences);
router.post('/change-password', userSettingsController.changePassword);
router.get('/sessions', userSettingsController.getActiveSessions);
router.post('/signout-all', userSettingsController.signOutAllDevices);
router.post('/proxy', userSettingsController.addProxyAccount);

module.exports = router;