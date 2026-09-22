// Opens (and if needed, creates) the SQLite database and its schema.
// better-sqlite3 is synchronous — no callbacks/promises needed for queries.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_FILE || './data/cashtrash.db';
const resolvedPath = path.resolve(__dirname, '..', DB_PATH);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    bin TEXT NOT NULL,
    disposal_note TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    distance_km REAL NOT NULL,
    materials TEXT NOT NULL,
    is_open INTEGER NOT NULL DEFAULT 1,
    hours_note TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);
  CREATE INDEX IF NOT EXISTS idx_scans_category ON scans(category);
`);

// Seed sample recycling centers once, on first run only
const centerCount = db.prepare('SELECT COUNT(*) AS n FROM centers').get().n;
if (centerCount === 0) {
  const insertCenter = db.prepare(`
    INSERT INTO centers (name, address, distance_km, materials, is_open, hours_note)
    VALUES (@name, @address, @distance_km, @materials, @is_open, @hours_note)
  `);
  const seedCenters = [
    { name: 'Salt Lake Community Recycling Center', address: 'Sector II, Salt Lake, Kolkata', distance_km: 1.2, materials: 'ewaste,plastic,metal', is_open: 1, hours_note: 'Open · Closes 6:00 PM' },
    { name: 'New Town E-Waste Drop-off', address: 'Action Area I, New Town, Kolkata', distance_km: 3.4, materials: 'ewaste', is_open: 1, hours_note: 'Open · Closes 5:00 PM' },
    { name: 'Sector V Collection Point', address: 'Sector V, Bidhannagar, Kolkata', distance_km: 4.8, materials: 'glass,metal,plastic,paper', is_open: 1, hours_note: 'Open · Closes 7:00 PM' },
    { name: 'Lake Town Material Bank', address: 'VIP Road, Lake Town, Kolkata', distance_km: 6.1, materials: 'paper,plastic', is_open: 0, hours_note: 'Closed · Opens 9:00 AM' },
    { name: 'Dum Dum Civic Collection Center', address: 'Near Dum Dum Metro, Kolkata', distance_km: 7.5, materials: 'ewaste,metal', is_open: 1, hours_note: 'Open · Closes 6:30 PM' }
  ];
  const insertMany = db.transaction((rows) => rows.forEach((row) => insertCenter.run(row)));
  insertMany(seedCenters);
}

module.exports = db;
