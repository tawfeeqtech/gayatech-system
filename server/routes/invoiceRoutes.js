const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

// الفواتير المتأخرة (قبل /:id)
router.get('/overdue', roleCheck('admin', 'finance'), invoiceController.getOverdueInvoices);

router.get('/', roleCheck('admin', 'finance', 'accountant'), invoiceController.getInvoices);
router.get('/:id', roleCheck('admin', 'finance', 'accountant'), invoiceController.getInvoice);
router.post('/', roleCheck('admin', 'finance', 'accountant'), invoiceController.createInvoice);
router.put('/:id', roleCheck('admin', 'finance'), invoiceController.updateInvoice);
router.patch('/:id/status', roleCheck('admin', 'finance'), invoiceController.updateInvoiceStatus);
router.delete('/:id', roleCheck('admin'), invoiceController.deleteInvoice);

module.exports = router;