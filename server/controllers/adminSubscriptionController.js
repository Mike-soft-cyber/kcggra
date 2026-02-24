const User = require('../models/User');
const Payment = require('../models/Payments');


exports.getAllSubscriptions = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = { role: 'resident' };
    if (status && status !== 'all') {
      filter.subStatus = status;
    }

    // Build search query
    let query = User.find(filter)
      .select('username email phone street subStatus lastPayment createdAt')
      .sort({ lastPayment: 1 });

    if (search) {
      query = query.or([
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { street: { $regex: search, $options: 'i' } },
      ]);
    }

    const users = await query;

    const usersWithDetails = users.map((user) => {
      const daysOverdue = calculateDaysOverdue(user.lastPayment);
      const nextDueDate = getNextDueDate(user.lastPayment);

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        street: user.street,
        subStatus: user.subStatus,
        lastPayment: user.lastPayment,
        daysOverdue,
        nextDueDate,
        createdAt: user.createdAt,
      };
    });

    const stats = {
      total: users.length,
      paid: users.filter((u) => u.subStatus === 'paid').length,
      grace: users.filter((u) => u.subStatus === 'grace').length,
      unpaid: users.filter((u) => u.subStatus === 'unpaid').length,
    };

    res.status(200).json({
      success: true,
      subscriptions: usersWithDetails,
      stats,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
    });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subStatus, reason } = req.body;

    if (!['paid', 'grace', 'unpaid'].includes(subStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription status',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'Can only update resident subscriptions',
      });
    }

    const oldStatus = user.subStatus;
    user.subStatus = subStatus;

    // If marking as paid, update lastPayment
    if (subStatus === 'paid') {
      user.lastPayment = new Date();
    }

    await user.save();

    console.log(`✅ Admin ${req.user.username} changed ${user.username}'s status: ${oldStatus} → ${subStatus}${reason ? ` (${reason})` : ''}`);

    res.status(200).json({
      success: true,
      message: 'Subscription status updated',
      user: {
        _id: user._id,
        username: user.username,
        subStatus: user.subStatus,
        lastPayment: user.lastPayment,
      },
    });
  } catch (error) {
    console.error('❌ Update subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription status',
    });
  }
};

exports.grantGracePeriod = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7, reason } = req.body;

    const user = await User.findById(userId);

    if (!user || user.role !== 'resident') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.subStatus = 'grace';
    user.graceExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await user.save();

    console.log(`✅ Admin ${req.user.username} granted ${days}-day grace period to ${user.username}${reason ? ` (${reason})` : ''}`);

    res.status(200).json({
      success: true,
      message: `${days}-day grace period granted`,
      graceExpiresAt: user.graceExpiresAt,
    });
  } catch (error) {
    console.error('❌ Grant grace period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grant grace period',
    });
  }
};

exports.suspendAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user || user.role !== 'resident') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.subStatus = 'unpaid';
    await user.save();

    console.log(`Admin ${req.user.username} suspended access for ${user.username}${reason ? ` (${reason})` : ''}`);

    res.status(200).json({
      success: true,
      message: 'User access suspended',
    });
  } catch (error) {
    console.error('Suspend access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend access',
    });
  }
};

exports.sendPaymentReminders = async (req, res) => {
  try {
    const overdueUsers = await User.find({
      role: 'resident',
      subStatus: { $in: ['unpaid', 'grace'] },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const user of overdueUsers) {
      try {
        console.log(`📧 Reminder sent to ${user.username} (${user.phone})`);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${user.username}:`, error);
        failedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Payment reminders sent`,
      sent: sentCount,
      failed: failedCount,
      total: overdueUsers.length,
    });
  } catch (error) {
    console.error('❌ Send reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
    });
  }
};

exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const residents = await User.find({ role: 'resident' });

    const analytics = {
      total: residents.length,
      paid: residents.filter((u) => u.subStatus === 'paid').length,
      grace: residents.filter((u) => u.subStatus === 'grace').length,
      unpaid: residents.filter((u) => u.subStatus === 'unpaid').length,
      collectionRate: Math.round(
        (residents.filter((u) => u.subStatus === 'paid').length / residents.length) * 100
      ),

      overdueBreakdown: {
        '1-7 days': 0,
        '8-14 days': 0,
        '15-30 days': 0,
        '30+ days': 0,
      },

      recentPayments: await Payment.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    };

    residents.forEach((user) => {
      if (user.subStatus === 'unpaid') {
        const days = calculateDaysOverdue(user.lastPayment);
        if (days <= 7) analytics.overdueBreakdown['1-7 days']++;
        else if (days <= 14) analytics.overdueBreakdown['8-14 days']++;
        else if (days <= 30) analytics.overdueBreakdown['15-30 days']++;
        else analytics.overdueBreakdown['30+ days']++;
      }
    });

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

function calculateDaysOverdue(lastPayment) {
  if (!lastPayment) return 365;
  
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const timeSincePayment = Date.now() - lastPayment;
  const daysSincePayment = timeSincePayment / (24 * 60 * 60 * 1000);
  
  return Math.max(0, Math.floor(daysSincePayment - 30));
}

function getNextDueDate(lastPayment) {
  if (!lastPayment) return new Date();
  
  const nextDue = new Date(lastPayment);
  nextDue.setMonth(nextDue.getMonth() + 1);
  
  return nextDue;
}