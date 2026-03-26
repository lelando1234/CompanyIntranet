const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// GET all departments
router.get('/', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const departments = await query(
      'SELECT * FROM signature_departments ORDER BY name ASC'
    );
    res.json({ success: true, data: departments });
  } catch (err) {
    console.error('GET /signature-departments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// POST create department
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Department name is required' });

  try {
    const id = uuidv4();
    await query(
      'INSERT INTO signature_departments (id, name, created_by) VALUES (?, ?, ?)',
      [id, name.trim(), req.user.id]
    );
    await logAudit(req.user.id, 'CREATE_SIGNATURE_DEPARTMENT', 'signature_departments', id, { name });
    const [created] = await query('SELECT * FROM signature_departments WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('POST /signature-departments error:', err);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
});

// PUT update department
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Department name is required' });

  try {
    const [existing] = await query('SELECT id FROM signature_departments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Department not found' });

    await query('UPDATE signature_departments SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    await logAudit(req.user.id, 'UPDATE_SIGNATURE_DEPARTMENT', 'signature_departments', req.params.id, { name });
    const [updated] = await query('SELECT * FROM signature_departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
});

// DELETE department
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [existing] = await query('SELECT id, name FROM signature_departments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Department not found' });

    await query('DELETE FROM signature_departments WHERE id = ?', [req.params.id]);
    await logAudit(req.user.id, 'DELETE_SIGNATURE_DEPARTMENT', 'signature_departments', req.params.id, { name: existing.name });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

module.exports = router;
