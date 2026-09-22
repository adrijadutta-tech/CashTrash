const express = require('express');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { classifyImage } = require('../utils/classifier');

const router = express.Router();

// Photos are only hashed for the mock classifier, never written to disk —
// keeping them in memory is enough and avoids managing an uploads folder.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

// POST /api/scans — upload a photo, get back the identified item + bin + points
router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo was uploaded (expected field name "photo").' });
  }

  const result = classifyImage(req.file.buffer);

  const insert = db.prepare(`
    INSERT INTO scans (user_id, item_name, category, bin, disposal_note, confidence, points)
    VALUES (@user_id, @item_name, @category, @bin, @disposal_note, @confidence, @points)
  `);
  const info = insert.run({
    user_id: req.userId,
    item_name: result.itemName,
    category: result.category,
    bin: result.bin,
    disposal_note: result.disposalNote,
    confidence: result.confidence,
    points: result.points
  });

  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(result.points, req.userId);

  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ scan });
});

// GET /api/scans?type=plastic — this user's scan history, newest first
router.get('/', requireAuth, (req, res) => {
  const { type } = req.query;

  const scans = type && type !== 'all'
    ? db.prepare('SELECT * FROM scans WHERE user_id = ? AND category = ? ORDER BY created_at DESC').all(req.userId, type)
    : db.prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);

  res.json({ scans });
});

module.exports = router;
