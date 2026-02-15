const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Configure multer for logo/favicon uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/branding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for article images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for article attachments
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|ico|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images allowed.'));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images allowed (JPG, PNG, GIF, WebP, SVG).'));
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Allowed: images, PDF, Office documents, text, zip files.'));
  }
});

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM settings');
    
    // Convert to key-value object
    const settingsObj = {};
    for (const setting of settings) {
      let value = setting.setting_value;
      // Parse based on type
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'json') {
        try { value = JSON.parse(value); } catch (e) {}
      }
      settingsObj[setting.setting_key] = value;
    }

    // Also include favicon_url from theme_settings if available
    try {
      const themeSettings = await query('SELECT favicon_url, logo_url FROM theme_settings WHERE is_active = TRUE LIMIT 1');
      if (themeSettings.length > 0) {
        if (themeSettings[0].favicon_url) {
          settingsObj.favicon_url = themeSettings[0].favicon_url;
        }
        if (themeSettings[0].logo_url && !settingsObj.logo_url) {
          settingsObj.logo_url = themeSettings[0].logo_url;
        }
      }
    } catch (e) {
      // theme_settings table might not exist yet - ignore
    }

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === Email Settings ===

// Get email settings (admin only)
router.get('/email', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Email settings are stored as individual settings keys
    const emailKeys = [
      'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password',
      'from_email', 'from_name', 'email_enabled'
    ];
    const placeholders = emailKeys.map(() => '?').join(', ');
    const settings = await query(
      `SELECT setting_key, setting_value, setting_type FROM settings WHERE setting_key IN (${placeholders})`,
      emailKeys
    );

    const emailSettings = {
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: false,
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: '',
      email_enabled: false,
    };

    for (const setting of settings) {
      let value = setting.setting_value;
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      }
      emailSettings[setting.setting_key] = value;
    }

    res.json({ success: true, data: emailSettings });
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update email settings (admin only)
router.put('/email', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const emailFields = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'from_email', 'from_name', 'email_enabled'];

    for (const key of emailFields) {
      if (req.body[key] !== undefined) {
        const value = req.body[key];
        const stringValue = String(value);
        let settingType = 'string';
        if (typeof value === 'number') settingType = 'number';
        else if (typeof value === 'boolean') settingType = 'boolean';

        const existing = await query('SELECT id FROM settings WHERE setting_key = ?', [key]);
        if (existing.length === 0) {
          const settingId = uuidv4();
          await query(
            'INSERT INTO settings (id, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)',
            [settingId, key, stringValue, settingType]
          );
        } else {
          await query(
            'UPDATE settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?',
            [stringValue, settingType, key]
          );
        }
      }
    }

    await logAudit(req.user.id, 'UPDATE_EMAIL_SETTINGS', 'settings', null, null, req.body, req);
    res.json({ success: true, message: 'Email settings saved successfully' });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test email SMTP connection (admin only)
