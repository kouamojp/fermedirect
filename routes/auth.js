'use strict';
const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const db        = require('../config/db');
const { body, validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET || 'ferme_direct_secret_key_2026';

// Validation Rules
const authRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 characters'),
];

// REGISTER (Can be linked to Farmer/Buyer subscription later)
router.post('/register', [...authRules, body('name').notEmpty(), body('role').isIn(['buyer', 'farmer', 'admin'])], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, error: 'Email already registered' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    
    await db.execute(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, role]
    );

    return res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', authRules, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    
    return res.json({ success: true, user: users[0] });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
