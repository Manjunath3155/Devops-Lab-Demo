const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { triggerBuildForTask, shouldTriggerPipeline } = require('../services/buildTrigger');

const router = express.Router();

// Get all tasks with filters
router.get('/', authenticateToken, (req, res) => {
  const { status, priority, assigned_to } = req.query;
  let query = `
    SELECT t.*, u.username as assigned_username
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }
  if (assigned_to) {
    query += ' AND t.assigned_to = ?';
    params.push(assigned_to);
  }

  query += ' ORDER BY t.created_at DESC';

  try {
    const tasks = db.prepare(query).all(...params);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', authenticateToken, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.username as assigned_username, c.username as creator_username
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ task });
});

// Create task
router.post('/', authenticateToken, (req, res) => {
  const { title, description, priority, status, assigned_to } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const taskStatus = status || 'todo';

  try {
    const stmt = db.prepare(
      'INSERT INTO tasks (title, description, priority, status, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      title,
      description || '',
      priority || 'medium',
      taskStatus,
      assigned_to || null,
      req.user.id
    );
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    let pipeline = null;
    if (shouldTriggerPipeline(null, task.status)) {
      pipeline = triggerBuildForTask(req.user.id, task);
    }

    res.status(201).json({ task, ...(pipeline && { pipeline }) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticateToken, (req, res) => {
  const { title, description, status, priority, assigned_to } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  try {
    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      status || null,
      priority || null,
      assigned_to !== undefined ? assigned_to : task.assigned_to,
      req.params.id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    let pipeline = null;
    if (shouldTriggerPipeline(task.status, updatedTask.status)) {
      pipeline = triggerBuildForTask(req.user.id, updatedTask);
    }

    res.json({ task: updatedTask, ...(pipeline && { pipeline }) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
