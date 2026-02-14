const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'security', 'events', 'improvements', 'complaints'],
    default: 'general',
  },
  replies: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    created_at: {
      type: Date,
      default: Date.now,
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  is_pinned: {
    type: Boolean,
    default: false,
  },
  is_locked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Discussion', discussionSchema);