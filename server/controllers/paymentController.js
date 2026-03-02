const Payment = require('../models/Payments');
const User = require('../models/User');
const Project = require('../models/Projects');
const mpesaService = require('../services/mpesaService');

exports.initiateMpesaPayment = async (req, res) => {
  try {
    const {
      phone,
      amount,
      payment_type,
      project_id,
    } = req.body;

    const user_id = req.user._id;

    // Validation
    if (!phone || !amount || !payment_type) {
      return res.status(400).json({
        success: false,
        message: 'Phone, amount, and payment type are required',
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least KES 1',
      });
    }

    if (payment_type === 'capex' && !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID required for CapEx payments',
      });
    }

    // Validate project if CapEx
    let project = null;
    if (payment_type === 'capex') {
      project = await Project.findById(project_id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }
    }

    const MONTHLY_SUBSCRIPTION = 5000;
    const is_partial = payment_type === 'subscription' && amount < MONTHLY_SUBSCRIPTION;

    // ✅ Create pending payment WITHOUT subscription_balance
    const payment = await Payment.create({
      user_id,
      payment_type: is_partial ? 'partial_subscription' : payment_type,
      project_id: payment_type === 'capex' ? project_id : undefined,
      amount: parseInt(amount),
      payment_method: 'mpesa',
      mpesa_phone: phone,
      status: 'pending',
      is_partial,
    });

    // Initiate STK Push
    const accountReference = payment_type === 'capex' 
      ? `CAPEX-${project?.projectName?.substring(0, 10) || 'PROJECT'}`
      : `SUB-${req.user.username}`;

    const transactionDesc = payment_type === 'capex'
      ? `CapEx: ${project?.projectName}`
      : 'Monthly Subscription';

    const stkResponse = await mpesaService.initiateSTKPush({
      phone,
      amount: parseInt(amount),
      accountReference,
      transactionDesc,
    });

    // Save M-Pesa details
    payment.checkoutRequestID = stkResponse.checkoutRequestID;
    payment.merchantRequestID = stkResponse.merchantRequestID;
    await payment.save();

    console.log(`📱 STK Push sent to ${phone} for KES ${amount}`);

    res.status(200).json({
      success: true,
      message: stkResponse.customerMessage || 'Check your phone for M-Pesa prompt',
      payment: {
        _id: payment._id,
        checkoutRequestID: stkResponse.checkoutRequestID,
        amount: payment.amount,
        is_partial: payment.is_partial,
      },
    });
  } catch (error) {
    console.error('❌ Initiate M-Pesa payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

// M-PESA CALLBACK

exports.mpesaCallback = async (req, res) => {
  try {
    console.log('📨 M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.error('❌ Invalid callback format');
      return res.status(400).json({ success: false, message: 'Invalid callback' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find payment by CheckoutRequestID
    const payment = await Payment.findOne({ 
      checkoutRequestID: CheckoutRequestID 
    });

    if (!payment) {
      console.error('❌ Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // ✅ SUCCESS (ResultCode === 0)
    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      
      const mpesaReceipt = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      const amountPaid = metadata.find(item => item.Name === 'Amount')?.Value;

      // Update payment to verified
      payment.status = 'verified';
      payment.mpesa_receipt = mpesaReceipt;
      payment.transaction_id = mpesaReceipt;
      payment.mpesa_phone = phoneNumber;
      payment.verified_at = new Date();
      await payment.save();

      console.log(`✅ Payment successful: ${mpesaReceipt} - KES ${payment.amount}`);

      // Update subscription or project
      if (payment.payment_type === 'subscription' || payment.payment_type === 'partial_subscription') {
        await updateUserSubscription(payment.user_id, payment.amount);
      } else if (payment.payment_type === 'capex') {
        await updateProjectContribution(payment.project_id, payment.user_id, payment.amount);
      }

      // Send socket notification (if you have socket.io)
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${payment.user_id}`).emit('payment-success', {
          payment,
          message: 'Payment received successfully!',
        });
      }

    } else {
      //FAILURE (User cancelled, insufficient funds, timeout, etc.)
      payment.status = 'failed';
      payment.rejection_reason = ResultDesc; // Store the reason
      await payment.save();

      console.log(`Payment failed: ${ResultDesc}`);

      // Send socket notification for failure
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${payment.user_id}`).emit('payment-failed', {
          payment,
          reason: ResultDesc,
          message: 'Payment was not completed',
        });
      }

      // Common M-Pesa failure codes:
      // 1 - Insufficient funds
      // 17 - User cancelled
      // 26 - Request timed out
      // 2001 - Wrong PIN
      console.log(`📊 ResultCode: ${ResultCode} | Reason: ${ResultDesc}`);
    }

    // Always respond with 200 to M-Pesa
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    });
  }
};

// CHECK M-PESA PAYMENT STATUS (Polling)
exports.checkMpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const payment = await Payment.findOne({ checkoutRequestID })
      .populate('project_id', 'projectName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // ✅ Just return current database status (don't query M-Pesa API)
    res.status(200).json({
      success: true,
      payment: {
        status: payment.status,
        mpesa_receipt: payment.mpesa_receipt,
        amount: payment.amount,
        rejection_reason: payment.rejection_reason,
      },
    });
  } catch (error) {
    console.error('❌ Check status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
    });
  }
};

// BANK PAYMENT WITH SLIP UPLOAD

