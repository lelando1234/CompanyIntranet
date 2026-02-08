module.exports = {
  apps: [{
    name: 'company-portal-api',
    script: 'src/index.js',
    instances: 1, // IMPORTANT: Only 1 instance to prevent EADDRINUSE
    exec_mode: 'fork', // Use fork mode, NOT cluster mode
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 5000, // Wait 5 seconds before restarting
    max_restarts: 10, // Max 10 restarts before stopping
    min_uptime: '10s', // Must be up for 10s to be considered started
    kill_timeout: 10000, // Give 10s for graceful shutdown
    listen_timeout: 15000, // Wait up to 15s for listen event
    env: {
      NODE_ENV: 'production',
    },
    env_development: {
      NODE_ENV: 'development',
    }
  }]
};
