const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param, query: queryValidator } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../database/connection');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/articles');
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Get all articles (public - published only, authenticated - all based on role)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category: rawCategory, search: rawSearch, status: rawStatus } = req.query;
    // Sanitize query params - treat "undefined" and "null" strings as missing values
    const category = (rawCategory && rawCategory !== 'undefined' && rawCategory !== 'null') ? rawCategory : undefined;
    const search = (rawSearch && rawSearch !== 'undefined' && rawSearch !== 'null') ? rawSearch : undefined;
    const status = (rawStatus && rawStatus !== 'undefined' && rawStatus !== 'null') ? rawStatus : undefined;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    console.log('[DEBUG Articles API] Request params:', {
      page, limit, category, search, status,
      user: req.user ? { id: req.user.id, role: req.user.role } : 'No user',
      offset
    });

    // Non-authenticated users only see published articles
    if (!req.user || req.user.role === 'user') {
      whereClause += ' AND a.status = ?';
      params.push('published');
      console.log('[DEBUG Articles API] Filter: Non-admin user - showing only published articles');
    } else if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
      console.log('[DEBUG Articles API] Filter: Admin/Editor with status filter:', status);
    } else {
      console.log('[DEBUG Articles API] Filter: Admin/Editor - showing all statuses');
    }

    if (category) {
      whereClause += ' AND a.category_id = ?';
      params.push(category);
      console.log('[DEBUG Articles API] Filter: Category ID:', category);
    }

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      console.log('[DEBUG Articles API] Filter: Search term:', search);
    }

    // Group-based visibility: for regular users and editors, only show articles that either
    // have no target groups (visible to everyone) or target groups that match the user's groups.
    // Admins can see all articles regardless of group assignment.
    if (req.user && req.user.role !== 'admin') {
      // Get the user's group IDs
      const userGroups = await query(
        'SELECT group_id FROM user_groups WHERE user_id = ?',
        [req.user.id]
      );
      const userGroupIds = userGroups.map(g => g.group_id);

      if (userGroupIds.length > 0) {
        const placeholders = userGroupIds.map(() => '?').join(',');
        whereClause += ` AND (
          NOT EXISTS (SELECT 1 FROM article_groups ag2 WHERE ag2.article_id = a.id)
          OR EXISTS (SELECT 1 FROM article_groups ag3 WHERE ag3.article_id = a.id AND ag3.group_id IN (${placeholders}))
        )`;
        params.push(...userGroupIds);
      } else {
        // User has no groups - only show articles with no target groups
        whereClause += ' AND NOT EXISTS (SELECT 1 FROM article_groups ag2 WHERE ag2.article_id = a.id)';
      }
      console.log('[DEBUG Articles API] Filter: Group visibility applied for user groups:', userGroupIds);
    } else if (!req.user) {
      // Unauthenticated users only see articles with no target groups
      whereClause += ' AND NOT EXISTS (SELECT 1 FROM article_groups ag2 WHERE ag2.article_id = a.id)';
      console.log('[DEBUG Articles API] Filter: Unauthenticated - showing only ungrouped articles');
    }

    console.log('[DEBUG Articles API] Final WHERE clause:', whereClause);
    console.log('[DEBUG Articles API] Query params:', params);

    // Get total count
    const countResult = await query(
      `SELECT CAST(COUNT(*) AS SIGNED) as total FROM articles a WHERE ${whereClause}`,
      params
    );
    const total = Number(countResult[0].total);
    console.log('[DEBUG Articles API] Total articles matching filters:', total);

    // Get articles
    const articles = await query(`
      SELECT a.*, 
        u.name as author_name, u.avatar as author_avatar,
        c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN news_categories c ON a.category_id = c.id
      WHERE ${whereClause}
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    console.log('[DEBUG Articles API] Retrieved articles:', articles.length);
    if (articles.length > 0) {
      console.log('[DEBUG Articles API] Sample article:', {
        id: articles[0].id,
        title: articles[0].title,
        status: articles[0].status,
        published_at: articles[0].published_at
      });
    }

    // Get attachments for each article
    for (const article of articles) {
      const attachments = await query(
        'SELECT * FROM article_attachments WHERE article_id = ?',
        [article.id]
      );
      article.attachments = attachments;

      // Get target groups
      const targetGroups = await query(
        'SELECT g.id, g.name FROM article_groups ag JOIN `groups` g ON ag.group_id = g.id WHERE ag.article_id = ?',
        [article.id]
      );
      article.target_groups = targetGroups;
    }

    console.log('[DEBUG Articles API] Sending response with', articles.length, 'articles');
    
    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[DEBUG Articles API] Error:', error);
    console.error('Get articles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single article
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let whereClause = 'a.id = ?';
    const params = [req.params.id];

    // Non-authenticated users only see published articles
    if (!req.user || req.user.role === 'user') {
      whereClause += ' AND a.status = ?';
      params.push('published');
    }

    const articles = await query(`
      SELECT a.*, 
        u.name as author_name, u.avatar as author_avatar, u.email as author_email,
        c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN news_categories c ON a.category_id = c.id
      WHERE ${whereClause}
    `, params);

    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Check group visibility for regular users and editors (admins can see all)
    if (req.user && req.user.role !== 'admin') {
      const articleGroups = await query(
        'SELECT group_id FROM article_groups WHERE article_id = ?',
        [req.params.id]
      );
      if (articleGroups.length > 0) {
        const userGroups = await query(
          'SELECT group_id FROM user_groups WHERE user_id = ?',
          [req.user.id]
        );
        const userGroupIds = userGroups.map(g => g.group_id);
        const hasAccess = articleGroups.some(ag => userGroupIds.includes(ag.group_id));
        if (!hasAccess) {
          return res.status(404).json({ success: false, message: 'Article not found' });
        }
      }
    } else if (!req.user) {
      // Unauthenticated users can only see articles with no target groups
      const articleGroups = await query(
        'SELECT group_id FROM article_groups WHERE article_id = ?',
        [req.params.id]
      );
      if (articleGroups.length > 0) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }
    }

    // Get attachments
    const attachments = await query(
      'SELECT * FROM article_attachments WHERE article_id = ?',
      [req.params.id]
    );

    // Get target groups
    const targetGroups = await query(
      'SELECT g.id, g.name FROM article_groups ag JOIN `groups` g ON ag.group_id = g.id WHERE ag.article_id = ?',
      [req.params.id]
    );

    // Increment views
    await query('UPDATE articles SET views = views + 1 WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      data: { ...articles[0], attachments, target_groups: targetGroups }
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create article (admin/editor only)
router.post('/', verifyToken, requireRole('admin', 'editor'), [
  body('title').notEmpty().trim(),
  body('content').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content, excerpt, category_id, status = 'draft', featured_image, target_groups } = req.body;

    const articleId = uuidv4();
    const publishedAt = status === 'published' ? new Date() : null;

    await query(`
      INSERT INTO articles (id, title, content, excerpt, category_id, author_id, status, featured_image, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [articleId, title, content, excerpt || null, category_id || null, req.user.id, status, featured_image || null, publishedAt]);

    // Insert target groups if specified
    if (target_groups && target_groups.length > 0) {
      for (const groupId of target_groups) {
        await query('INSERT INTO article_groups (article_id, group_id) VALUES (?, ?)', [articleId, groupId]);
      }
    }

    // Insert attachments if provided in the request body
    const { attachments } = req.body;
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        const attId = att.id || uuidv4();
        await query(`
          INSERT INTO article_attachments (id, article_id, filename, original_name, mime_type, size, url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [attId, articleId, att.filename || att.url?.split('/').pop() || '', att.original_name || att.name || '', att.mime_type || att.type || '', att.size || 0, att.url || '']);
      }
    }

    // Log audit
    await logAudit(req.user.id, 'CREATE_ARTICLE', 'article', articleId, null, { title, status }, req);

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: { id: articleId }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update article (admin/editor only)
router.put('/:id', verifyToken, requireRole('admin', 'editor'), [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, excerpt, category_id, status, featured_image, target_groups } = req.body;

    // Get existing article
    const existing = await query('SELECT * FROM articles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const updates = [];
    const params = [];

    if (title) { updates.push('title = ?'); params.push(title); }
    if (content) { updates.push('content = ?'); params.push(content); }
    if (excerpt !== undefined) { updates.push('excerpt = ?'); params.push(excerpt); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (featured_image !== undefined) { updates.push('featured_image = ?'); params.push(featured_image); }
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      // Set published_at when publishing
      if (status === 'published' && existing[0].status !== 'published') {
        updates.push('published_at = NOW()');
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update target groups if specified
    if (target_groups !== undefined) {
      await query('DELETE FROM article_groups WHERE article_id = ?', [id]);
      if (target_groups && target_groups.length > 0) {
        for (const groupId of target_groups) {
          await query('INSERT INTO article_groups (article_id, group_id) VALUES (?, ?)', [id, groupId]);
        }
      }
    }

    // Sync attachments if provided in the request body
    const { attachments } = req.body;
    if (attachments !== undefined) {
      // Get existing attachments
      const existingAttachments = await query('SELECT * FROM article_attachments WHERE article_id = ?', [id]);
      const existingIds = existingAttachments.map(a => a.id);
      const newIds = attachments.map(a => a.id).filter(Boolean);

      // Delete attachments that were removed
      for (const existing of existingAttachments) {
        if (!newIds.includes(existing.id)) {
          // Delete file from filesystem
          const filePath = path.join(__dirname, '../../uploads', existing.url?.replace(/^\/uploads\//, '') || '');
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete attachment file:', e); }
          }
          await query('DELETE FROM article_attachments WHERE id = ?', [existing.id]);
        }
      }

      // Add new attachments
      for (const att of attachments) {
        if (!existingIds.includes(att.id)) {
          const attId = att.id || uuidv4();
          await query(`
            INSERT INTO article_attachments (id, article_id, filename, original_name, mime_type, size, url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [attId, id, att.filename || att.url?.split('/').pop() || '', att.original_name || att.name || '', att.mime_type || att.type || '', att.size || 0, att.url || '']);
        }
      }
    }

    // Log audit
    await logAudit(req.user.id, 'UPDATE_ARTICLE', 'article', id, existing[0], req.body, req);

    res.json({ success: true, message: 'Article updated successfully' });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete article (admin/editor only)
