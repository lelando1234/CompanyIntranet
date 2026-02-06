const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Get all news categories
router.get('/', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, 
        CAST((SELECT COUNT(*) FROM articles WHERE category_id = c.id) AS SIGNED) as article_count
      FROM news_categories c
      ORDER BY c.name ASC
    `);

    // Ensure article_count is a regular number for JSON serialization
    const sanitized = categories.map(cat => ({
      ...cat,
      article_count: Number(cat.article_count || 0)
    }));

    res.json({ success: true, data: sanitized });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM news_categories WHERE id = ?', [req.params.id]);

    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: categories[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create category (admin/editor only)
router.post('/', verifyToken, requireRole('admin', 'editor'), [
  body('name').notEmpty().trim(),
  body('slug').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, color } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if name or slug exists
    const existing = await query(
      'SELECT id FROM news_categories WHERE name = ? OR slug = ?',
      [name, slug]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
    }

    const categoryId = uuidv4();

    await query(`
      INSERT INTO news_categories (id, name, slug, description, color)
      VALUES (?, ?, ?, ?, ?)
    `, [categoryId, name, slug, description || null, color || '#3B82F6']);

    // Log audit
    await logAudit(req.user.id, 'CREATE_CATEGORY', 'news_category', categoryId, null, { name, slug }, req);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: categoryId, name, slug }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update category (admin/editor only)
router.put('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color } = req.body;

    // Check if exists
    const existing = await query('SELECT * FROM news_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check uniqueness
    if (name || slug) {
      const duplicate = await query(
        'SELECT id FROM news_categories WHERE (name = ? OR slug = ?) AND id != ?',
        [name || '', slug || '', id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
      }
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (slug) { updates.push('slug = ?'); params.push(slug); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (color) { updates.push('color = ?'); params.push(color); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE news_categories SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_CATEGORY', 'news_category', id, existing[0], req.body, req);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete category (admin/editor only)
router.delete('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM news_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category has articles
    const articles = await query('SELECT CAST(COUNT(*) AS SIGNED) as count FROM articles WHERE category_id = ?', [id]);
    if (Number(articles[0].count) > 0) {
      // Set articles category to null instead of deleting
      await query('UPDATE articles SET category_id = NULL WHERE category_id = ?', [id]);
    }

    await query('DELETE FROM news_categories WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_CATEGORY', 'news_category', id, existing[0], null, req);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
