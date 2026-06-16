const express = require('express');
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// جميع المسارات تتطلب مصادقة
router.use(protect);

// مسارات القراءة (متاحة لعدة أدوار)
router.get('/', roleCheck('admin', 'finance', 'pm', 'accountant'), clientController.getClients);
router.get('/:id', roleCheck('admin', 'finance', 'pm', 'accountant'), clientController.getClient);
router.get('/:id/stats', roleCheck('admin', 'finance', 'pm'), clientController.getClientStats);

// مسارات الكتابة (محدودة)
router.post('/', roleCheck('admin', 'pm'), clientController.createClient);
router.put('/:id', roleCheck('admin', 'pm'), clientController.updateClient);
router.delete('/:id', roleCheck('admin'), clientController.deleteClient);

router.get('/:id/contracts', roleCheck('admin', 'finance', 'pm'), clientController.getClientContracts);
router.post('/update-all-stats', roleCheck('admin'), clientController.updateAllClientStats);

router.get('/:id/projects', roleCheck('admin', 'finance', 'pm'), clientController.getClientProjects);
router.get('/:id/transactions', roleCheck('admin', 'finance', 'pm', 'accountant'), clientController.getClientTransactions);
module.exports = router;