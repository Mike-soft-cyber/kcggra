const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const paymentController = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  },
})

router.use(protect);

router.post(
  '/subscription',
  upload.single('bank_slip'),
  paymentController.createSubscriptionPayment
);
router.post(
  '/capex',
  upload.single('bank_slip'),
  paymentController.createCapExPayment
);
router.get('/my-payments', paymentController.getMyPayments);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/pending', adminOnly, paymentController.getPendingPayments);
router.patch('/:payment_id/verify', adminOnly, paymentController.verifyPayment);

module.exports = router;