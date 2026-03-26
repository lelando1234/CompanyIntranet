const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer for signature photo uploads
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/sig-photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase()) &&
        /image/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /upload-photo — upload signature photo, return URL (must be before /:id routes)
router.post('/upload-photo', verifyToken, uploadPhoto.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, data: { photo_url: `/uploads/sig-photos/${req.file.filename}` } });
});

// All signature fields for SELECT / INSERT / UPDATE
const SIG_FIELDS = [
  'name', 'full_name', 'job_title', 'department', 'company_name',
  'phone', 'mobile', 'email', 'website_url', 'office_address',
  'show_profile_photo', 'show_company_logo',
  'social_linkedin', 'social_twitter', 'social_facebook', 'social_instagram',
  'social_github', 'social_youtube', 'social_custom_url', 'social_custom_label',
  'template', 'primary_color', 'font_family', 'assigned_to'
];

// ─── GET /me ───────────────────────────────────────────────────────────────────
// Must be registered BEFORE /:id so Express doesn't treat "me" as a UUID param
router.get('/me', verifyToken, async (req, res) => {
  try {
    const sigs = await query(
      'SELECT * FROM email_signatures WHERE assigned_to = ?',
      [req.user.id]
    );
    res.json({ success: true, data: sigs.length > 0 ? sigs[0] : null });
  } catch (error) {
    console.error('Get my signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const sigs = await query(`
      SELECT s.*,
             u.name  AS assigned_user_name,
             u.email AS assigned_user_email
      FROM email_signatures s
      LEFT JOIN users u ON s.assigned_to = u.id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: sigs });
  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, requireRole('admin', 'editor'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const sigs = await query(
      'SELECT s.*, u.name AS assigned_user_name, u.email AS assigned_user_email FROM email_signatures s LEFT JOIN users u ON s.assigned_to = u.id WHERE s.id = ?',
      [req.params.id]
    );

    if (sigs.length === 0) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    res.json({ success: true, data: sigs[0] });
  } catch (error) {
    console.error('Get signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST / ────────────────────────────────────────────────────────────────────
router.post('/', verifyToken, requireRole('admin'), [
  body('name').notEmpty().trim().withMessage('Signature name is required'),
  body('assigned_to').optional({ nullable: true }).isUUID().withMessage('Invalid user ID'),
  body('template').optional().isIn(['horizontal', 'vertical', 'compact', 'modern']),
  body('font_family').optional().isIn(['Arial', 'Georgia', 'Verdana', 'Helvetica']),
  body('primary_color').optional().matches(/^#[0-9a-fA-F]{3,6}$/).withMessage('Invalid color format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { assigned_to } = req.body;

    // Enforce 1-signature-per-user
    if (assigned_to) {
      const existing = await query('SELECT id FROM email_signatures WHERE assigned_to = ?', [assigned_to]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'This user already has a signature assigned. Unassign it first.' });
      }
    }

    const id = uuidv4();
    const {
      name, full_name, job_title, department, company_name,
      phone, mobile, email, website_url, office_address,
      show_profile_photo = false, show_company_logo = false,
      social_linkedin, social_twitter, social_facebook, social_instagram,
      social_github, social_youtube, social_custom_url, social_custom_label,
      template = 'horizontal', primary_color = '#0080ff', font_family = 'Arial',
      custom_photo_url, disclaimer_text
    } = req.body;

    await query(
      `INSERT INTO email_signatures
        (id, name, full_name, job_title, department, company_name, phone, mobile, email,
         website_url, office_address, show_profile_photo, show_company_logo,
         social_linkedin, social_twitter, social_facebook, social_instagram,
         social_github, social_youtube, social_custom_url, social_custom_label,
         template, primary_color, font_family, assigned_to, created_by,
         custom_photo_url, disclaimer_text)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, name, full_name || null, job_title || null, department || null, company_name || null,
       phone || null, mobile || null, email || null, website_url || null, office_address || null,
       show_profile_photo ? 1 : 0, show_company_logo ? 1 : 0,
       social_linkedin || null, social_twitter || null, social_facebook || null, social_instagram || null,
       social_github || null, social_youtube || null, social_custom_url || null, social_custom_label || null,
       template, primary_color, font_family, assigned_to || null, req.user.id,
       custom_photo_url || null, disclaimer_text || null]
    );

    await logAudit(req.user.id, 'CREATE_SIGNATURE', 'email_signature', id, null, { name, assigned_to }, req);

    res.status(201).json({ success: true, message: 'Signature created successfully', data: { id } });
  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /:id ──────────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('assigned_to').optional({ nullable: true }),
  body('template').optional().isIn(['horizontal', 'vertical', 'compact', 'modern']),
  body('font_family').optional().isIn(['Arial', 'Georgia', 'Verdana', 'Helvetica']),
  body('primary_color').optional().matches(/^#[0-9a-fA-F]{3,6}$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const existing = await query('SELECT * FROM email_signatures WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    // Check assigned_to uniqueness if changing
    if (req.body.assigned_to !== undefined && req.body.assigned_to !== null && req.body.assigned_to !== existing[0].assigned_to) {
      const conflict = await query('SELECT id FROM email_signatures WHERE assigned_to = ? AND id != ?', [req.body.assigned_to, id]);
      if (conflict.length > 0) {
        return res.status(409).json({ success: false, message: 'This user already has a signature assigned. Unassign it first.' });
      }
    }

    // Dynamic UPDATE — only set fields present in body
    const updates = [];
    const params = [];

    const updatableFields = [
      'name', 'full_name', 'job_title', 'department', 'company_name',
      'phone', 'mobile', 'email', 'website_url', 'office_address',
      'show_profile_photo', 'show_company_logo',
      'social_linkedin', 'social_twitter', 'social_facebook', 'social_instagram',
      'social_github', 'social_youtube', 'social_custom_url', 'social_custom_label',
      'template', 'primary_color', 'font_family', 'assigned_to',
      'custom_photo_url', 'disclaimer_text'
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'show_profile_photo' || field === 'show_company_logo') {
          params.push(req.body[field] ? 1 : 0);
        } else {
          params.push(req.body[field] === '' ? null : req.body[field]);
        }
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE email_signatures SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    await logAudit(req.user.id, 'UPDATE_SIGNATURE', 'email_signature', id, existing[0], req.body, req);

    res.json({ success: true, message: 'Signature updated successfully' });
  } catch (error) {
    console.error('Update signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const existing = await query('SELECT * FROM email_signatures WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    await query('DELETE FROM email_signatures WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE_SIGNATURE', 'email_signature', id, existing[0], null, req);

    res.json({ success: true, message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /:id/assign ──────────────────────────────────────────────────────────
router.post('/:id/assign', verifyToken, requireRole('admin'), [
  param('id').isUUID(),
  body('userId').isUUID().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { userId } = req.body;

    const sig = await query('SELECT * FROM email_signatures WHERE id = ?', [id]);
    if (sig.length === 0) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    const user = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const conflict = await query('SELECT id FROM email_signatures WHERE assigned_to = ? AND id != ?', [userId, id]);
    if (conflict.length > 0) {
      return res.status(409).json({ success: false, message: 'This user already has a signature assigned. Unassign it first.' });
    }

    await query('UPDATE email_signatures SET assigned_to = ? WHERE id = ?', [userId, id]);
    await logAudit(req.user.id, 'ASSIGN_SIGNATURE', 'email_signature', id, { assigned_to: sig[0].assigned_to }, { assigned_to: userId }, req);

    res.json({ success: true, message: 'Signature assigned successfully' });
  } catch (error) {
    console.error('Assign signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE /:id/assign ────────────────────────────────────────────────────────
router.delete('/:id/assign', verifyToken, requireRole('admin'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    const sig = await query('SELECT * FROM email_signatures WHERE id = ?', [id]);
    if (sig.length === 0) {
      return res.status(404).json({ success: false, message: 'Signature not found' });
    }

    await query('UPDATE email_signatures SET assigned_to = NULL WHERE id = ?', [id]);
    await logAudit(req.user.id, 'UNASSIGN_SIGNATURE', 'email_signature', id, { assigned_to: sig[0].assigned_to }, { assigned_to: null }, req);

    res.json({ success: true, message: 'Signature unassigned successfully' });
  } catch (error) {
    console.error('Unassign signature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
