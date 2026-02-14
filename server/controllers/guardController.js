const GuardLocation = require('../models/GuardLocation');
const User = require('../models/User');

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, zone, status } = req.body;
    const guard_id = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const location = await GuardLocation.create({
      guard_id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      zone: zone || 'Unknown Zone',
      status: status || 'on_patrol',
      timestamp: new Date(),
    });

    const io = req.app.get('io');
    io.to('residents').emit('guard-location-update', {
      guard_id,
      guard_name: req.user.username,
      zone,
      status,
      timestamp: location.timestamp,
    });

    res.status(200).json({
      success: true,
      message: 'Location updated',
      location,
    });
  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
    });
  }
};

exports.getActiveGuardLocations = async (req, res) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const locations = await GuardLocation.find({
      timestamp: { $gte: tenMinutesAgo },
    })
      .populate('guard_id', 'username phone')
      .sort({ timestamp: -1 });

    const guardLocations = {};
    locations.forEach((loc) => {
      const guardId = loc.guard_id._id.toString();
      if (!guardLocations[guardId]) {
        guardLocations[guardId] = loc;
      }
    });

    const activeGuards = Object.values(guardLocations);

    res.status(200).json({
      success: true,
      count: activeGuards.length,
      guards: activeGuards,
    });
  } catch (error) {
    console.error('❌ Get active guards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guard locations',
    });
  }
};

exports.getPatrolHistory = async (req, res) => {
  try {
    const { guard_id, hours = 24 } = req.query;

    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    const filter = { timestamp: { $gte: timeAgo } };
    if (guard_id) filter.guard_id = guard_id;

    const history = await GuardLocation.find(filter)
      .populate('guard_id', 'username')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('❌ Get patrol history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patrol history',
    });
  }
};

exports.getAllGuards = async (req, res) => {
  try {
    const guards = await User.find({ role: 'guard', isActive: true })
      .select('username phone street profilePic createdAt');

    res.status(200).json({
      success: true,
      count: guards.length,
      guards,
    });
  } catch (error) {
    console.error('❌ Get guards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guards',
    });
  }
};