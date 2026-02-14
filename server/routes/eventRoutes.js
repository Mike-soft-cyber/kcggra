const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Create event
router.post('/', eventController.createEvent);

// Get upcoming events
router.get('/', eventController.getUpcomingEvents);

// Get single event
router.get('/:id', eventController.getEvent);

// RSVP to event
router.post('/:id/rsvp', eventController.rsvpToEvent);

module.exports = router;