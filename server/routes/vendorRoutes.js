const express = require('express');
const vendorController = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(vendorController.getVendors)
  .post(roleCheck('admin', 'finance'), vendorController.createVendor);

router.route('/:id')
  .get(vendorController.getVendor)
  .put(roleCheck('admin', 'finance'), vendorController.updateVendor)
  .delete(roleCheck('admin'), vendorController.deleteVendor);

module.exports = router;
