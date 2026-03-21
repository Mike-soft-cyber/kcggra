const Discussion = require('../models/Discussion');

exports.createDiscussion = async(req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        const discussion = await Discussion.create({
            title,
            content,
            category: category || 'general',
            author_id: req.user._id,
        });

        await discussion.populate('author_id', 'username profilePic');

        res.status(201).json({ success: true, discussion });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.postReply = async(req, res) => {
    try {
        const { content } = req.body;
        
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ success: false, message: 'Discussion not found' });
        }
        
        discussion.replies.push({
            user_id: req.user._id,
            content,
        });
        
        await discussion.save();
        await discussion.populate('replies.user_id', 'username profilePic');
        
        res.json({ success: true, discussion });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getAllDiscussions = async(req, res) => {
    try {
        const discussions = await Discussion.find()
            .populate('author_id', 'username profilePic')
            .populate('replies.user_id', 'username profilePic')
            .sort({ is_pinned: -1, createdAt: -1 })
            .limit(50);
        
        res.json({ success: true, discussions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}