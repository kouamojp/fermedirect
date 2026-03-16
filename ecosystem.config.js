'use strict';
module.exports = {
  apps: [{
    name: 'fermesdirect',
    script: './cluster.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: { NODE_ENV: 'development', PORT: 3000 },
    env_production: { NODE_ENV: 'production', PORT: 3000 },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
  }],
};
