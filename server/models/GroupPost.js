const mongoose = require('mongoose');

const groupPostSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [{
    type: String,
  }],
  comments: [{
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
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

groupPostSchema.index({ group_id: 1, createdAt: -1 });

module.exports = mongoose.model('GroupPost', groupPostSchema);