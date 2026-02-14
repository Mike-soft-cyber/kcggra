const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['street', 'committee', 'interest', 'general'],
    default: 'street',
  },
  street_name: {
    type: String,
  },
  members: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member',
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Group', groupSchema);