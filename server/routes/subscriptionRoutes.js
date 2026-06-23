const express = require('express');
const bulkController = require('../controllers/bulkController');
const sc = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Subscription = require('../models/Subscription');
const router = express.Router();
router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Subscription));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Subscription));

router.get('/expiring-soon', roleCheck('admin', 'finance'), sc.getExpiringSoon);
router.get('/expired', roleCheck('admin', 'finance'), sc.getExpired);
router.get('/', roleCheck('admin', 'finance'), sc.getSubscriptions);
router.post('/', roleCheck('admin'), sc.createSubscription);
router.put('/:id', roleCheck('admin'), sc.updateSubscription);
router.delete('/:id', roleCheck('admin'), sc.deleteSubscription);
router.patch('/:id/renew', roleCheck('admin', 'finance'), sc.renewSubscription);

module.exports = router;