const express = require('express');
const Center = require('../models/RecyclingCenter.model');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, material } = req.query;

    let query = {};
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name: q }, { address: q }];
    }
    if (material && material !== 'all') {
      query.materials = new RegExp(material, 'i');
    }

    const rows = await Center.find(query).sort({ distance_km: 1 });

    const centers = rows.map((c) => ({
      id: c._id,
      name: c.name,
      address: c.address,
      distanceKm: c.distance_km,
      materials: c.materials.split(','),
      isOpen: !!c.is_open,
      hoursNote: c.hours_note
    }));

    res.json({ centers });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
