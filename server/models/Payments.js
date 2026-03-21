const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  payment_type: {
    type: String,
    enum: ['subscription', 'capex', 'partial_subscription'],
    required: true,
  },

  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },

  amount: {
    type: Number,
    required: true,
  },
  
  // Payment Method
  payment_method: {
    type: String,
    enum: ['mpesa', 'bank', 'cash'],
    required: true,
  },

  checkoutRequestID: { type: String },
  merchantRequestID: { type: String },

  mpesa_receipt: {
    type: String,
  },
  mpesa_phone: {
    type: String,
  },
  transaction_id: { type: String, unique: true, sparse: true },

  bank_details: {
    bank_name: String,
    account_number: String,
    reference_number: String,
    deposit_date: Date,
  },
  
  bank_slip_photo: {
    type: String,
  },

  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'rejected'],
    default: 'pending',
  },

  rejection_reason: { type: String },

  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who verified
  },
  verified_at: {
    type: Date,
  },
  rejection_reason: {
    type: String,
  },
  
  // Partial Payment Tracking
  is_partial: {
    type: Boolean,
    default: false,
  },
  subscription_balance: {
    type: Number,
    default: 0,
  },
  
  // Metadata
  notes: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ user_id: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payment_type: 1 });
paymentSchema.index({ transaction_id: 1 });

// Virtual for total paid by user
paymentSchema.virtual('total_paid').get(function() {
  return this.amount;
});

module.exports = mongoose.model('Payment', paymentSchema);