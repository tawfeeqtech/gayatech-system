const express = require('express');
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router({ mergeParams: true });
const allWalletsRouter = express.Router();

router.use(protect);
allWalletsRouter.use(protect);

router.get('/', roleCheck('admin', 'finance', 'accountant'), walletController.getWallets);
allWalletsRouter.get('/', roleCheck('admin', 'finance', 'accountant'), walletController.getAllWallets);
router.post('/', roleCheck('admin'), walletController.createWallet);
router.put('/:id', roleCheck('admin', 'finance', 'accountant'), walletController.updateWallet);
router.delete('/:id', roleCheck('admin'), walletController.deleteWallet);

module.exports = { nested: router, all: allWalletsRouter };