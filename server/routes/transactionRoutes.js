const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

// ملخص (يجب أن يكون قبل /:id)
router.get('/summary', roleCheck('admin', 'finance'), transactionController.getTransactionsSummary);

// مسارات أساسية
router.get('/', roleCheck('admin', 'finance', 'accountant'), transactionController.getTransactions);
router.get('/:id', roleCheck('admin', 'finance', 'accountant'), transactionController.getTransaction);
router.post('/', roleCheck('admin', 'finance', 'accountant'), transactionController.createTransaction);
router.put('/:id', roleCheck('admin'), transactionController.updateTransaction);
router.delete('/:id', roleCheck('admin'), transactionController.deleteTransaction);

// توزيع دفعة
router.post('/:id/allocate', roleCheck('admin', 'finance'), transactionController.allocateTransaction);

module.exports = router;