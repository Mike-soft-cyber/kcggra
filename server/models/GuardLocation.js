const mongoose = require('mongoose');

const guardLocationSchema = new mongoose.Schema({
  guard_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  zone: {
    type: String,
  },
  status: {
    type: String,
    enum: ['on_patrol', 'at_gate', 'break', 'emergency_response'],
    default: 'on_patrol',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});


guardLocationSchema.index({ location: '2dsphere' });
guardLocationSchema.index({ guard_id: 1, timestamp: -1 });
guardLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('GuardLocation', guardLocationSchema);