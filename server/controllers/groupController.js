const Group = require('../models/Group');
const GroupPost = require('../models/GroupPost');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, street_name } = req.body;
    const created_by = req.user._id;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'A group with this name already exists',
      });
    }

    const group = await Group.create({
      name,
      description,
      type: type || 'street',
      street_name,
      created_by,
      members: [{
        user_id: created_by,
        role: 'admin',
        joined_at: new Date(),
      }],
    });

    await group.populate('created_by', 'username');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message,
    });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { is_active: true };
    if (type) filter.type = type;

    const groups = await Group.find(filter)
      .populate('created_by', 'username')
      .populate('members.user_id', 'username profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
    });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('created_by', 'username profilePic')
      .populate('members.user_id', 'username profilePic street');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
    });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const isMember = group.members.some(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group',
      });
    }

    group.members.push({
      user_id: req.user._id,
      role: 'member',
      joined_at: new Date(),
    });

    await group.save();
    await group.populate('members.user_id', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Successfully joined group',
      group,
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
    });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    group.members = group.members.filter(
      (member) => member.user_id.toString() !== req.user._id.toString()
    );

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left group',
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group',
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const group_id = req.params.id;
    const author_id = req.user._id;

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const isMember = group.members.some(
      (member) => member.user_id.toString() === author_id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member to post in this group',
      });
    }

    const attachments = req.files ? req.files.map(file => file.path) : [];

    const post = await GroupPost.create({
      group_id,
      author_id,
      content,
      attachments,
    });

    await post.populate('author_id', 'username profilePic');

    const io = req.app.get('io');
    io.to(`group-${group_id}`).emit('new-post', {
      post,
      message: `${req.user.username} posted in ${group.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    });
  }
};

exports.getGroupPosts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const posts = await GroupPost.find({ group_id: req.params.id })
      .populate('author_id', 'username profilePic')
      .populate('comments.user_id', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await GroupPost.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.comments.push({
      user_id: req.user._id,
      content,
      created_at: new Date(),
    });

    await post.save();
    await post.populate('comments.user_id', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Comment added',
      post,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await GroupPost.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed' : 'Post liked',
      likes: post.likes.length,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
    });
  }
};