const User = require('../models/User');

exports.requireSubscription = async (req, res, next) => {
  try {
    const user = req.user;

    // ✅ ALWAYS allow admins and guards (they don't pay subscriptions)
    if (user.role === 'admin' || user.role === 'guard') {
      return next();
    }

    // ✅ Check resident subscription status
    if (user.role === 'resident') {
      // Allow paid users
      if (user.subStatus === 'paid') {
        return next();
      }

      // Allow grace period (configurable)
      if (user.subStatus === 'grace') {
        return next();
      }

      // Block unpaid residents
      if (user.subStatus === 'unpaid') {
        return res.status(403).json({
          success: false,
          message: 'Subscription payment required',
          reason: 'unpaid_subscription',
          redirectTo: '/dashboard/payments',
        });
      }
    }

    // Default: allow
    next();
  } catch (error) {
    console.error('❌ Subscription check error:', error);
    next(); // Don't block on error
  }
};

exports.warnSubscription = async (req, res, next) => {
  try {
    const user = req.user;

    // Only warn residents (guards/admins exempt)
    if (user.role === 'resident' && user.subStatus === 'unpaid') {
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

    // Admins and guards always have access
    if (user.role === 'admin' || user.role === 'guard') {
      return next();
    }

    // Only fully paid residents
    if (user.role === 'resident' && user.subStatus !== 'paid') {
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

// Helper function
function calculateDaysOverdue(lastPayment) {
  if (!lastPayment) return 0;
  
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const daysSincePayment = (Date.now() - lastPayment) / (24 * 60 * 60 * 1000);
  
  return Math.max(0, Math.floor(daysSincePayment - 30));
}