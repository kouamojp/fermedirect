'use strict';
const express   = require('express');
const router    = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');

const db        = require('../config/db');

const limit = rateLimit({ windowMs: 3600000, max: 10, message: { error: 'Too many subscription attempts.' } });

const buyerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('company').trim().isLength({ min: 2, max: 100 }).escape(),
  body('phone').trim().isLength({ min: 6, max: 20 }).escape(),
  body('plan').isIn(['essentiel', 'professionnel', 'entreprise']),
  body('country').trim().isLength({ min: 2, max: 60 }).escape(),
  body('businessType').isIn(['restaurant', 'hotel', 'supermarche', 'distributeur', 'autre']),
  body('message').optional().trim().escape(),
  body('products').optional().toArray(),
];

const farmerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('farmName').trim().isLength({ min: 2, max: 100 }).escape(),
  body('phone').trim().isLength({ min: 6, max: 20 }).escape(),
  body('plan').isIn(['partenaire', 'pro-ferme', 'premium-ferme']),
  body('country').trim().isLength({ min: 2, max: 60 }).escape(),
  body('farmSize').isIn(['small', 'medium', 'large']),
  body('message').optional().trim().escape(),
  body('productTypes').optional().toArray(),
  body('capacity').optional().trim().escape(),
];

router.post('/buyer', limit, buyerRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array().map(e => ({ field: e.path, msg: e.msg })) });

  const id = crypto.randomUUID();
  const { name, email, company, phone, country, businessType, plan, products, message } = req.body;
  const productsArr = Array.isArray(products) ? products : (products ? [products] : []);

  try {
    await db.execute(
      `INSERT INTO buyers (id, name, email, company, phone, country, business_type, plan, products, message, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, company, phone, country, businessType, plan, JSON.stringify(productsArr), message || null, 'pending']
    );

    console.log(`[BUYER] ${company} | ${email} | ${plan} - Saved to DB`);
    return res.status(201).json({ success: true, id, message: 'Subscription received. We will contact you within 24h.' });
  } catch (err) {
    console.error('[DB ERROR] Buyer subscription failed:', err);
    return res.status(500).json({ success: false, error: 'Database error. Please try again later.' });
  }
});

router.post('/farmer', limit, farmerRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array().map(e => ({ field: e.path, msg: e.msg })) });

  const id = crypto.randomUUID();
  const { name, email, farmName, phone, country, farmSize, productTypes, plan, capacity, message } = req.body;
  const productTypesArr = Array.isArray(productTypes) ? productTypes : (productTypes ? [productTypes] : []);

  try {
    await db.execute(
      `INSERT INTO farmers (id, name, email, farm_name, phone, country, farm_size, product_types, plan, capacity, message, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, farmName, phone, country, farmSize, JSON.stringify(productTypesArr), plan, capacity || null, message || null, 'pending']
    );

    console.log(`[FARMER] ${farmName} | ${email} | ${plan} - Saved to DB`);
    return res.status(201).json({ success: true, id, message: 'Demande reçue. Nous vous contactons sous 24h.' });
  } catch (err) {
    console.error('[DB ERROR] Farmer subscription failed:', err);
    return res.status(500).json({ success: false, error: 'Database error. Please try again later.' });
  }
});

router.get('/plans', (req, res) => res.json({
  buyers: [
    { id: 'essentiel',     name: 'Essentiel',     price: 149, currency: 'CAD', period: 'month', volume: '500 kg/mois' },
    { id: 'professionnel', name: 'Professionnel', price: 399, currency: 'CAD', period: 'month', volume: '2 000 kg/mois', popular: true },
    { id: 'entreprise',    name: 'Entreprise',    price: 999, currency: 'CAD', period: 'month', volume: 'Illimité' },
  ],
  farmers: [
    { id: 'partenaire',    name: 'Partenaire',    price: 49,  currency: 'CAD', period: 'month' },
    { id: 'pro-ferme',     name: 'Pro Ferme',     price: 99,  currency: 'CAD', period: 'month', popular: true },
    { id: 'premium-ferme', name: 'Premium Ferme', price: 199, currency: 'CAD', period: 'month' },
  ],
}));

module.exports = router;
