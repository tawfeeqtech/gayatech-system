const cors = require('cors');
const { clientUrl } = require('./env');

const corsOptions = {
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);