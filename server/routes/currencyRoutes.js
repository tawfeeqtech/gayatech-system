const express = require('express');
const cc = require('../controllers/currencyController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/', roleCheck('admin', 'finance'), cc.getExchanges);
router.post('/', roleCheck('admin', 'finance'), cc.createExchange);
router.put('/:id', roleCheck('admin'), cc.updateExchange);

module.exports = router;