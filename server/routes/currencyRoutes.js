const express = require('express');
const bulkController = require('../controllers/bulkController');
const cc = require('../controllers/currencyController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const CurrencyExchange = require('../models/CurrencyExchange');
const router = express.Router();
router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(CurrencyExchange));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(CurrencyExchange));

router.get('/', roleCheck('admin', 'finance'), cc.getExchanges);
router.post('/', roleCheck('admin', 'finance'), cc.createExchange);
router.put('/:id', roleCheck('admin'), cc.updateExchange);
router.delete('/:id', roleCheck('admin'), cc.deleteExchange);

module.exports = router;