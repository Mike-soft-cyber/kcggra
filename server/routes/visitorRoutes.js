const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', visitorController.createVisitor);
router.get('/', visitorController.getMyVisitors);
router.get('/:visitor_id', visitorController.getVisitor);
router.delete('/:visitor_id', visitorController.cancelVisitor);
router.post(
  '/:visitor_id/verify',
  authorize('guard', 'admin'),
  visitorController.verifyVisitor
);
router.post(
  '/:visitor_id/checkout',
  authorize('guard', 'admin'),
  visitorController.checkoutVisitor
);
router.get(
  '/gate/active',
  authorize('guard', 'admin'),
  visitorController.getActiveVisitors
);

module.exports = router;