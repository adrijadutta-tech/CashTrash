const express = require('express');
const multer = require('multer');
const Scan = require('../models/Scan.model');
const User = require('../models/User.model');
const { requireAuth } = require('../middleware/auth');
const { classifyImage } = require('../utils/classifier');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo was uploaded (expected field name "photo").' });
    }

    const result = classifyImage(req.file.buffer);

    const scan = new Scan({
      user_id: req.userId,
      item_name: result.itemName,
      category: result.category,
      bin: result.bin,
      disposal_note: result.disposalNote,
      confidence: result.confidence,
      points: result.points
    });
    
    await scan.save();
    await User.findByIdAndUpdate(req.userId, { $inc: { points: result.points } });

    res.status(201).json({ scan });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = { user_id: req.userId };
    if (type && type !== 'all') {
      query.category = type;
    }
    
    const scans = await Scan.find(query).sort({ created_at: -1 });
    res.json({ scans });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
