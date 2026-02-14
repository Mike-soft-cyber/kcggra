const User = require('../models/User');
const Incident = require('../models/Incident');
const Payment = require('../models/Payments');
const { stkPush } = require('../services/mpesaService');
const { sendIncidentAlert } = require('../services/smsService');

exports.handleUSSD = async (req, res) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    console.log('📱 USSD Request:', { sessionId, phoneNumber, text });

    let response = '';
    const formattedPhone = phoneNumber.replace(/^\+/, '').replace(/^0/, '254');
    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      response = `END You are not registered in KCGGRA Portal. Please register via: ${process.env.FRONTEND_URL}`;
      return res.set('Content-Type', 'text/plain').send(response);
    }

    const textArray = text ? text.split('*') : [];
    const level = textArray.length;

    if (text === '') {
      response = `CON Welcome to KCGGRA, ${user.username}
      1. Report Emergency
      2. Check Subscription
      3. Pay Subscription
      4. Contact Admin
      5. My Visitors`;
    }

    else if (text === '1') {
      response = `CON Select emergency type:
      1. Burglary/Break-in
      2. Fire
      3. Medical Emergency
      4. Suspicious Activity
      5. Environmental Issue`;
    }

    else if (text.startsWith('1*')) {
      const emergencyType = textArray[1];
      const types = {
        '1': 'burglary',
        '2': 'fire',
        '3': 'medical',
        '4': 'suspicious_activity',
        '5': 'environmental',
      };

      const incidentType = types[emergencyType];

      if (incidentType) {
        // Create incident without GPS (use user's property address)
        const incident = await Incident.create({
          reporter_id: user._id,
          type: incidentType,
          description: `Emergency reported via USSD - ${incidentType}`,
          location: {
            type: 'Point',
            coordinates: [36.8219, -1.2921],
            address: user.street,
          },
          status: 'reported',
        });

        // Alert A-Team
        const guards = await User.find({ role: 'guard', isActive: true });
        const guardPhones = guards.map(g => `+${g.phone}`);

        if (guardPhones.length > 0) {
          await sendIncidentAlert(guardPhones, {
            type: incidentType,
            address: user.street,
            _id: incident._id,
          });
        }

        // Emit Socket.io event
        const io = req.app.get('io');
        io.to('guards').emit('new-incident', { incident });

        response = `END Emergency reported successfully!
Type: ${incidentType.toUpperCase()}
Location: ${user.street}

A-Team has been notified and will respond shortly.`;
      } else {
        response = 'END Invalid selection. Please try again.';
      }
    }

    // Check Subscription
    else if (text === '2') {
      const statusText = user.subStatus === 'paid' ? 'PAID ✓' : 'UNPAID ✗';
      const lastPayment = user.lastPayment
        ? new Date(user.lastPayment).toLocaleDateString()
        : 'Never';

      response = `END Subscription Status: ${statusText}
Last Payment: ${lastPayment}
Amount: KES ${process.env.MONTHLY_SUBSCRIPTION_AMOUNT}

${user.subStatus === 'unpaid' ? 'Please pay to continue services.' : 'Thank you for your payment!'}`;
    }

    // Pay Subscription
    else if (text === '3') {
      if (user.subStatus === 'paid') {
        response = `END You have already paid for this month.
Last payment: ${new Date(user.lastPayment).toLocaleDateString()}

Thank you!`;
      } else {
        response = `CON Confirm payment of KES ${process.env.MONTHLY_SUBSCRIPTION_AMOUNT}
1. Yes, send M-Pesa prompt
2. Cancel`;
      }
    }

    else if (text === '3*1') {
      // Initiate M-Pesa STK Push
      try {
        const amount = parseInt(process.env.MONTHLY_SUBSCRIPTION_AMOUNT);
        const payment = await Payment.create({
          user_id: user._id,
          amount,
          payment_type: 'subscription',
          month_year: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
          payment_method: 'mpesa',
          mpesa_phone: formattedPhone,
          status: 'pending',
          transaction_id: `PENDING-${Date.now()}`,
        });

        const stkResponse = await stkPush({
          phone: formattedPhone,
          amount,
          accountReference: 'KCGGRA-SUB',
          transactionDesc: 'KCGGRA Monthly Subscription',
        });

        payment.transaction_id = stkResponse.checkoutRequestID;
        await payment.save();

        response = `END M-Pesa payment request sent to ${phoneNumber}.
Amount: KES ${amount}

Enter your M-Pesa PIN to complete payment.`;
      } catch (error) {
        console.error('❌ USSD M-Pesa error:', error);
        response = `END Failed to initiate payment. Please try again later or pay via the portal: ${process.env.FRONTEND_URL}/payments`;
      }
    }

    else if (text === '3*2') {
      response = 'END Payment cancelled.';
    }

    // Contact Admin
    else if (text === '4') {
      response = `END KCGGRA Contact Information:

Portal: ${process.env.FRONTEND_URL}
Email: admin@kcggra.or.ke
Emergency: 999

For non-urgent matters, please visit the portal.`;
    }

    // My Visitors (future feature)
    else if (text === '5') {
      response = `END Visitor management is available on the web portal:
${process.env.FRONTEND_URL}/dashboard/visitors

You can create visitor invites and QR codes there.`;
    }

    // Invalid selection
    else {
      response = 'END Invalid selection. Please dial again and choose a valid option.';
    }

    // Send response
    res.set('Content-Type', 'text/plain').send(response);
  } catch (error) {
    console.error('❌ USSD error:', error);
    res.set('Content-Type', 'text/plain').send('END Service temporarily unavailable. Please try again later.');
  }
};