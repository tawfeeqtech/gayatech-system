const express = require('express');
const rc = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/monthly-revenue', roleCheck('admin', 'finance'), rc.getMonthlyRevenue);
router.get('/monthly-expenses', roleCheck('admin', 'finance'), rc.getMonthlyExpenses);
router.get('/profit-loss', roleCheck('admin', 'finance'), rc.getProfitLoss);
router.get('/outstanding-debts', roleCheck('admin', 'finance'), rc.getOutstandingDebts);
router.get('/client-balances', roleCheck('admin', 'finance'), rc.getClientBalances);
router.get('/partner-balances', roleCheck('admin', 'finance'), rc.getPartnerBalances);
router.get('/employee-performance', roleCheck('admin', 'pm'), rc.getEmployeePerformance);
router.get('/completed-projects', roleCheck('admin', 'pm'), rc.getCompletedProjects);
router.get('/active-contracts', roleCheck('admin', 'pm'), rc.getActiveContracts);
router.get('/reem-movements', roleCheck('admin', 'finance'), rc.getReemMovements);
router.get('/company-account', roleCheck('admin', 'finance'), rc.getCompanyAccountMovements);
router.get('/income-sources', roleCheck('admin', 'finance'), rc.getIncomeSourcesAnalysis);
router.get('/subscriptions', roleCheck('admin', 'finance'), rc.getSubscriptionsReport);

module.exports = router;