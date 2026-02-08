const express = require('express');
const { query } = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all preferences for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await query(
      'SELECT pref_key, pref_value FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );
    const prefs = {};
    for (const row of rows) {
      try {
        prefs[row.pref_key] = JSON.parse(row.pref_value);
      } catch {
        prefs[row.pref_key] = row.pref_value;
      }
    }
    res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a single preference
router.get('/:key', verifyToken, async (req, res) => {
  try {
    const rows = await query(
      'SELECT pref_value FROM user_preferences WHERE user_id = ? AND pref_key = ?',
      [req.user.id, req.params.key]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Preference not found' });
    }
    let value;
    try {
      value = JSON.parse(rows[0].pref_value);
    } catch {
      value = rows[0].pref_value;
    }
    res.json({ success: true, data: value });
  } catch (error) {
    console.error('Get preference error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Set a preference
router.put('/:key', verifyToken, async (req, res) => {
  try {
    const { value } = req.body;
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    await query(
      `INSERT INTO user_preferences (user_id, pref_key, pref_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value)`,
      [req.user.id, req.params.key, stringValue]
    );
    
    res.json({ success: true, message: 'Preference saved' });
  } catch (error) {
    console.error('Set preference error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk set preferences
router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid preferences object' });
    }

    for (const [key, value] of Object.entries(preferences)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await query(
        `INSERT INTO user_preferences (user_id, pref_key, pref_value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value)`,
        [req.user.id, key, stringValue]
      );
    }

    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    console.error('Bulk set preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
