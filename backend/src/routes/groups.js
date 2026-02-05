const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Get all groups
router.get('/', verifyToken, async (req, res) => {
  try {
    const groups = await query(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM user_groups WHERE group_id = g.id) as member_count
      FROM \`groups\` g
      ORDER BY g.name ASC
    `);

    // Get permissions for each group
    for (const group of groups) {
      const permissions = await query(
        'SELECT permission FROM group_permissions WHERE group_id = ?',
        [group.id]
      );
      group.permissions = permissions.map(p => p.permission);
    }

    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single group with members
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const groups = await query('SELECT * FROM `groups` WHERE id = ?', [req.params.id]);

    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = groups[0];

    // Get members
    const members = await query(`
      SELECT u.id, u.email, u.name, u.role, u.avatar, u.department
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      WHERE ug.group_id = ?
    `, [req.params.id]);

    // Get permissions
    const permissions = await query(
      'SELECT permission FROM group_permissions WHERE group_id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...group,
        members,
        permissions: permissions.map(p => p.permission)
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create group (admin only)
router.post('/', verifyToken, requireRole('admin'), [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, color, permissions = [], members = [] } = req.body;

    // Check if name exists
    const existing = await query('SELECT id FROM `groups` WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Group name already exists' });
    }

    const groupId = uuidv4();

    await query(`
      INSERT INTO \`groups\` (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `, [groupId, name, description || null, color || '#3B82F6']);

    // Add permissions
    for (const permission of permissions) {
      const permId = uuidv4();
      await query(
        'INSERT INTO group_permissions (id, group_id, permission) VALUES (?, ?, ?)',
        [permId, groupId, permission]
      );
    }

    // Add members
    for (const userId of members) {
      await query(
        'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)',
        [userId, groupId]
      );
    }

    // Log audit
    await logAudit(req.user.id, 'CREATE_GROUP', 'group', groupId, null, { name, permissions }, req);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { id: groupId, name }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update group (admin only)
router.put('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, color, permissions, members } = req.body;

    // Check if group exists
    const existing = await query('SELECT * FROM `groups` WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check name uniqueness
    if (name && name !== existing[0].name) {
      const nameExists = await query('SELECT id FROM `groups` WHERE name = ? AND id != ?', [name, id]);
      if (nameExists.length > 0) {
        return res.status(400).json({ success: false, message: 'Group name already exists' });
      }
    }

    // Update group
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (color) { updates.push('color = ?'); params.push(color); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      await query('DELETE FROM group_permissions WHERE group_id = ?', [id]);
      for (const permission of permissions) {
        const permId = uuidv4();
        await query(
          'INSERT INTO group_permissions (id, group_id, permission) VALUES (?, ?, ?)',
          [permId, id, permission]
        );
      }
    }

    // Update members if provided
    if (members !== undefined) {
      await query('DELETE FROM user_groups WHERE group_id = ?', [id]);
      for (const userId of members) {
        await query(
          'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)',
          [userId, id]
        );
      }
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_GROUP', 'group', id, existing[0], req.body, req);

    res.json({ success: true, message: 'Group updated successfully' });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete group (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM `groups` WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await query('DELETE FROM `groups` WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_GROUP', 'group', id, existing[0], null, req);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add member to group
router.post('/:id/members', verifyToken, requireRole('admin'), [
  body('userId').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Check if already member
    const existing = await query(
      'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    await query('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [userId, id]);

    res.json({ success: true, message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove member from group
router.delete('/:id/members/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id, userId } = req.params;

    await query('DELETE FROM user_groups WHERE user_id = ? AND group_id = ?', [userId, id]);

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
