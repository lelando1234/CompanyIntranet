const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    // Find user
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is not active' });
    }

    // Generate token
    const expiresIn = rememberMe ? '7d' : JWT_EXPIRES_IN;
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 7 : 1));
    
    await query(`
      INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionId, user.id, token, req.ip, req.headers['user-agent'], expiresAt]);

    // Log audit
    await logAudit(user.id, 'LOGIN', 'user', user.id, null, { ip: req.ip }, req);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    // Remove session
    await query('DELETE FROM sessions WHERE token = ?', [token]);

    // Log audit
    await logAudit(req.user.id, 'LOGOUT', 'user', req.user.id, null, null, req);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const users = await query(`
      SELECT id, email, name, role, avatar, department, phone, status, last_login, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user groups
    const groups = await query(`
      SELECT g.id, g.name, g.color
      FROM \`groups\` g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = ?
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        ...users[0],
        groups
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.post('/change-password', verifyToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    // Log audit
    await logAudit(req.user.id, 'PASSWORD_CHANGE', 'user', req.user.id, null, null, req);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
