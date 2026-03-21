const cron = require('node-cron');
const User = require('../models/User');
const { sendOTP } = require('./smsService');
const moment = require('moment');

const monthlySubscriptionReminder = cron.schedule(
  '0 9 1 * *',
  async () => {
    try {
      console.log('📅 Running monthly subscription reminder...');

      const currentMonth = moment().format('MMM-YYYY').toUpperCase();

      const unpaidUsers = await User.find({
        isActive: true,
        subStatus: 'unpaid',
        role: { $in: ['resident'] },
      });

      console.log(`📧 Sending reminders to ${unpaidUsers.length} users...`);

      for (const user of unpaidUsers) {
        try {
          const message = `Hi ${user.username}, your KCGGRA subscription for ${currentMonth} is due (KES ${process.env.MONTHLY_SUBSCRIPTION_AMOUNT}). Pay now: ${process.env.FRONTEND_URL}/payments or dial *384*1234#`;

          await sendOTP(`+${user.phone}`, message);
          console.log(`Reminder sent to ${user.phone}`);
        } catch (error) {
          console.error(`Failed to send to ${user.phone}:`, error.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log('Monthly reminders sent successfully');
    } catch (error) {
      console.error('Monthly reminder cron error:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Africa/Nairobi',
  }
);

const resetSubscriptionStatus = cron.schedule(
  '1 0 1 * *',
  async () => {
    try {
      console.log('🔄 Resetting subscription statuses...');

      const result = await User.updateMany(
        { role: { $in: ['resident'] } },
        { $set: { subStatus: 'unpaid' } }
      );

      console.log(`Reset ${result.modifiedCount} subscription statuses`);
    } catch (error) {
      console.error('Reset subscription cron error:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Africa/Nairobi',
  }
);

const paymentDeadlineWarning = cron.schedule(
  '0 14 25 * *',
  async () => {
    try {
      console.log('⚠️ Sending payment deadline warnings...');

      const unpaidUsers = await User.find({
        isActive: true,
        subStatus: 'unpaid',
        role: { $in: ['resident'] },
      });

      for (const user of unpaidUsers) {
        try {
          const message = `REMINDER: Your KCGGRA subscription is due in 5 days. Please pay KES ${process.env.MONTHLY_SUBSCRIPTION_AMOUNT} to avoid service interruption. Pay: ${process.env.FRONTEND_URL}/payments`;

          await sendOTP(`+${user.phone}`, message);
          console.log(`Warning sent to ${user.phone}`);
        } catch (error) {
          console.error(`Failed to send warning to ${user.phone}:`, error.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log('Deadline warnings sent');
    } catch (error) {
      console.error('Deadline warning cron error:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Africa/Nairobi',
  }
);

exports.startCronJobs = () => {
  console.log('Starting cron jobs...');
  monthlySubscriptionReminder.start();
  resetSubscriptionStatus.start();
  paymentDeadlineWarning.start();
  console.log('Cron jobs started');
};

exports.stopCronJobs = () => {
  monthlySubscriptionReminder.stop();
  resetSubscriptionStatus.stop();
  paymentDeadlineWarning.stop();
  console.log('⏹️ Cron jobs stopped');
};