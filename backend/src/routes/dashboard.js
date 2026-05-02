const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard?project=:projectId
router.get('/', auth, async (req, res) => {
  try {
    const { project: projectId } = req.query;

    let projectFilter = {};
    let taskMatch = {};

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'Access denied' });
      taskMatch.project = project._id;
    } else {
      // All projects user belongs to
      const userProjects = await Project.find({ 'members.user': req.user._id }, '_id');
      const projectIds = userProjects.map(p => p._id);
      taskMatch.project = { $in: projectIds };
    }

    const tasks = await Task.find(taskMatch).populate('assignedTo', 'name email');

    const now = new Date();

    const stats = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        done: tasks.filter(t => t.status === 'done').length
      },
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      byUser: {}
    };

    // Tasks per user
    tasks.forEach(t => {
      if (t.assignedTo) {
        const uid = t.assignedTo._id.toString();
        if (!stats.byUser[uid]) {
          stats.byUser[uid] = { name: t.assignedTo.name, email: t.assignedTo.email, count: 0 };
        }
        stats.byUser[uid].count++;
      }
    });

    stats.byUser = Object.values(stats.byUser);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
