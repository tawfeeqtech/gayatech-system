const express = require('express');
const bulkController = require('../controllers/bulkController');
const ac = require('../controllers/advanceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Advance = require('../models/Advance');
const router = express.Router();
router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Advance));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Advance));

router.get('/pending', roleCheck('admin', 'finance'), ac.getPendingAdvances);
router.get('/', roleCheck('admin', 'finance'), ac.getAdvances);
router.post('/', roleCheck('admin', 'finance'), ac.createAdvance);
router.put('/:id', roleCheck('admin'), ac.updateAdvance);
router.delete('/:id', roleCheck('admin'), ac.deleteAdvance);
router.patch('/:id/approve', roleCheck('admin', 'finance'), ac.approveAdvance);
router.patch('/:id/reject', roleCheck('admin', 'finance'), ac.rejectAdvance);

module.exports = router;