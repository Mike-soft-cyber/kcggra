const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mpesa-callback', paymentController.mpesaCallback);

router.use(protect);

router.post('/subscribe', paymentController.initiateSubscription);
router.post('/donate-project', paymentController.donateProject);
router.get('/projects', paymentController.getAllProjects);
router.get('/history', paymentController.getPaymentHistory);
router.get('/check-status/:checkoutRequestID', paymentController.checkPaymentStatus);
router.get('/project-progress', paymentController.getProjectProgress);
router.get('/all', authorize('admin'), paymentController.getAllPayments);

module.exports = router;