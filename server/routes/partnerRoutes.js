const express = require('express');
const bulkController = require('../controllers/bulkController');
const pc = require('../controllers/partnerController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Partner = require('../models/Partner');
const router = express.Router();
router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Partner));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Partner));

router.get('/', roleCheck('admin', 'finance'), pc.getPartners);
router.get('/:id', roleCheck('admin', 'finance'), pc.getPartner);
router.post('/', roleCheck('admin'), pc.createPartner);
router.put('/:id', roleCheck('admin'), pc.updatePartner);
router.delete('/:id', roleCheck('admin'), pc.deletePartner);
router.get('/:id/fundings', roleCheck('admin', 'finance'), pc.getPartnerFundings);
router.post('/:id/fundings', roleCheck('admin', 'finance'), pc.createFunding);

module.exports = router;