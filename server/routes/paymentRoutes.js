const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const paymentController = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// MULTER CONFIG FOR BANK SLIP UPLOADS
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kcggra/bank-slips',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, quality: 'auto' }],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs allowed'), false);
    }
  },
});

// PUBLIC ROUTES (M-Pesa Callback)
// M-Pesa callback (no auth required - called by Safaricom)
router.post('/mpesa/callback', paymentController.mpesaCallback);


// USER ROUTES (Protected)
router.use(protect);

// Initiate M-Pesa STK Push
router.post('/mpesa/initiate', paymentController.initiateMpesaPayment);

// Check M-Pesa payment status (polling)
router.get('/mpesa/status/:checkoutRequestID', paymentController.checkMpesaStatus);

// Submit bank payment with slip upload
router.post('/bank', upload.single('bank_slip'), paymentController.createBankPayment);

// Get my payments
router.get('/my-payments', paymentController.getMyPayments);

// Get payment summary
router.get('/summary', paymentController.getPaymentSummary);

// ADMIN ROUTES
// Get all pending payments (for verification)
router.get('/pending', adminOnly, paymentController.getPendingPayments);

// Verify/reject payment
router.patch('/:payment_id/verify', adminOnly, paymentController.verifyPayment);

module.exports = router;