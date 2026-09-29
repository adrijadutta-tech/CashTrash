const express = require('express');
const Scan = require('../models/Scan.model');
const User = require('../models/User.model');
const { requireAuth } = require('../middleware/auth');
const { getCategoryInfo, CATEGORIES } = require('../utils/classifier');

const router = express.Router();

// The photo is classified in the browser (Teachable Machine model in
// frontend/js/scan.js). The frontend sends the result here as JSON:
//   { category: 'plastic', confidence: 93 }
// and this route looks up the bin/points/disposal info and saves the scan.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { category, confidence } = req.body || {};

    const info = getCategoryInfo(typeof category === 'string' ? category.toLowerCase().trim() : '');
    if (!info) {
      return res.status(400).json({
        error: `Unknown category. Expected one of: ${CATEGORIES.join(', ')}.`
      });
    }

    const conf = Number(confidence);
    if (!Number.isFinite(conf) || conf < 0 || conf > 100) {
      return res.status(400).json({ error: 'Confidence must be a number from 0 to 100.' });
    }

    const scan = new Scan({
      user_id: req.userId,
      item_name: info.label,
      category: info.category,
      bin: info.bin,
      recyclable: info.recyclable,
      disposal_note: info.disposalNote,
      confidence: Math.round(conf),
      points: info.points
    });

    await scan.save();
    await User.findByIdAndUpdate(req.userId, { $inc: { points: info.points } });

    res.status(201).json({ scan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { user_id: req.userId };
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
