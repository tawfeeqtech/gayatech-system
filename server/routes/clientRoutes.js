const express = require('express');
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// جميع المسارات تتطلب مصادقة
router.use(protect);

// مسارات القراءة (متاحة لعدة أدوار)
router.get('/', roleCheck('admin', 'pm'), clientController.getClients);
router.get('/:id', roleCheck('admin', 'pm'), clientController.getClient);
router.get('/:id/stats', roleCheck('admin', 'finance'), clientController.getClientStats);

// مسارات الكتابة (محدودة)
router.post('/', roleCheck('admin', 'pm'), clientController.createClient);
router.put('/:id', roleCheck('admin', 'pm'), clientController.updateClient);
router.delete('/:id', roleCheck('admin'), clientController.deleteClient);

router.get('/:id/contracts', roleCheck('admin', 'pm'), clientController.getClientContracts);
router.post('/update-all-stats', roleCheck('admin'), clientController.updateAllClientStats);

router.get('/:id/projects', roleCheck('admin', 'pm'), clientController.getClientProjects);
router.get('/:id/transactions', roleCheck('admin', 'pm'), clientController.getClientTransactions);
module.exports = router;