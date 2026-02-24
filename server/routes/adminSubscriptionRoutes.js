const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminSubController = require('../controllers/adminSubscriptionController');

router.use(protect);
router.use(adminOnly);

// Get all subscriptions with filters
router.get('/', adminSubController.getAllSubscriptions);

// Get subscription analytics
router.get('/analytics', adminSubController.getSubscriptionAnalytics);

// Update subscription status
router.patch('/:userId/status', adminSubController.updateSubscriptionStatus);

// Grant grace period
router.post('/:userId/grace', adminSubController.grantGracePeriod);

// Suspend user access
router.post('/:userId/suspend', adminSubController.suspendAccess);

// Send payment reminders to overdue users
router.post('/send-reminders', adminSubController.sendPaymentReminders);

module.exports = router;