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

// Forgot password - send reset link
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token valid for 1 hour

    // Store reset token in database
    // First, ensure the columns exist (they may need to be added via migration)
    try {
      await query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [resetToken, resetExpires, user.id]
      );
    } catch (colErr) {
      // If columns don't exist, add them
      try {
        await query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL');
        await query('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL');
        await query(
          'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
          [resetToken, resetExpires, user.id]
        );
      } catch (alterErr) {
        console.error('Error adding reset token columns:', alterErr);
        return res.status(500).json({ success: false, message: 'Server error setting up password reset' });
      }
    }

    // Try to send email if nodemailer and SMTP settings are configured
    try {
      // Load SMTP settings from database
      const settings = await query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'smtp_%' OR setting_key = 'from_email' OR setting_key = 'from_name' OR setting_key = 'email_enabled'");
      const smtp = {};
      settings.forEach(s => { smtp[s.setting_key] = s.setting_value; });

      if (smtp.email_enabled === 'true' && smtp.smtp_host && smtp.smtp_port) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtp.smtp_host,
          port: parseInt(smtp.smtp_port),
          secure: smtp.smtp_secure === 'true',
          auth: {
            user: smtp.smtp_user,
            pass: smtp.smtp_password,
          },
        });

        // Get frontend URL for reset link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
          from: `"${smtp.from_name || 'Company Portal'}" <${smtp.from_email || smtp.smtp_user}>`,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a></p>
            <p>Or copy this URL: ${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });

        console.log(`Password reset email sent to ${email}`);
      } else {
        console.warn('Email not configured - reset token generated but email not sent. Token:', resetToken);
      }
    } catch (emailErr) {
      console.error('Error sending reset email:', emailErr);
      // Don't fail the request - token was still created
      console.warn('Reset token generated but email could not be sent. Token:', resetToken);
    }

    // Log audit
    await logAudit(user.id, 'PASSWORD_RESET_REQUEST', 'user', user.id, null, { email }, req);

    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const users = await query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Log audit
    await logAudit(user.id, 'PASSWORD_RESET', 'user', user.id, null, null, req);

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
