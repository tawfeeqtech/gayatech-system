const express = require('express');
const bulkController = require('../controllers/bulkController');
const vendorController = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Vendor = require('../models/Vendor');

const router = express.Router();

router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Vendor));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Vendor));

router.route('/')
  .get(roleCheck('admin', 'finance', 'accountant'), vendorController.getVendors)
  .post(roleCheck('admin', 'finance'), vendorController.createVendor);

router.route('/:id')
  .get(roleCheck('admin', 'finance', 'accountant'), vendorController.getVendor)
  .put(roleCheck('admin', 'finance'), vendorController.updateVendor)
  .delete(roleCheck('admin'), vendorController.deleteVendor);

module.exports = router;
