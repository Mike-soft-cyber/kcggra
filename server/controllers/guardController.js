const GuardLocation = require('../models/GuardLocation');
const User = require('../models/User');
const Incident = require('../models/Incident');

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

exports.getGuardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayIncidents = await Incident.countDocuments({
      createdAt: { $gte: today },
    });

    const onDutyGuards = await User.countDocuments({
      role: 'guard',
      'active_shift.startTime': { $exists: true },
    });

    const pendingAlerts = await Incident.countDocuments({
      status: { $in: ['reported', 'investigating'] },
    });

    return res.status(200).json({
      success: true,
      todayIncidents,
      onDutyGuards,
      pendingAlerts,
    });
  } catch (error) {
    console.error('❌ Get guard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch guard stats',
    });
  }
};

exports.getCurrentShift = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.active_shift || !user.active_shift.startTime) {
      return res.status(200).json({
        success: true,
        shift: null,
      });
    }

    return res.status(200).json({
      success: true,
      shift: {
        startTime: user.active_shift.startTime,
        incidents: user.active_shift.incidents?.length || 0,
        visitors: user.active_shift.visitors?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Get current shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current shift',
    });
  }
};

exports.startShift = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.active_shift && user.active_shift.startTime) {
      return res.status(400).json({
        success: false,
        message: 'You are already on an active shift',
      });
    }

    user.active_shift = {
      startTime: new Date(),
      incidents: [],
      visitors: [],
    };

    await user.save();

    console.log(`✅ Guard ${user.username} started shift`);

    return res.status(200).json({
      success: true,
      message: 'Shift started successfully',
      shift: {
        startTime: user.active_shift.startTime,
        incidents: 0,
        visitors: 0,
      },
    });
  } catch (error) {
    console.error('❌ Start shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start shift',
    });
  }
};

exports.endShift = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.active_shift || !user.active_shift.startTime) {
      return res.status(400).json({
        success: false,
        message: 'No active shift to end',
      });
    }

    const startTime = user.active_shift.startTime;
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / (1000 * 60));

    const summary = {
      startTime,
      endTime,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      incidents: user.active_shift.incidents?.length || 0,
      visitors: user.active_shift.visitors?.length || 0,
    };

    user.active_shift = undefined;
    await user.save();

    console.log(`✅ Guard ${user.username} ended shift - Duration: ${summary.duration}`);

    return res.status(200).json({
      success: true,
      message: 'Shift ended successfully',
      summary,
    });
  } catch (error) {
    console.error('❌ End shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end shift',
    });
  }
};

exports.getOnDutyGuards = async (req, res) => {
  try {
    const guards = await User.find({
      role: 'guard',
      'active_shift.startTime': { $exists: true },
    }).select('username phone active_shift');

    const guardsWithDuration = guards.map((guard) => {
      const duration = new Date() - guard.active_shift.startTime;
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

      return {
        _id: guard._id,
        username: guard.username,
        phone: guard.phone,
        shiftStart: guard.active_shift.startTime,
        duration: `${hours}h ${minutes}m`,
        incidents: guard.active_shift.incidents?.length || 0,
        visitors: guard.active_shift.visitors?.length || 0,
      };
    });

    return res.status(200).json({
      success: true,
      guards: guardsWithDuration,
      total: guardsWithDuration.length,
    });
  } catch (error) {
    console.error('❌ Get on-duty guards error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch on-duty guards',
    });
  }
};