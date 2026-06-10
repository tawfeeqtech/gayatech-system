const express = require('express');
const router = express.Router();

// Mock endpoint - قيد التطوير
router.get('/', (req, res) => {
  res.json({ message: 'مسار partnerRoutes قيد التطوير حالياً' });
});

module.exports = router;
