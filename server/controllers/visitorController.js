const Visitor = require('../models/Visitor');
const User = require('../models/User');
const QRCode = require('qrcode');
const { sendOTP } = require('../services/smsService');
const moment = require('moment');

const generateVisitorID = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIS-${date}-${random}`;
};

exports.createVisitor = async (req, res) => {
  try {
    const { guest_name, guest_phone, visit_date, purpose } = req.body;
    const host_id = req.user._id;

    if (!guest_name || !guest_phone || !visit_date) {
      return res.status(400).json({
        success: false,
        message: 'Guest name, phone, and visit date are required',
      });
    }

    const phoneRegex = /^254[0-9]{9}$/;
    if (!phoneRegex.test(guest_phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest phone number. Use format: 254XXXXXXXXX',
      });
    }

    const visitDate = moment(visit_date);
    if (visitDate.isBefore(moment(), 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Visit date cannot be in the past',
      });
    }

    const visitor_id = generateVisitorID();

    const qrCodeData = await QRCode.toDataURL(visitor_id, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    const visitor = await Visitor.create({
      visitor_id,
      host_id,
      guest_name,
      guest_phone,
      visit_date: visitDate.toDate(),
      purpose: purpose || 'guest',
      qr_code: qrCodeData,
      status: 'pending',
    });

    await visitor.populate('host_id', 'username phone street');

    try {
      const visitorLink = `${process.env.FRONTEND_URL}/visitor/${visitor_id}`;
      const message = `You're invited to ${visitor.host_id.street} on ${visitDate.format('MMM DD, YYYY')}. Show this code at the gate: ${visitorLink}`;

      await sendOTP(`+${guest_phone}`, message);
      console.log(`✅ Visitor invite sent to ${guest_phone}`);
    } catch (smsError) {
      console.error('❌ Failed to send visitor SMS:', smsError);
    }

    res.status(201).json({
      success: true,
      message: 'Visitor invitation created',
      visitor,
      qr_link: `${process.env.FRONTEND_URL}/visitor/${visitor_id}`,
    });
  } catch (error) {
    console.error('❌ Create visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visitor invitation',
      error: error.message,
    });
  }
};

exports.getMyVisitors = async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    const filter = { host_id: req.user._id };
    if (status) filter.status = status;

    if (upcoming === 'true') {
      filter.visit_date = { $gte: new Date() };
    }

    const visitors = await Visitor.find(filter)
      .populate('host_id', 'username street')
      .populate('checked_by_guard_id', 'username')
      .sort({ visit_date: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error('❌ Get visitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitors',
    });
  }
};

exports.getVisitor = async (req, res) => {
  try {
    const { visitor_id } = req.params;

    const visitor = await Visitor.findOne({ visitor_id })
      .populate('host_id', 'username phone street')
      .populate('checked_by_guard_id', 'username phone');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor invitation not found',
      });
    }

    res.status(200).json({
      success: true,
      visitor,
    });
  } catch (error) {
    console.error('❌ Get visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor',
    });
  }
};

exports.verifyVisitor = async (req, res) => {
  try {
    const { visitor_id } = req.params;
    const guard_id = req.user._id;

    const visitor = await Visitor.findOne({ visitor_id })
      .populate('host_id', 'username phone street');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Invalid visitor code',
      });
    }

    if (visitor.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Visitor already checked in',
        visitor,
      });
    }

    if (visitor.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Visitor invitation has expired',
      });
    }

    const visitDate = moment(visitor.visit_date);
    const today = moment();

    if (!visitDate.isSame(today, 'day')) {
      return res.status(400).json({
        success: false,
        message: `This invitation is for ${visitDate.format('MMM DD, YYYY')}, not today`,
      });
    }

    visitor.status = 'checked_in';
    visitor.check_in_time = new Date();
    visitor.checked_by_guard_id = guard_id;
    await visitor.save();

    const io = req.app.get('io');
    io.to(`user-${visitor.host_id._id}`).emit('visitor-arrival', {
      visitor,
      message: `${visitor.guest_name} has arrived`,
    });

    try {
      const message = `Your guest ${visitor.guest_name} has arrived at the gate and has been checked in.`;
      await sendOTP(`+${visitor.host_id.phone}`, message);
    } catch (smsError) {
      console.error('❌ Failed to notify host:', smsError);
    }

    res.status(200).json({
      success: true,
      message: 'Visitor verified successfully',
      visitor: {
        guest_name: visitor.guest_name,
        host_name: visitor.host_id.username,
        host_address: visitor.host_id.street,
        purpose: visitor.purpose,
        check_in_time: visitor.check_in_time,
      },
    });
  } catch (error) {
    console.error('❌ Verify visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify visitor',
    });
  }
};

exports.checkoutVisitor = async (req, res) => {
  try {
    const { visitor_id } = req.params;

    const visitor = await Visitor.findOne({ visitor_id });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    if (visitor.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Visitor is not checked in',
      });
    }

    visitor.status = 'checked_out';
    visitor.check_out_time = new Date();
    await visitor.save();

    res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      visitor,
    });
  } catch (error) {
    console.error('❌ Checkout visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to checkout visitor',
    });
  }
};

exports.cancelVisitor = async (req, res) => {
  try {
    const { visitor_id } = req.params;

    const visitor = await Visitor.findOne({ visitor_id, host_id: req.user._id });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found or unauthorized',
      });
    }

    visitor.status = 'cancelled';
    await visitor.save();

    res.status(200).json({
      success: true,
      message: 'Visitor invitation cancelled',
    });
  } catch (error) {
    console.error('❌ Cancel visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel visitor',
    });
  }
};

exports.getActiveVisitors = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const visitors = await Visitor.find({
      visit_date: { $gte: today, $lte: endOfDay },
      status: { $in: ['pending', 'checked_in'] },
    })
      .populate('host_id', 'username phone street')
      .sort({ visit_date: 1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error('❌ Get active visitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active visitors',
    });
  }
};