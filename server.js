'use strict';
require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const slowDown    = require('express-slow-down');
const cors        = require('cors');
const compression = require('compression');
const xssClean    = require('xss-clean');
const hpp         = require('hpp');
const morgan      = require('morgan');
const path        = require('path');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc:   ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],
      objectSrc:  ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ── CORS ─────────────────────────────────────────────────────
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    console.log('CORS origin:', origin);
    return (!origin || allowed.includes(origin)) ? cb(null, true) : cb(new Error('CORS'));
  }
}));

// ── Compression ───────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── Request ID ───────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── XSS + HPP ────────────────────────────────────────────────
app.use(xssClean());
app.use(hpp());

// ── Rate limiting ─────────────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use('/api/', slowDown({ windowMs: 15 * 60 * 1000, delayAfter: 100, delayMs: () => 500 }));
app.use('/api/', rateLimit({ windowMs: 10 * 60 * 1000, max: 60, message: { error: 'Too many API requests.' } }));

// ── Static assets (images, CSS, JS, fonts) ────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag:   true,
  index:  false,           // ← prevent auto-serving index.html here; let the SPA catch-all below handle it
}));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), pid: process.pid }));

// ── API routes ─────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscription'));
app.use('/api/contact',       require('./routes/contact'));

// ── SPA catch-all ─────────────────────────────────────────────
// Every GET request that is not an API or static file serves index.html
// The client-side JS (goPage + history.pushState) renders the correct page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) console.error(err);
  res.status(err.statusCode || 500).json({
    error: isProd ? 'An error occurred.' : err.message,
    requestId: req.id,
  });
});

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(PORT, () =>
  console.log(`FermesDirect v3 · port ${PORT} · PID ${process.pid}`)
);
server.keepAliveTimeout = 65000;
server.headersTimeout   = 66000;

// ── Graceful shutdown ─────────────────────────────────────────
const shutdown = (sig) => {
  console.log(`${sig} – shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 30000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (e) => { console.error('uncaughtException', e);  shutdown('uncaughtException'); });
process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));

module.exports = app;
