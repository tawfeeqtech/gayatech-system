const express = require('express');
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', roleCheck('admin', 'finance', 'accountant'), walletController.getWallets);
router.post('/', roleCheck('admin'), walletController.createWallet);
router.put('/:id', roleCheck('admin'), walletController.updateWallet);
router.delete('/:id', roleCheck('admin'), walletController.deleteWallet);

module.exports = router;