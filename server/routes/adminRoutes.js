const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(adminOnly);

router.get('/stats', adminController.getDashboardStats);
router.get('/payment-trend', adminController.getPaymentTrend);
router.get('/attention-needed', adminController.getAttentionNeeded);
router.get('/residents', adminController.getAllResidents);
router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/subscriptions/:userId', adminController.updateSubscriptionStatus);
router.get('/capex', adminController.getCapExProjects);

module.exports = router;