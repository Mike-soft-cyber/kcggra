const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['security', 'event', 'alert', 'maintenance', 'general'],
    required: true,
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  is_pinned: {
    type: Boolean,
    default: false,
  },
  attachments: [{
    type: String,
  }],
  views: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewed_at: {
      type: Date,
      default: Date.now,
    },
  }],
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);