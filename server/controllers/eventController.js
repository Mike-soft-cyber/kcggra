const Event = require('../models/Events');
const User = require('../models/User');

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location, event_type, max_attendees } = req.body;
    const created_by = req.user._id;

    if (!title || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, and location are required',
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      created_by,
      event_type: event_type || 'meeting',
      max_attendees,
      attendees: [{
        user_id: created_by,
        status: 'attending',
        joined_at: new Date(),
      }],
    });

    await event.populate('created_by', 'username profilePic');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message,
    });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const events = await Event.find({
      is_active: true,
      date: { $gte: new Date() }, // Only future events
    })
      .populate('created_by', 'username profilePic')
      .populate('attendees.user_id', 'username profilePic')
      .sort({ date: 1 }) // Earliest first
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('created_by', 'username profilePic phone')
      .populate('attendees.user_id', 'username profilePic street');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('❌ Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
};

exports.rsvpToEvent = async (req, res) => {
  try {
    const { status } = req.body; // 'attending', 'maybe', 'declined'
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user already RSVP'd
    const existingRsvp = event.attendees.find(
      a => a.user_id.toString() === req.user._id.toString()
    );

    if (existingRsvp) {
      // Update existing RSVP
      existingRsvp.status = status;
    } else {
      // Add new RSVP
      event.attendees.push({
        user_id: req.user._id,
        status,
        joined_at: new Date(),
      });
    }

    await event.save();
    await event.populate('attendees.user_id', 'username profilePic');

    res.status(200).json({
      success: true,
      message: `RSVP updated to: ${status}`,
      event,
    });
  } catch (error) {
    console.error('❌ RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to RSVP',
    });
  }
};