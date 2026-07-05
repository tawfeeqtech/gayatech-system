const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminDashboard,
  getFinanceDashboard,
  getPMDashboard,
  getAccountantDashboard,
  getEmployeeDashboard
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/finance', authorize('admin', 'finance'), getFinanceDashboard);
router.get('/pm', authorize('admin', 'pm'), getPMDashboard);
router.get('/accountant', authorize('admin', 'accountant'), getAccountantDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;
