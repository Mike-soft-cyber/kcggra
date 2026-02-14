const Project = require('../models/Projects');

exports.createProject = async(req, res) => {
    try {
    const { projectName, targetAmount, description, target_completion_date } = req.body;
    
    const project = await Project.create({
      projectName,
      targetAmount,
      currentAmount: 0,
      description,
      target_completion_date,
      status: 'active',
    });
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getAllProjects = async(req, res) => {
    try {
    const projects = await Project.find({ is_active: true })
      .populate('contributors.user', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}