// Vercel looks for src/app.js before src/server.js, so point it at the real app.
module.exports = require('./server');
