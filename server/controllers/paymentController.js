const Payment = require('../models/Payments');
const User = require('../models/User');
const Project = require('../models/Projects');
const cloudinary = require('../config/cloudinary');

exports.createSubscriptionPayment = async (req, res) => {
  try {
    const {
      amount,
      payment_method,
      mpesa_receipt,
      mpesa_phone,
      bank_name,
      account_number,
      reference_number,
      deposit_date,
      notes,
    } = req.body;

    const user_id = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    const MONTHLY_SUBSCRIPTION = 5000;

    const is_partial = amount < MONTHLY_SUBSCRIPTION;
    const subscription_balance = Math.max(0, MONTHLY_SUBSCRIPTION - amount);

    const payment = await Payment.create({
      user_id,
      payment_type: is_partial ? 'partial_subscription' : 'subscription',
      amount,
      payment_method,
      mpesa_receipt,
      mpesa_phone,
      bank_details: bank_name ? {
        bank_name,
        account_number,
        reference_number,
        deposit_date: deposit_date || new Date(),
      } : undefined,
      is_partial,
      subscription_balance,
      notes,
      status: payment_method === 'mpesa' ? 'verified' : 'pending', 
    });

    // If bank slip photo provided
    if (req.file) {
      payment.bank_slip_photo = req.file.path;
      await payment.save();
    }

    // If M-Pesa or full payment, update user status immediately
    if (payment_method === 'mpesa' && !is_partial) {
      await updateUserSubscription(user_id, amount);
    }

    res.status(201).json({
      success: true,
      message: is_partial 
        ? `Partial payment of KES ${amount} received. Balance: KES ${subscription_balance}`
        : payment_method === 'bank'
        ? 'Payment submitted for verification. You\'ll be notified once approved.'
        : 'Payment successful!',
      payment: {
        _id: payment._id,
        amount: payment.amount,
        is_partial: payment.is_partial,
        subscription_balance: payment.subscription_balance,
        status: payment.status,
        payment_method: payment.payment_method,
      },
    });
  } catch (error) {
    console.error('❌ Create subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message,
    });
  }
};

exports.createCapExPayment = async (req, res) => {
  try {
    const {
      project_id,
      amount,
      payment_method,
      mpesa_receipt,
      mpesa_phone,
      bank_name,
      account_number,
      reference_number,
      deposit_date,
      notes,
    } = req.body;

    const user_id = req.user._id;

    // Validate project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user_id,
      payment_type: 'capex',
      project_id,
      amount,
      payment_method,
      mpesa_receipt,
      mpesa_phone,
      bank_details: bank_name ? {
        bank_name,
        account_number,
        reference_number,
        deposit_date: deposit_date || new Date(),
      } : undefined,
      notes,
      status: payment_method === 'mpesa' ? 'verified' : 'pending',
    });

    if (req.file) {
      payment.bank_slip_photo = req.file.path;
      await payment.save();
    }

    // If M-Pesa, update project immediately
    if (payment_method === 'mpesa') {
      await updateProjectContribution(project_id, user_id, amount);
    }

    res.status(201).json({
      success: true,
      message: payment_method === 'bank'
        ? 'Contribution submitted for verification'
        : 'Contribution successful!',
      payment: {
        _id: payment._id,
        project_name: project.projectName,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('❌ Create CapEx payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process contribution',
      error: error.message,
    });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const { type, status } = req.query;

    const filter = { user_id: req.user._id };
    if (type) filter.payment_type = type;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('project_id', 'projectName targetAmount')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = {
      total_paid: payments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0),
      pending_verification: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      subscription_balance: calculateSubscriptionBalance(req.user._id),
    };

    res.status(200).json({
      success: true,
      payments,
      totals,
    });
  } catch (error) {
    console.error('❌ Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
};

exports.getPaymentSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get all verified payments
    const verifiedPayments = await Payment.find({
      user_id: req.user._id,
      status: 'verified',
    });

    // Calculate subscription balance
    const MONTHLY_SUBSCRIPTION = 5000;
    const subscriptionPayments = verifiedPayments.filter(
      p => p.payment_type === 'subscription' || p.payment_type === 'partial_subscription'
    );
    
    const totalPaidForSubscription = subscriptionPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const subscriptionBalance = Math.max(0, MONTHLY_SUBSCRIPTION - totalPaidForSubscription);

    // CapEx contributions
    const capexContributions = verifiedPayments.filter(p => p.payment_type === 'capex');
    const totalCapexContributed = capexContributions.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        subscription: {
          monthly_fee: MONTHLY_SUBSCRIPTION,
          total_paid: totalPaidForSubscription,
          balance: subscriptionBalance,
          status: user.subStatus,
          last_payment: user.lastPayment,
        },
        capex: {
          total_contributed: totalCapexContributed,
          projects_count: [...new Set(capexContributions.map(p => p.project_id))].length,
        },
        overall: {
          total_paid: totalPaidForSubscription + totalCapexContributed,
          pending_verification: await Payment.countDocuments({
            user_id: req.user._id,
            status: 'pending',
          }),
        },
      },
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment summary',
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status, rejection_reason } = req.body;

    const payment = await Payment.findById(payment_id)
      .populate('user_id', 'username phone email')
      .populate('project_id', 'projectName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    payment.status = status;
    payment.verified_by = req.user._id;
    payment.verified_at = new Date();

    if (status === 'rejected') {
      payment.rejection_reason = rejection_reason;
    }

    await payment.save();

    // If verified, update user/project
    if (status === 'verified') {
      if (payment.payment_type === 'subscription' || payment.payment_type === 'partial_subscription') {
        await updateUserSubscription(payment.user_id._id, payment.amount);
      } else if (payment.payment_type === 'capex') {
        await updateProjectContribution(payment.project_id, payment.user_id._id, payment.amount);
      }
    }

    console.log(`✅ Payment ${payment._id} ${status} by admin ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: `Payment ${status}`,
      payment,
    });
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('user_id', 'username phone email street')
      .populate('project_id', 'projectName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
    });
  }
};

async function updateUserSubscription(userId, amount) {
  const user = await User.findById(userId);
  
  const MONTHLY_SUBSCRIPTION = 5000;
  
  // Get all verified subscription payments
  const allPayments = await Payment.find({
    user_id: userId,
    payment_type: { $in: ['subscription', 'partial_subscription'] },
    status: 'verified',
  });

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= MONTHLY_SUBSCRIPTION) {
    user.subStatus = 'paid';
    user.lastPayment = new Date();
    await user.save();
    console.log(`✅ ${user.username} subscription marked as PAID (total: KES ${totalPaid})`);
  } else {
    console.log(`⏳ ${user.username} partial payment (KES ${totalPaid}/${MONTHLY_SUBSCRIPTION})`);
  }
}

async function updateProjectContribution(projectId, userId, amount) {
  const project = await Project.findById(projectId);
  
  project.currentAmount += amount;
  
  const contributorIndex = project.contributors.findIndex(
    c => c.user_id.toString() === userId.toString()
  );

  if (contributorIndex >= 0) {
    project.contributors[contributorIndex].amount += amount;
  } else {
    project.contributors.push({
      user_id: userId,
      amount,
      date: new Date(),
    });
  }

  await project.save();
  console.log(`✅ CapEx contribution: KES ${amount} to ${project.projectName}`);
}

async function calculateSubscriptionBalance(userId) {
  const MONTHLY_SUBSCRIPTION = 5000;
  
  const payments = await Payment.find({
    user_id: userId,
    payment_type: { $in: ['subscription', 'partial_subscription'] },
    status: 'verified',
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, MONTHLY_SUBSCRIPTION - totalPaid);
}