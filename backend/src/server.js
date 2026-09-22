require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const centerRoutes = require('./routes/centers.routes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow no-origin requests (curl, Postman, file:// pages) and any
    // explicitly listed frontend origin.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/centers', centerRoutes);

// 404 for unmatched API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Centralized error handler — catches multer errors, JSON parse errors, etc.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CashTrash API running at http://localhost:${PORT}`);
});
