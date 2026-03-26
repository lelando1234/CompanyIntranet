const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer for company logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/company-logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|svg|webp/.test(path.extname(file.originalname).toLowerCase()) &&
        /image/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /logo — upload company logo, return URL
router.post('/logo', verifyToken, requireRole('admin'), uploadLogo.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, data: { logo_url: `/uploads/company-logos/${req.file.filename}` } });
});

// GET all companies
router.get('/', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const companies = await query('SELECT * FROM signature_companies ORDER BY name ASC');
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

// GET single company
router.get('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const [company] = await query('SELECT * FROM signature_companies WHERE id = ?', [req.params.id]);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch company' });
  }
});

// POST create company
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, address, telephone, logo_url, website_url, disclaimer_text } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Company name is required' });
  try {
    const id = uuidv4();
    await query(
      'INSERT INTO signature_companies (id, name, address, telephone, logo_url, website_url, disclaimer_text, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), address || null, telephone || null, logo_url || null, website_url || null, disclaimer_text || null, req.user.id]
    );
    await logAudit(req.user.id, 'CREATE_SIGNATURE_COMPANY', 'signature_companies', id, { name });
    const [created] = await query('SELECT * FROM signature_companies WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('POST /signature-companies error:', err);
    res.status(500).json({ success: false, message: 'Failed to create company' });
  }
});

// PUT update company
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, address, telephone, logo_url, website_url, disclaimer_text } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Company name is required' });
  try {
    const [existing] = await query('SELECT id FROM signature_companies WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });
    await query(
      'UPDATE signature_companies SET name = ?, address = ?, telephone = ?, logo_url = ?, website_url = ?, disclaimer_text = ? WHERE id = ?',
      [name.trim(), address || null, telephone || null, logo_url || null, website_url || null, disclaimer_text || null, req.params.id]
    );
    await logAudit(req.user.id, 'UPDATE_SIGNATURE_COMPANY', 'signature_companies', req.params.id, { name });
    const [updated] = await query('SELECT * FROM signature_companies WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update company' });
  }
});

// DELETE company
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [existing] = await query('SELECT id, name FROM signature_companies WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });
    await query('DELETE FROM signature_companies WHERE id = ?', [req.params.id]);
    await logAudit(req.user.id, 'DELETE_SIGNATURE_COMPANY', 'signature_companies', req.params.id, { name: existing.name });
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

module.exports = router;
