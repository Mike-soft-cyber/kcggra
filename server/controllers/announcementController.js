const Announcement = require('../models/Announcement');
const User = require('../models/User');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, is_pinned } = req.body;
    const author_id = req.user._id;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required',
      });
    }

    const attachments = req.files ? req.files.map(file => file.path) : [];

    const announcement = await Announcement.create({
      title,
      content,
      category,
      author_id,
      priority: priority || 'medium',
      is_pinned: is_pinned || false,
      attachments,
    });

    await announcement.populate('author_id', 'username profilePic role');

    const io = req.app.get('io');
    io.to('residents').emit('new-announcement', {
      announcement,
      message: `New ${category} update: ${title}`,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;

    const filter = { is_active: true };
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const announcements = await Announcement.find(filter)
      .populate('author_id', 'username profilePic role')
      .sort({ is_pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    const unreadCount = await Announcement.countDocuments({
      is_active: true,
      'views.user_id': { $ne: req.user._id },
    });

    res.status(200).json({
      success: true,
      count: announcements.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      unreadCount,
      announcements,
    });
  } catch (error) {
    console.error('❌ Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
    });
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author_id', 'username profilePic role phone');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const alreadyViewed = announcement.views.some(
      view => view.user_id.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      announcement.views.push({
        user_id: req.user._id,
        viewed_at: new Date(),
      });
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('❌ Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, is_pinned, is_active } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (typeof is_pinned !== 'undefined') announcement.is_pinned = is_pinned;
    if (typeof is_active !== 'undefined') announcement.is_active = is_active;

    await announcement.save();
    await announcement.populate('author_id', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Announcement updated',
      announcement,
    });
  } catch (error) {
    console.error('❌ Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    announcement.is_active = false;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted',
    });
  } catch (error) {
    console.error('❌ Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Announcement.countDocuments({
      is_active: true,
      'views.user_id': { $ne: req.user._id },
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};