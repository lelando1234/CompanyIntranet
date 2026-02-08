const express = require('express');
const { query } = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get read notification IDs for current user
router.get('/read', verifyToken, async (req, res) => {
  try {
    const rows = await query(
      'SELECT article_id FROM user_notification_reads WHERE user_id = ?',
      [req.user.id]
    );
    const readIds = rows.map(r => r.article_id);
    res.json({ success: true, data: readIds });
  } catch (error) {
    console.error('Get notification reads error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark a single notification as read
router.post('/read/:articleId', verifyToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    await query(
      `INSERT IGNORE INTO user_notification_reads (user_id, article_id) VALUES (?, ?)`,
      [req.user.id, articleId]
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark all notifications as read (takes an array of article IDs)
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    const { articleIds } = req.body;
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ success: false, message: 'articleIds array required' });
    }

    for (const articleId of articleIds) {
      await query(
        `INSERT IGNORE INTO user_notification_reads (user_id, article_id) VALUES (?, ?)`,
        [req.user.id, articleId]
      );
    }

    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
