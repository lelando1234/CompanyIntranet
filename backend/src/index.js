require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { execSync } = require('child_process');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const groupsRoutes = require('./routes/groups');
const articlesRoutes = require('./routes/articles');
const categoriesRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const urlCategoriesRoutes = require('./routes/urlCategories');
const notificationsRoutes = require('./routes/notifications');
const preferencesRoutes = require('./routes/preferences');

// Import database
const { testConnection, pool } = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/url-categories', urlCategoriesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/preferences', preferencesRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Kill any existing process on the port before starting
function killPortProcess(port) {
  try {
    // Try fuser first (common on Debian)
    execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'ignore' });
    console.log(`🔪 Killed existing process on port ${port}`);
    // Give it a moment to release
    return new Promise(resolve => setTimeout(resolve, 1000));
  } catch {
    // No process on that port, or fuser not available - that's fine
    return Promise.resolve();
  }
}

// Start server with EADDRINUSE handling
async function startServer() {
  try {
    // Kill any existing process on the port
    await killPortProcess(PORT);

    // Test database connection
    await testConnection();
    console.log('✅ Database connection successful');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      // Write PID file for easy process management
      try {
        require('fs').writeFileSync(path.join(__dirname, '../.pid'), String(process.pid));
      } catch { /* ignore */ }
    });

    // Handle EADDRINUSE - port already in use
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is still in use after kill attempt.`);
        console.error(`   Waiting 3 seconds and retrying...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          await killPortProcess(PORT);
          await new Promise(resolve => setTimeout(resolve, 1000));
          server.listen(PORT, '0.0.0.0');
        } catch (retryErr) {
          console.error(`❌ Failed to bind port ${PORT} after retry. Exiting.`);
          process.exit(1);
        }
      } else {
        throw err;
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        try {
          await pool.end();
          console.log('🗄️ Database pool closed');
        } catch (err) {
          console.error('Error closing database pool:', err);
        }
        // Clean up PID file
        try {
          require('fs').unlinkSync(path.join(__dirname, '../.pid'));
        } catch { /* ignore */ }
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors to prevent silent crashes
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
