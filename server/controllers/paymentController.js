const Payment = require('../models/Payments')
const User = require('../models/User')
const Project = require('../models/Projects')
const { stkPush, stkQuery } = require('../services/mpesaService')
const { sendConfirmationPayment} = require('../services/smsService')
const moment = require('moment')

exports.initiateSubscription = async(req, res) => {
    try {
        const { phone, monthYear } = req.body
        const user = req.user

        const paymentPhone = phone || user.phone

        if(!paymentPhone){
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            })
        }

        const month_year = monthYear || moment().format('MMM-YYYY').toUpperCase()

        const existingPayment = await Payment.findOne({
            user: user._id,
            monthYear: month_year,
            type: 'subscription',
            status: 'completed'
        })

        if(existingPayment){
            return res.status(400).json({
                success: false,
                message: `You have already paid for ${monthYear}`
            })
        }

        const amount = parseInt(process.env.YEARLY_SUBSCRIPTION)

        const payment = await Payment.create({
            user: user._id,
            amount,
            type: 'subscription',
            monthYear: month_year,
            method: 'mpesa',
            phone: paymentPhone,
            status: 'pending',
            transaction_id: `PENDING-${Date.now()}`
        })

        const stkResponse = await stkPush({
            phone: paymentPhone,
            amount,
            accountReference: `SUB-${month_year}`,
            transactionDesc: `KCGGRA Subscription - ${month_year}`
        })

        payment.transaction_id = stkResponse.checkoutRequestID
        await payment.save()

        res.status(200).json({
            success: true,
            message: 'Payment request sent to phone',
            payment: {
                _id: payment._id,
                amount,
                monthYear: month_year,
                checkoutRequestID: stkResponse.checkoutRequestID
            }
        })
    } catch (error) {
        console.error('❌ Initiate subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate payment',
        });
    }
}

exports.donateProject = async(req, res) => {
    try {
        const {phone, amount, projectName} = req.body
        const user = req.user

        if(!amount || amount < 100){
            return res.status(400).json({
                success: false,
                message: 'Minimum donation is KES 100',
            });
        }

        const paymentPhone = phone || user.phone

        const payment = await Payment.create({
            user: user._id,
            amount,
            type: 'project_donation',
            method: 'mpesa',
            phone: paymentPhone,
            status: 'pending',
            transaction_id: `PENDING-${Date.now()}`
        })

        const stkResponse = await stkPush({
            phone: paymentPhone,
            amount,
            accountReference: projectName,
            transactionDesc: `Project Donation - ${projectName || 'General Fund'}`
        })

        payment.transaction_id = stkResponse.checkoutRequestID
        await payment.save()

        res.status(200).json({
             success: true,
             message: 'Donation request sent to your phone',
             payment: {
                _id: payment._id,
                amount,
                checkoutRequestID: stkResponse.checkoutRequestID,
            },
        })
    } catch (error) {
        console.error('CapEx donation error:', error)
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate donation',
        });
    }
}

exports.mpesaCallback = async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.error('Invalid callback format');
      return res.status(400).json({ success: false, message: 'Invalid callback' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    const payment = await Payment.findOne({ transaction_id: CheckoutRequestID });

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      
      const amountPaid = metadata.find((item) => item.Name === 'Amount')?.Value;
      const mpesaReceipt = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find((item) => item.Name === 'PhoneNumber')?.Value;

      payment.status = 'completed';
      payment.mpesa_receipt = mpesaReceipt;
      payment.transaction_id = mpesaReceipt;
      await payment.save();

      const user = await User.findById(payment.user_id);
      if (user) {
        user.subStatus = 'paid';
        user.lastPayment = new Date();
        await user.save();
      }

      if (payment.payment_type === 'project_donation') {
        let project = await Project.findOne({ status: 'active' });

        project.currentAmount += payment.amount;
        project.contributors.push({
          user: payment.user_id,
          amount: payment.amount,
          payment: payment._id,
          date: new Date(),
        });
        await project.save();

        console.log(`Project fund updated: +${payment.amount} KES (Total: ${project.current_amount})`);
      }

      try {
        await sendPaymentConfirmation(
          `+${phoneNumber}`,
          amountPaid,
          mpesaReceipt
        );
      } catch (smsError) {
        console.error('❌ Failed to send SMS confirmation:', smsError);
      }

      const io = req.app.get('io');
      io.to(`user-${payment.user_id}`).emit('payment-success', {
        payment,
        message: 'Payment received successfully!',
      });

      console.log(`Payment completed: ${mpesaReceipt} - KES ${amountPaid}`);
    } else {
      payment.status = 'failed';
      await payment.save();

      console.log(`Payment failed: ${ResultDesc}`);
    }

    res.status(200).json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ success: true, message: 'Callback received' });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, type, limit = 100 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate('user_id', 'username phone street')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const totalCompleted = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalAmount: totalCompleted[0]?.total || 0,
      payments,
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const payment = await Payment.findOne({ transaction_id: checkoutRequestID });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status === 'pending') {
      const queryResult = await stkQuery({ checkoutRequestID });
      
      if (queryResult.ResultCode === '0') {
        payment.status = 'completed';
        await payment.save();
      } else if (queryResult.ResultCode !== '1032') {
        payment.status = 'failed';
        await payment.save();
      }
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error(' Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
    });
  }
};

exports.getProjectProgress = async (req, res) => {
  try {
    const projectFund = await Project.findOne({ status: 'active' })
      .populate('contributors.user_id', 'username');

    if (!projectFund) {
      return res.status(404).json({
        success: false,
        message: 'No active Project fund found',
      });
    }

    const progressPercentage = ((projectFund.currentAmount / projectFund.targetAmount) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      projectFund: {
        ...projectFund.toObject(),
        progressPercentage,
      },
    });
  } catch (error) {
    console.error('Get Project progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Project progress',
    });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('contributors.user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
};