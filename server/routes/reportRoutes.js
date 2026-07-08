const express = require('express');
const rc = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/monthly-revenue', roleCheck('admin', 'finance', 'pm'), rc.getMonthlyRevenue);
router.get('/monthly-expenses', roleCheck('admin', 'finance', 'pm'), rc.getMonthlyExpenses);
router.get('/profit-loss', roleCheck('admin', 'finance', 'pm'), rc.getProfitLoss);
router.get('/outstanding-debts', roleCheck('admin', 'finance', 'pm'), rc.getOutstandingDebts);
router.get('/client-balances', roleCheck('admin', 'finance', 'pm'), rc.getClientBalances);
router.get('/partner-balances', roleCheck('admin', 'finance', 'pm'), rc.getPartnerBalances);
router.get('/employee-performance', roleCheck('admin', 'finance', 'pm'), rc.getEmployeePerformance);
router.get('/completed-projects', roleCheck('admin', 'pm'), rc.getCompletedProjects);
router.get('/active-contracts', roleCheck('admin', 'pm'), rc.getActiveContracts);
router.get('/reem-movements', roleCheck('admin', 'finance', 'pm'), rc.getReemMovements);
router.get('/company-account', roleCheck('admin', 'finance', 'pm'), rc.getCompanyAccountMovements);
router.get('/income-sources', roleCheck('admin', 'finance', 'pm'), rc.getIncomeSourcesAnalysis);
router.get('/subscriptions', roleCheck('admin', 'finance', 'pm'), rc.getSubscriptionsReport);

module.exports = router;
