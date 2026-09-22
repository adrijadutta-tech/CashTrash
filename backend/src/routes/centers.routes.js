const express = require('express');
const db = require('../db');

const router = express.Router();

// Public — no login needed to browse recycling centers
router.get('/', (req, res) => {
  const { search, material } = req.query;

  let rows = db.prepare('SELECT * FROM centers ORDER BY distance_km ASC').all();

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
  }
  if (material && material !== 'all') {
    rows = rows.filter((c) => c.materials.split(',').includes(material));
  }

  const centers = rows.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    distanceKm: c.distance_km,
    materials: c.materials.split(','),
    isOpen: !!c.is_open,
    hoursNote: c.hours_note
  }));

  res.json({ centers });
});

module.exports = router;
