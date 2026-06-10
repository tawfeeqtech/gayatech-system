const express = require('express');
const contractMonthController = require('../controllers/contractMonthController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.post('/', roleCheck('admin', 'pm'), contractMonthController.createContractMonth);
router.put('/:id', roleCheck('admin', 'pm'), contractMonthController.updateContractMonth);
router.patch('/:id/confirm', roleCheck('admin', 'pm', 'finance'), contractMonthController.confirmContractMonth);
router.delete('/:id', roleCheck('admin'), contractMonthController.deleteContractMonth);
router.post('/generate', roleCheck('admin'), contractMonthController.generateAutoMonths);

module.exports = router;