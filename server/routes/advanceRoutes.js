const express = require('express');
const ac = require('../controllers/advanceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/pending', roleCheck('admin', 'finance'), ac.getPendingAdvances);
router.get('/', roleCheck('admin', 'finance'), ac.getAdvances);
router.post('/', roleCheck('admin', 'finance'), ac.createAdvance);
router.put('/:id', roleCheck('admin'), ac.updateAdvance);
router.delete('/:id', roleCheck('admin'), ac.deleteAdvance);
router.patch('/:id/approve', roleCheck('admin', 'finance'), ac.approveAdvance);
router.patch('/:id/reject', roleCheck('admin', 'finance'), ac.rejectAdvance);
router.patch('/:id/repay', roleCheck('admin', 'finance'), ac.repayAdvance);

module.exports = router;