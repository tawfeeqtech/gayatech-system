const express = require('express');
const router = express.Router();
const { resetSystem } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/system/reset — admin only
router.post('/reset', protect, authorize('admin'), resetSystem);

module.exports = router;
