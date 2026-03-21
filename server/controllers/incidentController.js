const Incident = require('../models/Incident')
const User = require('../models/User')
const { sendIncidentAlert } = require('../services/smsService')

exports.createIncidents = async(req, res) => {
    try {
        const { type, description, latitude, longitude, address } = req.body;
        const reporter_id = req.user._id

        if (!type || !description) {
            return res.status(400).json({
                success: false,
                message: 'Type and description are required',
            });
        }

        const mediaUrls = req.files ? req.files.map(file => file.path) : []

        const incident = await Incident.create({
            user: reporter_id,
            type,
            description,
            location: {  type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)]},
            coordinates: [parseFloat(longitude) || 36.8219, parseFloat(latitude) || -1.2921],
            address: address || 'Location not specified',
            media: mediaUrls,
            status: 'reported'
        })

        await incident.populate('user', 'username phone street')

        const io = req.app.get('io')

        io.to('guards').emit('new-incident', {
            incident,
            message: `new ${type} incident reported!`
        })

        io.to('residents').emit('nearby-incident', {
            incident,
            message: 'Security alert in your area! A-team handling it.'
        })

        try {
            const guards = await User.find({role: 'guard', isActive: true})
            const guardPhones = guards.map(g => `+${g.phone}`)

            if(guardPhones.length > 0){
                await sendIncidentAlert(guardPhones, {
                    type,
                    address: address || incident.address,
                    _id: incident._id
                })
            }
        } catch (smsError) {
            console.error('Failed to send SMS alerts:', smsError);
        }

        res.status(201).json({
            success: true,
            message: 'Incident reported successfully',
            incident
        })
    } catch (error) {
        console.error('Create incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create incident',
            error: error.message,
        });
    }
}

exports.getIncidents = async(req, res) => {
    try {
        const { status, type, limit = 50 } = req.query

        const filter = {}
        if(status) filter.status = status
        if(type) filter.type = type

        const incidents = await Incident.find(filter)
        .populate('user', 'username phone street')
        .populate('assignedGuard', 'username phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: incidents.length,
            incidents,
        });
    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incidents',
            error: error.message,
        });
    }
}

exports.getIncident = async(req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
        .populate('user', 'username phone street profilePic')
        .populate('assignedGuard', 'username phone');

        if(!incident){
            return res.status(404).json({
                success: false,
                message: 'Incident not found',
            });
        }

        res.status(200).json({
            success: true,
            incident,
        });
    } catch (error) {
        console.error('Get incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incident',
            error: error.message,
        });
    }
}

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    incident.status = status;
    
    if (status === 'in_progress' && !incident.assignedGuard) {
      incident.assignedGuard = req.user._id;
    }

    if (status === 'resolved') {
      incident.resolvedAt = new Date();
      if (resolution_notes) incident.resolution_notes = resolution_notes;
    }

    await incident.save();
    await incident.populate('user', 'username phone street profilePic');
    await incident.populate('assignedGuard', 'username phone');

    const io = req.app.get('io');
    io.to(`user-${incident.user._id}`).emit('incident-update', {
      incident,
      message: `Your incident has been marked as ${status}`,
    });

    res.status(200).json({
      success: true,
      message: 'Incident updated',
      incident,
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident',
      error: error.message,
    });
  }
};

exports.getNearbyIncidents = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 1000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required',
      });
    }

    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate('user', 'username street phone')
      .limit(20);

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error('Get nearby incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby incidents',
      error: error.message,
    });
  }
};

exports.getIncidentsByGuard = async(req, res) => {
    try {
        const { status, type, limit = 10 } = req.query

        const filter = { assignedGuard: req.user._id }
        if(status) filter.status = status
        if(type) filter.type = type

        const incidents = await Incident.find(filter)
        .populate('assignedGuard', 'username phone')
        .sort({ createdAt : -1 })
        .limit(limit)

        res.status(200).json({
            success: true,
            count: incidents.length,
            incidents,
        });
    } catch (error) {
        console.error('Get guard incidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guard incidents',
            error: error.message,
        });
    }
}