const User = require('../models/User');
const Payment = require('../models/Payments');
const Projects = require('../models/Projects');
const Incident = require('../models/Incident');

exports.getDashboardStats = async (req, res) => {
  try {
    // Total residents
    const totalResidents = await User.countDocuments({ role: { $in: ['owner', 'resident'] } });

    // Paid vs unpaid count
    const paidCount = await User.countDocuments({ subStatus: 'paid' });
    const unpaidCount = await User.countDocuments({ subStatus: 'unpaid' });
    
    // Collection rate
    const collectionRate = totalResidents > 0 
      ? Math.round((paidCount / totalResidents) * 100) 
      : 0;

    // Overdue accounts (unpaid)
    const overdueAccounts = unpaidCount;

    // Monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyRevenue = monthlyPayments[0]?.total || 0;

    return res.status(200).json({
      success: true,
      totalResidents,
      paidCount,
      unpaidCount,
      collectionRate,
      overdueAccounts,
      monthlyRevenue,
      totalAmount: paidCount * 60000, // Assuming 60K per subscription
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
};

exports.getPaymentTrend = async (req, res) => {
  try {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Generate chart data (you can replace with real aggregation)
    const trend = [
      { month: 'Sep', collected: 320000, target: 400000 },
      { month: 'Oct', collected: 380000, target: 400000 },
      { month: 'Nov', collected: 400000, target: 400000 },
      { month: 'Dec', collected: 200000, target: 400000 },
      { month: 'Jan', collected: 360000, target: 400000 },
      { month: 'Feb', collected: 340000, target: 400000 },
    ];

    return res.status(200).json({
      success: true,
      trend,
    });
  } catch (error) {
    console.error('Get payment trend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment trend',
    });
  }
};

exports.getAttentionNeeded = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['owner', 'resident'] },
      subStatus: { $in: ['unpaid', 'grace'] },
    })
      .select('username street subStatus phone email')
      .limit(10)
      .sort({ subStatus: -1 }); // unpaid first

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get attention needed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attention list',
    });
  }
};

exports.getAllResidents = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = { role: { $in: ['owner', 'resident'] } };

    if (status && status !== 'all') {
      query.subStatus = status;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { street: { $regex: search, $options: 'i' } },
      ];
    }

    const residents = await User.find(query)
      .select('username email phone street subStatus lastPayment createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      residents,
      total: residents.length,
    });
  } catch (error) {
    console.error('Get all residents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch residents',
    });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const { filter } = req.query;

    let query = { role: { $in: ['owner', 'resident'] } };

    if (filter === 'paid') query.subStatus = 'paid';
    if (filter === 'overdue') query.subStatus = 'unpaid';
    if (filter === 'pending') query.subStatus = 'grace';

    const subscriptions = await User.find(query)
      .select('username email street subStatus lastPayment phone')
      .sort({ subStatus: 1, lastPayment: -1 });

    // Calculate amounts paid
    const subscriptionsWithAmounts = await Promise.all(
      subscriptions.map(async (sub) => {
        const payments = await Payment.find({
          user_id: sub._id,
          payment_type: 'subscription',
          status: 'completed',
        });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          ...sub.toObject(),
          paidAmount: totalPaid,
          dueAmount: 60000, // Annual subscription
          house: sub.street?.split(',')[0] || 'N/A',
        };
      })
    );

    return res.status(200).json({
      success: true,
      subscriptions: subscriptionsWithAmounts,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
    });
  }
};

exports.getCapExProjects = async (req, res) => {
  try {
    const projects = await Projects.find()
      .populate('contributors.user_id', 'username')
      .sort({ createdAt: -1 });

    const totalRaised = projects.reduce((sum, p) => sum + (p.currentAmount || 0), 0);
    const totalTarget = projects.reduce((sum, p) => sum + p.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalRaised / totalTarget) * 100) : 0;

    return res.status(200).json({
      success: true,
      projects,
      stats: {
        totalRaised,
        totalTarget,
        overallProgress,
      },
    });
  } catch (error) {
    console.error('Get CapEx projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subStatus } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { subStatus, lastPayment: subStatus === 'paid' ? new Date() : undefined },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription status updated',
      user,
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
    });
  }
};