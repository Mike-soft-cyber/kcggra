const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroup);
router.post('/:id/join', groupController.joinGroup);
router.post('/:id/leave', groupController.leaveGroup);
router.post(
  '/:id/posts',
  upload.array('attachments', 5),
  groupController.createPost
);
router.get('/:id/posts', groupController.getGroupPosts);
router.post('/posts/:post_id/comment', groupController.addComment);
router.post('/posts/:post_id/like', groupController.likePost);

module.exports = router;