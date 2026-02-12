const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Get all FAQs (public - no auth required for viewing)
router.get('/', async (req, res) => {
  try {
    const { category, active_only = 'true' } = req.query;

    let sql = 'SELECT * FROM faqs WHERE 1=1';
    const params = [];

    if (active_only === 'true') {
      sql += ' AND is_active = ?';
      params.push(true);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY display_order ASC, created_at DESC';

    const faqs = await query(sql, params);

    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get FAQ by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const faqs = await query('SELECT * FROM faqs WHERE id = ?', [id]);

    if (faqs.length === 0) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.json({ success: true, data: faqs[0] });
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new FAQ (admin only)
router.post('/', verifyToken, requireRole('admin'), [
  body('question').notEmpty().trim().withMessage('Question is required'),
  body('answer').notEmpty().trim().withMessage('Answer is required'),
  body('category').optional().trim(),
  body('display_order').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { question, answer, category, display_order = 0, is_active = true } = req.body;
    const id = uuidv4();

    await query(
      'INSERT INTO faqs (id, question, answer, category, display_order, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, question, answer, category || null, display_order, is_active, req.user.id]
    );

    // Log audit
    await logAudit(req.user.id, 'CREATE_FAQ', 'faq', id, null, { question, answer, category }, req);

    res.json({ success: true, message: 'FAQ created successfully', data: { id } });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update FAQ (admin only)
router.put('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID(),
  body('question').optional().notEmpty().trim(),
  body('answer').optional().notEmpty().trim(),
  body('category').optional().trim(),
  body('display_order').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { question, answer, category, display_order, is_active } = req.body;

    // Get existing FAQ
    const existing = await query('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (question !== undefined) { updates.push('question = ?'); params.push(question); }
    if (answer !== undefined) { updates.push('answer = ?'); params.push(answer); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category || null); }
    if (display_order !== undefined) { updates.push('display_order = ?'); params.push(display_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE faqs SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_FAQ', 'faq', id, existing[0], req.body, req);

    res.json({ success: true, message: 'FAQ updated successfully' });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete FAQ (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Get existing FAQ
    const existing = await query('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    await query('DELETE FROM faqs WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_FAQ', 'faq', id, existing[0], null, req);

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
