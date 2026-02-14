const projectController = require('../controllers/projectController')
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), projectController.createProject)
router.get('/', protect, projectController.getAllProjects)

module.exports = router;