router.post('/email/test', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Load email settings
    const emailKeys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password'];
    const placeholders = emailKeys.map(() => '?').join(', ');
    const settings = await query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`,
      emailKeys
    );

    const config = {};
    for (const s of settings) {
      config[s.setting_key] = s.setting_value;
    }

    if (!config.smtp_host) {
      return res.json({ success: false, message: 'SMTP host is not configured' });
    }

    // Try connecting with nodemailer if available
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_secure === 'true',
        auth: config.smtp_user ? {
          user: config.smtp_user,
          pass: config.smtp_password || '',
        } : undefined,
        connectionTimeout: 10000,
      });

      await transporter.verify();
      res.json({ success: true, message: 'SMTP connection successful' });
    } catch (smtpError) {
      res.json({ success: false, message: `SMTP connection failed: ${smtpError.message}` });
    }
  } catch (error) {
    console.error('Test email connection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send test email (admin only)
router.post('/email/send-test', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email address required' });
    }

    // Load email settings
    const emailKeys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'from_email', 'from_name'];
    const placeholders = emailKeys.map(() => '?').join(', ');
    const settings = await query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`,
      emailKeys
    );

    const config = {};
    for (const s of settings) {
      config[s.setting_key] = s.setting_value;
    }

    if (!config.smtp_host) {
      return res.json({ success: false, message: 'SMTP host is not configured. Please save email settings first.' });
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_secure === 'true',
        auth: config.smtp_user ? {
          user: config.smtp_user,
          pass: config.smtp_password || '',
        } : undefined,
        connectionTimeout: 10000,
      });

      await transporter.sendMail({
        from: `"${config.from_name || 'Company Portal'}" <${config.from_email || config.smtp_user || 'noreply@example.com'}>`,
        to,
        subject: 'Test Email from Company Portal',
        text: 'This is a test email from your Company Portal. If you received this, your email settings are configured correctly!',
        html: '<h2>Test Email</h2><p>This is a test email from your <strong>Company Portal</strong>.</p><p>If you received this, your email settings are configured correctly!</p>',
      });

      await logAudit(req.user.id, 'SEND_TEST_EMAIL', 'email', null, null, { to }, req);
      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (smtpError) {
      res.json({ success: false, message: `Failed to send email: ${smtpError.message}` });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single setting
router.get('/:key', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM settings WHERE setting_key = ?', [req.params.key]);

    if (settings.length === 0) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    const setting = settings[0];
    let value = setting.setting_value;
    
    // Parse based on type
    if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'boolean') {
      value = value === 'true';
    } else if (setting.setting_type === 'json') {
      try { value = JSON.parse(value); } catch (e) {}
    }

    res.json({ success: true, data: { key: setting.setting_key, value, type: setting.setting_type } });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update setting (admin only)
router.put('/:key', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type } = req.body;

    // Get existing setting
    const existing = await query('SELECT * FROM settings WHERE setting_key = ?', [key]);

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const settingType = type || (existing.length > 0 ? existing[0].setting_type : 'string');

    if (existing.length === 0) {
      // Create new setting
      const settingId = uuidv4();
      await query(`
        INSERT INTO settings (id, setting_key, setting_value, setting_type)
        VALUES (?, ?, ?, ?)
      `, [settingId, key, stringValue, settingType]);
    } else {
      // Update existing
      await query(
        'UPDATE settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?',
        [stringValue, settingType, key]
      );
    }

    // Log audit
    await logAudit(
      req.user.id, 
      existing.length === 0 ? 'CREATE_SETTING' : 'UPDATE_SETTING', 
      'setting', 
      key, 
      existing[0] || null, 
      { value: stringValue }, 
      req
    );

    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk update settings (admin only)
router.post('/bulk', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings object' });
    }

    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      let settingType = 'string';
      if (typeof value === 'number') settingType = 'number';
      else if (typeof value === 'boolean') settingType = 'boolean';
      else if (typeof value === 'object') settingType = 'json';

      const existing = await query('SELECT id FROM settings WHERE setting_key = ?', [key]);

      if (existing.length === 0) {
        const settingId = uuidv4();
        await query(`
          INSERT INTO settings (id, setting_key, setting_value, setting_type)
          VALUES (?, ?, ?, ?)
        `, [settingId, key, stringValue, settingType]);
      } else {
        await query(
          'UPDATE settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?',
          [stringValue, settingType, key]
        );
      }
    }

    // Log audit
    await logAudit(req.user.id, 'BULK_UPDATE_SETTINGS', 'settings', null, null, settings, req);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === Theme Settings ===

