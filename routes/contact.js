'use strict';
const express   = require('express');
const router    = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');

const limit = rateLimit({ windowMs: 3600000, max: 5, message: { error: 'Too many contact attempts.' } });

router.post('/', limit, [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 3, max: 150 }).escape(),
  body('message').trim().isLength({ min: 10, max: 2000 }).escape(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  console.log(`[CONTACT] ${req.body.name} <${req.body.email}> – ${req.body.subject}`);
  return res.status(200).json({ success: true, id: crypto.randomUUID(), message: 'Message received. Reply within 24h.' });
});

module.exports = router;
