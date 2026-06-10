const express = require('express');
const ic = require('../controllers/incomeSourceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/', roleCheck('admin', 'finance', 'pm', 'accountant'), ic.getSources);
router.post('/', roleCheck('admin'), ic.createSource);
router.put('/:id', roleCheck('admin'), ic.updateSource);
router.delete('/:id', roleCheck('admin'), ic.deleteSource);

module.exports = router;