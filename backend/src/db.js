const mongoose = require('mongoose');
const Center = require('./models/RecyclingCenter.model');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cashtrash';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Seed sample recycling centers once, on first run only
    const centerCount = await Center.countDocuments();
    if (centerCount === 0) {
      const seedCenters = [
        { name: 'Salt Lake Community Recycling Center', address: 'Sector II, Salt Lake, Kolkata', distance_km: 1.2, materials: 'ewaste,plastic,metal', is_open: 1, hours_note: 'Open · Closes 6:00 PM' },
        { name: 'New Town E-Waste Drop-off', address: 'Action Area I, New Town, Kolkata', distance_km: 3.4, materials: 'ewaste', is_open: 1, hours_note: 'Open · Closes 5:00 PM' },
        { name: 'Sector V Collection Point', address: 'Sector V, Bidhannagar, Kolkata', distance_km: 4.8, materials: 'glass,metal,plastic,paper', is_open: 1, hours_note: 'Open · Closes 7:00 PM' },
        { name: 'Lake Town Material Bank', address: 'VIP Road, Lake Town, Kolkata', distance_km: 6.1, materials: 'paper,plastic', is_open: 0, hours_note: 'Closed · Opens 9:00 AM' },
        { name: 'Dum Dum Civic Collection Center', address: 'Near Dum Dum Metro, Kolkata', distance_km: 7.5, materials: 'ewaste,metal', is_open: 1, hours_note: 'Open · Closes 6:30 PM' }
      ];
      await Center.insertMany(seedCenters);
      console.log('Seeded initial recycling centers.');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

module.exports = connectDB;
