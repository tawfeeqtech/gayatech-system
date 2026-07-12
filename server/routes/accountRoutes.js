const express = require('express');
const accountController = require('../controllers/accountController');
const walletRoutes = require('./walletRoutes').nested;
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);
router.use('/:accountId/wallets', walletRoutes);

router.get('/', roleCheck('admin', 'finance', 'accountant'), accountController.getAccounts);
router.get('/:id', roleCheck('admin', 'finance', 'accountant'), accountController.getAccount);
router.get('/:id/movements', roleCheck('admin', 'finance'), accountController.getAccountMovements);
router.post('/', roleCheck('admin'), accountController.createAccount);
router.put('/:id', roleCheck('admin'), accountController.updateAccount);
router.delete('/:id', roleCheck('admin'), accountController.deleteAccount);

module.exports = router;