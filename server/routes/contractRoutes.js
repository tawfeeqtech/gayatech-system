const express = require('express');
const bulkController = require('../controllers/bulkController');
const contractController = require('../controllers/contractController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Contract = require('../models/Contract');

const router = express.Router();

router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Contract));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Contract));

router.get('/', roleCheck('admin', 'pm'), contractController.getContracts);
router.get('/:id', roleCheck('admin', 'pm'), contractController.getContract);
router.get('/:id/months', roleCheck('admin', 'pm'), contractController.getContractMonths);
router.post('/', roleCheck('admin', 'pm'), contractController.createContract);
router.put('/:id', roleCheck('admin', 'pm'), contractController.updateContract);
router.patch('/:id/status', roleCheck('admin', 'pm'), contractController.updateContractStatus);
router.delete('/:id', roleCheck('admin'), contractController.deleteContract);

module.exports = router;