exports.createBankPayment = async (req, res) => {
  try {
    const {
      amount,
      payment_type,
      project_id,
      bank_name,
      reference_number,
      deposit_date,
      notes,
    } = req.body;

    const user_id = req.user._id;

    if (!amount || !bank_name || !reference_number) {
      return res.status(400).json({
        success: false,
        message: 'Amount, bank name, and reference number required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bank slip photo is required',
      });
    }

    const MONTHLY_SUBSCRIPTION = 5000;
    const is_partial = payment_type === 'subscription' && amount < MONTHLY_SUBSCRIPTION;

    const payment = await Payment.create({
      user_id,
      payment_type: is_partial ? 'partial_subscription' : payment_type,
      project_id: payment_type === 'capex' ? project_id : undefined,
      amount: parseInt(amount),
      payment_method: 'bank',
      bank_details: {
        bank_name,
        reference_number,
        deposit_date: deposit_date || new Date(),
      },
      bank_slip_photo: req.file.path, // Cloudinary URL
      notes,
      status: 'pending', // Awaiting admin verification
      is_partial,
      subscription_balance: is_partial ? MONTHLY_SUBSCRIPTION - amount : 0,
    });

    console.log(`📄 Bank payment submitted: KES ${amount} - Ref: ${reference_number}`);

    res.status(201).json({
      success: true,
      message: 'Payment submitted for verification. You\'ll be notified once approved.',
      payment: {
        _id: payment._id,
        amount: payment.amount,
        status: payment.status,
        is_partial: payment.is_partial,
      },
    });
  } catch (error) {
    console.error('❌ Bank payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bank payment',
    });
  }
};

// GET USER PAYMENTS

exports.getMyPayments = async (req, res) => {
  try {
    const { type, status } = req.query;

    const filter = { user_id: req.user._id };
    if (type) filter.payment_type = type;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('project_id', 'projectName targetAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('❌ Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
};

// GET PAYMENT SUMMARY
exports.getPaymentSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // ✅ Only count VERIFIED payments
    const verifiedPayments = await Payment.find({
      user_id: req.user._id,
      status: 'verified', // ✅ Only verified
    });

    const MONTHLY_SUBSCRIPTION = 5000;
    const subscriptionPayments = verifiedPayments.filter(
      p => p.payment_type === 'subscription' || p.payment_type === 'partial_subscription'
    );
    
    const totalPaidForSubscription = subscriptionPayments.reduce((sum, p) => sum + p.amount, 0);
    const subscriptionBalance = Math.max(0, MONTHLY_SUBSCRIPTION - totalPaidForSubscription);

    const capexContributions = verifiedPayments.filter(p => p.payment_type === 'capex');
    const totalCapexContributed = capexContributions.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        subscription: {
          monthly_fee: MONTHLY_SUBSCRIPTION,
          total_paid: totalPaidForSubscription,
          balance: subscriptionBalance, // ✅ Calculated from verified payments only
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

// HELPER FUNCTIONS
async function updateUserSubscription(userId, amount) {
  const user = await User.findById(userId);
  
  const MONTHLY_SUBSCRIPTION = 5000;
  
  // Get all VERIFIED payments
  const allPayments = await Payment.find({
    user_id: userId,
    payment_type: { $in: ['subscription', 'partial_subscription'] },
    status: 'verified', // ✅ Only count verified payments
  });

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = MONTHLY_SUBSCRIPTION - totalPaid;

  if (totalPaid >= MONTHLY_SUBSCRIPTION) {
    user.subStatus = 'paid';
    user.lastPayment = new Date();
    await user.save();
    console.log(`✅ ${user.username} subscription → PAID (KES ${totalPaid})`);
  } else {
    console.log(`⏳ ${user.username} partial payment (KES ${totalPaid}/${MONTHLY_SUBSCRIPTION}), Balance: KES ${balance}`);
  }
  
  return {
    totalPaid,
    balance,
    isPaid: totalPaid >= MONTHLY_SUBSCRIPTION,
  };
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
  console.log(`✅ CapEx: KES ${amount} → ${project.projectName}`);
}

// ADMIN: GET ALL PENDING PAYMENTS
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
    console.error('❌ Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
    });
  }
};

// ADMIN: VERIFY/REJECT PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "verified" or "rejected"',
      });
    }

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
      payment.rejection_reason = rejection_reason || 'No reason provided';
    }

    await payment.save();

    // If verified, update subscription/project
    if (status === 'verified') {
      if (payment.payment_type === 'subscription' || payment.payment_type === 'partial_subscription') {
        await updateUserSubscription(payment.user_id._id, payment.amount);
      } else if (payment.payment_type === 'capex') {
        await updateProjectContribution(payment.project_id._id, payment.user_id._id, payment.amount);
      }
    }

    console.log(`Payment ${payment._id} ${status} by admin ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: `Payment ${status}`,
      payment,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
};

module.exports = {
  initiateMpesaPayment: exports.initiateMpesaPayment,
  mpesaCallback: exports.mpesaCallback,
  checkMpesaStatus: exports.checkMpesaStatus,
  createBankPayment: exports.createBankPayment,
  getMyPayments: exports.getMyPayments,
  getPaymentSummary: exports.getPaymentSummary,
  getPendingPayments: exports.getPendingPayments,
  verifyPayment: exports.verifyPayment,
};