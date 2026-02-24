const express = require('express');
const router = express.Router();
const guardController = require('../controllers/guardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post(
  '/update-location',
  authorize('guard', 'admin'),
  guardController.updateLocation
);

router.get('/active-locations', guardController.getActiveGuardLocations);

router.get(
  '/patrol-history',
  authorize('admin'),
  guardController.getPatrolHistory
);

router.get('/all', authorize('admin'), guardController.getAllGuards);
router.get('/stats', guardController.getGuardStats);
router.get('/current-shift', guardController.getCurrentShift);
router.post('/start-shift', authorize('guard'), guardController.startShift);
router.post('/end-shift', authorize('guard'), guardController.endShift);
router.get('/on-duty', authorize('admin'), guardController.getOnDutyGuards);

module.exports = router;