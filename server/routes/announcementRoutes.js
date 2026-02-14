const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.get('/unread/count', announcementController.getUnreadCount);
router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post(
  '/',
  authorize('admin'),
  upload.array('attachments', 3),
  announcementController.createAnnouncement
);

router.patch(
  '/:id',
  authorize('admin'),
  announcementController.updateAnnouncement
);

router.delete(
  '/:id',
  authorize('admin'),
  announcementController.deleteAnnouncement
);

module.exports = router;