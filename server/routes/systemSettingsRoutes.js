const express = require('express');
const settingsController = require('../controllers/systemSettingsController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(settingsController.getSettings)
  .put(roleCheck('admin'), settingsController.updateSettings);

module.exports = router;
