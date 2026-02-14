const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.post(
  '/',
  upload.array('media', 5),
  incidentController.createIncidents
);

router.get('/', incidentController.getIncidents);

router.get('/nearby', incidentController.getNearbyIncidents);

router.get('/:id', incidentController.getIncident);

router.patch(
  '/:id/status',
  authorize('guard', 'admin'),
  incidentController.updateIncidentStatus
);

module.exports = router;