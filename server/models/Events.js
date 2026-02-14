const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true},
    description: { type: String},
    date: { type: Date, required: true},
    time: { type: String},
    location: { type: String, required: true},
    created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendees: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['attending', 'maybe', 'declined'],
      default: 'attending',
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
  }],
  event_type: {
    type: String,
    enum: ['meeting', 'social', 'maintenance', 'emergency', 'other'],
    default: 'meeting',
  },
  max_attendees: {
    type: Number,
  },
  is_active: {
    type: Boolean,
    default: true,
  },    
}, {timestamps: true})

eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema)