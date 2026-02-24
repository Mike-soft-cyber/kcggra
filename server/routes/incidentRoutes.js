const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { requireSubscription } = require('../middleware/subscriptionMiddleware');

router.use(protect);

router.post(
  '/',
  requireSubscription,
  upload.array('media', 5),
  incidentController.createIncidents
);

router.get('/', requireSubscription, incidentController.getIncidents);

router.get('/nearby', incidentController.getNearbyIncidents);

router.get('/:id', incidentController.getIncident);

router.patch(
  '/:id/status',
  authorize('guard', 'admin'),
  incidentController.updateIncidentStatus
);

module.exports = router;