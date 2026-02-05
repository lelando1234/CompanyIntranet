const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Get all URL categories with their links
router.get('/', async (req, res) => {
  try {
    const categories = await query(`
      SELECT * FROM url_categories ORDER BY sort_order ASC, name ASC
    `);

    // Get links for each category
    for (const category of categories) {
      const links = await query(
        'SELECT * FROM url_links WHERE category_id = ? ORDER BY sort_order ASC, title ASC',
        [category.id]
      );
      category.links = links;
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get URL categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single URL category with links
router.get('/:id', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM url_categories WHERE id = ?', [req.params.id]);

    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'URL category not found' });
    }

    const links = await query(
      'SELECT * FROM url_links WHERE category_id = ? ORDER BY sort_order ASC',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...categories[0], links }
    });
  } catch (error) {
    console.error('Get URL category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create URL category (admin/editor only)
router.post('/', verifyToken, requireRole('admin', 'editor'), [
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, icon, sort_order } = req.body;

    const categoryId = uuidv4();

    await query(`
      INSERT INTO url_categories (id, name, description, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `, [categoryId, name, description || null, icon || 'Link', sort_order || 0]);

    // Log audit
    await logAudit(req.user.id, 'CREATE_URL_CATEGORY', 'url_category', categoryId, null, { name }, req);

    res.status(201).json({
      success: true,
      message: 'URL category created successfully',
      data: { id: categoryId, name }
    });
  } catch (error) {
    console.error('Create URL category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update URL category (admin/editor only)
router.put('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sort_order } = req.body;

    const existing = await query('SELECT * FROM url_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'URL category not found' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (icon) { updates.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE url_categories SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_URL_CATEGORY', 'url_category', id, existing[0], req.body, req);

    res.json({ success: true, message: 'URL category updated successfully' });
  } catch (error) {
    console.error('Update URL category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete URL category (admin/editor only)
router.delete('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM url_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'URL category not found' });
    }

    // This will cascade delete all links in this category
    await query('DELETE FROM url_categories WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_URL_CATEGORY', 'url_category', id, existing[0], null, req);

    res.json({ success: true, message: 'URL category deleted successfully' });
  } catch (error) {
    console.error('Delete URL category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === URL Links Routes ===

// Create link in category
router.post('/:categoryId/links', verifyToken, requireRole('admin', 'editor'), [
  body('title').notEmpty().trim(),
  body('url').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { categoryId } = req.params;
    const { title, url, description, icon, sort_order, is_external } = req.body;

    // Check if category exists
    const category = await query('SELECT id FROM url_categories WHERE id = ?', [categoryId]);
    if (category.length === 0) {
      return res.status(404).json({ success: false, message: 'URL category not found' });
    }

    const linkId = uuidv4();

    await query(`
      INSERT INTO url_links (id, category_id, title, url, description, icon, sort_order, is_external)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [linkId, categoryId, title, url, description || null, icon || null, sort_order || 0, is_external !== false]);

    // Log audit
    await logAudit(req.user.id, 'CREATE_URL_LINK', 'url_link', linkId, null, { title, url }, req);

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      data: { id: linkId, title, url }
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update link
router.put('/:categoryId/links/:linkId', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { categoryId, linkId } = req.params;
    const { title, url, description, icon, sort_order, is_external } = req.body;

    const existing = await query(
      'SELECT * FROM url_links WHERE id = ? AND category_id = ?',
      [linkId, categoryId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    const updates = [];
    const params = [];

    if (title) { updates.push('title = ?'); params.push(title); }
    if (url) { updates.push('url = ?'); params.push(url); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (is_external !== undefined) { updates.push('is_external = ?'); params.push(is_external); }

    if (updates.length > 0) {
      params.push(linkId);
      await query(`UPDATE url_links SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_URL_LINK', 'url_link', linkId, existing[0], req.body, req);

    res.json({ success: true, message: 'Link updated successfully' });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete link
router.delete('/:categoryId/links/:linkId', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { categoryId, linkId } = req.params;

    const existing = await query(
      'SELECT * FROM url_links WHERE id = ? AND category_id = ?',
      [linkId, categoryId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    await query('DELETE FROM url_links WHERE id = ?', [linkId]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_URL_LINK', 'url_link', linkId, existing[0], null, req);

    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
