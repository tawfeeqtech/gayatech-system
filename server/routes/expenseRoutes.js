const express = require('express');
const bulkController = require('../controllers/bulkController');
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Expense = require('../models/Expense');

const router = express.Router();

router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Expense));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Expense));

// مسارات خاصة (قبل /:id)
router.get('/by-category', roleCheck('admin', 'finance'), expenseController.getExpensesByCategory);
router.get('/recurring', roleCheck('admin', 'finance'), expenseController.getRecurringExpenses);

router.get('/', roleCheck('admin', 'finance', 'accountant'), expenseController.getExpenses);
router.get('/:id', roleCheck('admin', 'finance', 'accountant'), expenseController.getExpense);
router.post('/', roleCheck('admin', 'finance', 'accountant'), expenseController.createExpense);
router.put('/:id', roleCheck('admin'), expenseController.updateExpense);
router.delete('/:id', roleCheck('admin'), expenseController.deleteExpense);

module.exports = router;