// Get active theme
router.get('/theme/active', async (req, res) => {
  try {
    const themes = await query('SELECT * FROM theme_settings WHERE is_active = TRUE LIMIT 1');

    if (themes.length === 0) {
      // Return default theme
      return res.json({
        success: true,
        data: {
          primary_color: '#3B82F6',
          secondary_color: '#6366F1',
          accent_color: '#8B5CF6',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      });
    }

    res.json({ success: true, data: themes[0] });
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update theme (admin only)
router.put('/theme/active', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { primary_color, secondary_color, accent_color, background_type, background_value, logo_url, favicon_url } = req.body;

    // Get or create active theme
    const existing = await query('SELECT * FROM theme_settings WHERE is_active = TRUE LIMIT 1');

    const updates = [];
    const params = [];

    if (primary_color) { updates.push('primary_color = ?'); params.push(primary_color); }
    if (secondary_color) { updates.push('secondary_color = ?'); params.push(secondary_color); }
    if (accent_color) { updates.push('accent_color = ?'); params.push(accent_color); }
    if (background_type) { updates.push('background_type = ?'); params.push(background_type); }
    if (background_value !== undefined) { updates.push('background_value = ?'); params.push(background_value); }
    if (logo_url !== undefined) { updates.push('logo_url = ?'); params.push(logo_url); }
    if (favicon_url !== undefined) { updates.push('favicon_url = ?'); params.push(favicon_url); }

    if (existing.length === 0) {
      // Create new theme
      const themeId = uuidv4();
      await query(`
        INSERT INTO theme_settings (id, name, primary_color, secondary_color, accent_color, background_type, background_value, logo_url, favicon_url, is_active)
        VALUES (?, 'default', ?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [themeId, primary_color || '#3B82F6', secondary_color || '#6366F1', accent_color || '#8B5CF6', background_type || 'gradient', background_value || '', logo_url || null, favicon_url || null]);
    } else if (updates.length > 0) {
      params.push(existing[0].id);
      await query(`UPDATE theme_settings SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_THEME', 'theme_settings', existing[0]?.id || 'new', existing[0] || null, req.body, req);

    res.json({ success: true, message: 'Theme updated successfully' });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload logo
router.post('/upload/logo', verifyToken, requireRole('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const logoUrl = `/uploads/branding/${req.file.filename}`;

    // Update theme with new logo
    const themes = await query('SELECT id FROM theme_settings WHERE is_active = TRUE LIMIT 1');
    
    if (themes.length > 0) {
      await query('UPDATE theme_settings SET logo_url = ? WHERE id = ?', [logoUrl, themes[0].id]);
    } else {
      const themeId = uuidv4();
      await query(`
        INSERT INTO theme_settings (id, name, logo_url, is_active)
        VALUES (?, 'default', ?, TRUE)
      `, [themeId, logoUrl]);
    }

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { url: logoUrl }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload favicon
router.post('/upload/favicon', verifyToken, requireRole('admin'), upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const faviconUrl = `/uploads/branding/${req.file.filename}`;

    const themes = await query('SELECT id FROM theme_settings WHERE is_active = TRUE LIMIT 1');
    
    if (themes.length > 0) {
      await query('UPDATE theme_settings SET favicon_url = ? WHERE id = ?', [faviconUrl, themes[0].id]);
    } else {
      const themeId = uuidv4();
      await query(`
        INSERT INTO theme_settings (id, name, favicon_url, is_active)
        VALUES (?, 'default', ?, TRUE)
      `, [themeId, faviconUrl]);
    }

    res.json({
      success: true,
      message: 'Favicon uploaded successfully',
      data: { url: faviconUrl }
    });
  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload image for articles (any authenticated user)
router.post('/upload/image', verifyToken, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: { 
        url: imageUrl,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload attachment for articles (any authenticated user)
router.post('/upload/attachment', verifyToken, attachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const attachmentId = uuidv4();
    const attachmentUrl = `/uploads/attachments/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: { 
        id: attachmentId,
        url: attachmentUrl,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get audit log (admin only)
router.get('/audit/log', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, user_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    const countResult = await query(`SELECT CAST(COUNT(*) AS SIGNED) as total FROM audit_log WHERE ${whereClause}`, params);
    const total = Number(countResult[0].total);

    const logs = await query(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
