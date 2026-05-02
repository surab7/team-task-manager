const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

const getUserRole = (project, userId) => {
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// GET /api/tasks?project=:projectId
router.get('/', auth, async (req, res) => {
  try {
    const { project: projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId query param required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'inprogress', 'done'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (role !== 'admin') return res.status(403).json({ message: 'Only admins can create tasks' });

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      project: req.body.project,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.user._id,
      priority: req.body.priority || 'medium',
      status: req.body.status || 'todo',
      dueDate: req.body.dueDate || null
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const isAdmin = role === 'admin';
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Members can only update status
    if (!isAdmin) {
      if (req.body.status) task.status = req.body.status;
    } else {
      if (req.body.title) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.priority) task.priority = req.body.priority;
      if (req.body.status) task.status = req.body.status;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
      if (req.body.assignedTo !== undefined) task.assignedTo = req.body.assignedTo;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const role = getUserRole(project, req.user._id);
    if (role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
