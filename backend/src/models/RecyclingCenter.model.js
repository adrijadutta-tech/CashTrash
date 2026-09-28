const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  distance_km: { type: Number, required: true },
  materials: { type: String, required: true },
  is_open: { type: Number, default: 1 },
  hours_note: { type: String, required: true }
});

module.exports = mongoose.model('Center', centerSchema);
