const cors = require('cors');
const { clientUrl } = require('./env');

const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  /\.trycloudflare\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowed = allowedOrigins.some(a => {
      if (a instanceof RegExp) return a.test(origin);
      return a === origin;
    });
    
    if (allowed) return callback(null, true);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);