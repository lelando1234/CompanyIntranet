const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const users = await query('SELECT id, email, name, role, status FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (users[0].status !== 'active') {
      return res.status(401).json({ success: false, message: 'User account is not active' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const users = await query('SELECT id, email, name, role, status FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length > 0 && users[0].status === 'active') {
      req.user = users[0];
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth
};
