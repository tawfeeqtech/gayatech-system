import api from './axios';

const reportAPI = {
  monthlyRevenue: (params) => api.get('/reports/monthly-revenue', { params }),
  monthlyExpenses: (params) => api.get('/reports/monthly-expenses', { params }),
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  outstandingDebts: () => api.get('/reports/outstanding-debts'),
  clientBalances: () => api.get('/reports/client-balances'),
  partnerBalances: () => api.get('/reports/partner-balances'),
  employeePerformance: () => api.get('/reports/employee-performance'),
  completedProjects: () => api.get('/reports/completed-projects'),
  activeContracts: () => api.get('/reports/active-contracts'),
  reemMovements: () => api.get('/reports/reem-movements'),
  companyAccount: () => api.get('/reports/company-account'),
  incomeSources: (params) => api.get('/reports/income-sources', { params }),
  subscriptions: () => api.get('/reports/subscriptions'),
};

export default reportAPI;