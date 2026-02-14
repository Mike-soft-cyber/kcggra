const discussController = require('../controllers/discussController')
const express = require('express');
const router = express.Router();

router.post('/', discussController.createDiscussion)
router.post('/:id/reply', discussController.postReply)
router.get('/', discussController.getAllDiscussions)

module.exports = router;