router.delete('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM articles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Delete attachments from filesystem
    const attachments = await query('SELECT * FROM article_attachments WHERE article_id = ?', [id]);
    for (const attachment of attachments) {
      const filePath = path.join(__dirname, '../../uploads/articles', attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await query('DELETE FROM articles WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE_ARTICLE', 'article', id, existing[0], null, req);

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload attachment
router.post('/:id/attachments', verifyToken, requireRole('admin', 'editor'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer article attachment upload error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { id } = req.params;

    // Check if article exists
    const articles = await query('SELECT id FROM articles WHERE id = ?', [id]);
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const attachmentId = uuidv4();
    const fileUrl = `/uploads/articles/${req.file.filename}`;

    await query(`
      INSERT INTO article_attachments (id, article_id, filename, original_name, mime_type, size, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [attachmentId, id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, fileUrl]);

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        id: attachmentId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Link existing attachment to article (for attachments uploaded via RichTextEditor)
router.post('/:id/attachments/link', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: attachmentId, filename, original_name, mime_type, url, size } = req.body;

    // Check if article exists
    const articles = await query('SELECT id FROM articles WHERE id = ?', [id]);
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Check if attachment already linked
    const existing = await query('SELECT id FROM article_attachments WHERE id = ? AND article_id = ?', [attachmentId, id]);
    if (existing.length > 0) {
      return res.json({ success: true, message: 'Attachment already linked' });
    }

    // Link the attachment
    await query(`
      INSERT INTO article_attachments (id, article_id, filename, original_name, mime_type, size, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [attachmentId, id, filename, original_name, mime_type, size || 0, url]);

    res.status(201).json({
      success: true,
      message: 'Attachment linked successfully',
      data: { id: attachmentId }
    });
  } catch (error) {
    console.error('Link attachment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Delete attachment
router.delete('/:id/attachments/:attachmentId', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const attachments = await query(
      'SELECT * FROM article_attachments WHERE id = ? AND article_id = ?',
      [attachmentId, id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Delete file
    const filePath = path.join(__dirname, '../../uploads/articles', attachments[0].filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await query('DELETE FROM article_attachments WHERE id = ?', [attachmentId]);

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
