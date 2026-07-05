const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminDashboard,
  getFinanceDashboard,
  getPMDashboard,
  getAccountantDashboard,
  getEmployeeDashboard,
  getNotifications,
  getUnreadCount,
  getDashboardExport
} = require('../controllers/dashboardController');

router.use(protect);

// لوحات التحكم حسب الدور
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/finance', authorize('admin', 'finance'), getFinanceDashboard);
router.get('/pm', authorize('admin', 'pm'), getPMDashboard);
router.get('/accountant', authorize('admin', 'accountant'), getAccountantDashboard);
router.get('/employee', getEmployeeDashboard);

// الإشعارات الحية
router.get('/notifications', getNotifications);
router.get('/unread-count', getUnreadCount);

// تصدير
router.get('/export', authorize('admin', 'finance'), getDashboardExport);

module.exports = router;
