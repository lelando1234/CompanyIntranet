const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Get all users (admin/editor only)
router.get('/', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await query(`SELECT CAST(COUNT(*) AS SIGNED) as total FROM users WHERE ${whereClause}`, params);
    const total = Number(countResult[0].total);

    // Get users
    const users = await query(`
      SELECT id, email, name, role, avatar, department, phone, status, last_login, created_at, updated_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get groups for each user
    for (const user of users) {
      const groups = await query(`
        SELECT g.id, g.name, g.color
        FROM \`groups\` g
        JOIN user_groups ug ON g.id = ug.group_id
        WHERE ug.user_id = ?
      `, [user.id]);
      user.groups = groups;
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user
router.get('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const users = await query(`
      SELECT id, email, name, role, avatar, department, phone, status, last_login, created_at, updated_at
      FROM users WHERE id = ?
    `, [req.params.id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user groups
    const groups = await query(`
      SELECT g.id, g.name, g.color
      FROM \`groups\` g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      data: { ...users[0], groups }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user (admin only)
router.post('/', verifyToken, requireRole('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'editor', 'user'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name, role, department, phone, groups = [] } = req.body;

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    await query(`
      INSERT INTO users (id, email, password, name, role, department, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `, [userId, email, hashedPassword, name, role, department || null, phone || null]);

    // Add to groups
    for (const groupId of groups) {
      await query('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [userId, groupId]);
    }

    // Log audit
    await logAudit(req.user.id, 'CREATE_USER', 'user', userId, null, { email, name, role }, req);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: userId, email, name, role }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID(),
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().notEmpty().trim(),
  body('role').optional().isIn(['admin', 'editor', 'user'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { email, name, role, department, phone, status, groups, password } = req.body;

    // Get existing user
    const existing = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check email uniqueness if changing
    if (email && email !== existing[0].email) {
      const emailExists = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailExists.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (email) { updates.push('email = ?'); params.push(email); }
    if (name) { updates.push('name = ?'); params.push(name); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (department !== undefined) { updates.push('department = ?'); params.push(department); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update groups if provided
    if (groups !== undefined) {
      await query('DELETE FROM user_groups WHERE user_id = ?', [id]);
      for (const groupId of groups) {
        await query('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [id, groupId]);
      }
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_USER', 'user', id, existing[0], req.body, req);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Get user for audit
    const existing = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user (cascades to user_groups and sessions)
    await query('DELETE FROM users WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_USER', 'user', id, existing[0], null, req);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
