const User = require('../models/User');


exports.requireSubscription = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'admin' || user.role === 'guard') {
      return next();
    }

    if (user.role === 'resident') {
      if (user.subStatus === 'paid') {
        return next();
      }

      // Allow grace period (configurable)
      if (user.subStatus === 'grace') {
        return next();
      }

      if (user.subStatus === 'unpaid') {
        return res.status(403).json({
          success: false,
          message: 'Subscription payment required',
          reason: 'unpaid_subscription',
          redirectTo: '/dashboard/payments',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};

exports.warnSubscription = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'resident' && user.subStatus === 'unpaid') {
      // Add warning to response (can be shown in UI)
      req.subscriptionWarning = {
        message: 'Your subscription is overdue. Please make a payment to continue using all features.',
        daysOverdue: calculateDaysOverdue(user.lastPayment),
      };
    }

    next();
  } catch (error) {
    next();
  }
};


exports.requirePaidStatus = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'admin' || user.role === 'guard') {
      return next();
    }

    if (user.subStatus !== 'paid') {
      return res.status(403).json({
        success: false,
        message: 'This feature requires an active subscription',
        reason: 'premium_feature',
      });
    }

    next();
  } catch (error) {
    next();
  }
};

function calculateDaysOverdue(lastPayment) {
  if (!lastPayment) return 0;
  
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const daysSincePayment = (Date.now() - lastPayment) / (24 * 60 * 60 * 1000);
  
  return Math.max(0, Math.floor(daysSincePayment - 30));
}