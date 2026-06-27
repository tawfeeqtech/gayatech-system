const express = require('express');
const bulkController = require('../controllers/bulkController');
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), transactionController.bulkDeleteTransactions);
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Transaction));

// ملخص (يجب أن يكون قبل /:id)
router.get('/summary', roleCheck('admin', 'finance'), transactionController.getTransactionsSummary);

// مسارات أساسية
router.get('/', roleCheck('admin', 'finance'), transactionController.getTransactions);
router.get('/:id', roleCheck('admin', 'finance'), transactionController.getTransaction);
router.post('/', roleCheck('admin', 'finance'), transactionController.createTransaction);
router.put('/:id', roleCheck('admin'), transactionController.updateTransaction);
router.delete('/:id', roleCheck('admin'), transactionController.deleteTransaction);

// توزيع دفعة
router.post('/:id/allocate', roleCheck('admin', 'finance'), transactionController.allocateTransaction);

module.exports = router;