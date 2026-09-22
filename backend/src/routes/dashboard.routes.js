const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const NEXT_REWARD_TARGET = 1500; // points needed for the next reward tier

router.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

  const totals = db
    .prepare(`
      SELECT
        COUNT(*) AS total_scans,
        COUNT(CASE WHEN created_at >= datetime('now', 'start of month') THEN 1 END) AS scans_this_month
      FROM scans WHERE user_id = ?
    `)
    .get(req.userId);

  const recent = db
    .prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 3')
    .all(req.userId);

  // "Accuracy" here just means: wasn't flagged low-confidence (<90%).
  // There's no ground-truth labeling in this prototype to check against.
  const accuracyRow = db
    .prepare(`
      SELECT
        COUNT(*) AS n,
        COUNT(CASE WHEN confidence >= 90 THEN 1 END) AS confident
      FROM scans WHERE user_id = ?
    `)
    .get(req.userId);
  const accuracy = accuracyRow.n > 0
    ? Math.round((accuracyRow.confident / accuracyRow.n) * 100)
    : null;

  res.json({
    points: user.points,
    itemsScanned: totals.total_scans,
    itemsThisMonth: totals.scans_this_month,
    accuracy,
    nextRewardTarget: NEXT_REWARD_TARGET,
    pointsToNextReward: Math.max(NEXT_REWARD_TARGET - user.points, 0),
    recentActivity: recent
  });
});

module.exports = router;
