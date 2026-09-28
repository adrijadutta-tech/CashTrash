const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  item_name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  bin: { type: String, required: true },
  disposal_note: { type: String, required: true },
  confidence: { type: Number, required: true },
  points: { type: Number, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Scan', scanSchema);
