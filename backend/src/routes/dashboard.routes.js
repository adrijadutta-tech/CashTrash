const express = require('express');
const User = require('../models/User.model');
const Scan = require('../models/Scan.model');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const NEXT_REWARD_TARGET = 1500;

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalScans = await Scan.countDocuments({ user_id: req.userId });
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const scansThisMonth = await Scan.countDocuments({ 
      user_id: req.userId, 
      created_at: { $gte: startOfMonth } 
    });

    const recent = await Scan.find({ user_id: req.userId }).sort({ created_at: -1 }).limit(3);

    const confidentCount = await Scan.countDocuments({ user_id: req.userId, confidence: { $gte: 90 } });
    
    const accuracy = totalScans > 0
      ? Math.round((confidentCount / totalScans) * 100)
      : null;

    res.json({
      points: user.points,
      itemsScanned: totalScans,
      itemsThisMonth: scansThisMonth,
      accuracy,
      nextRewardTarget: NEXT_REWARD_TARGET,
      pointsToNextReward: Math.max(NEXT_REWARD_TARGET - user.points, 0),
      recentActivity: recent
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
