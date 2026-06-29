import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientList from './pages/Clients/ClientList';
import ClientForm from './pages/Clients/ClientForm';
import ClientDetail from './pages/Clients/ClientDetail';
import ContractList from './pages/Contracts/ContractList';
import ContractForm from './pages/Contracts/ContractForm';
import ContractDetail from './pages/Contracts/ContractDetail';
import ProjectList from './pages/Projects/ProjectList';
import ProjectForm from './pages/Projects/ProjectForm';
import ProjectDetail from './pages/Projects/ProjectDetail';
import TransactionList from './pages/Transactions/TransactionList';
import TransactionForm from './pages/Transactions/TransactionForm';
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import ExpenseList from './pages/Expenses/ExpenseList';
import ExpenseForm from './pages/Expenses/ExpenseForm';
import VendorList from './pages/Vendors/VendorList';
import AccountsOverview from './pages/Accounts/AccountsOverview';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import SalaryList from './pages/Salaries/SalaryList';
import SalaryForm from './pages/Salaries/SalaryForm';
import AdvanceList from './pages/Advances/AdvanceList';
import AdvanceForm from './pages/Advances/AdvanceForm';
import PartnerList from './pages/Partners/PartnerList';
import PartnerForm from './pages/Partners/PartnerForm';
import PartnerDetail from './pages/Partners/PartnerDetail';
import SubscriptionList from './pages/Subscriptions/SubscriptionList';
import SubscriptionForm from './pages/Subscriptions/SubscriptionForm';
import CurrencyExchangeList from './pages/CurrencyExchange/CurrencyExchangeList';
import ImportData from './pages/Import/ImportData';
import UserManagement from './pages/Settings/UserManagement';
import SystemSettings from './pages/Settings/SystemSettings';
import CurrenciesManagement from './pages/Settings/CurrenciesManagement';
import ReportList from './pages/Reports/ReportList';
import TransactionDetail from './pages/Transactions/TransactionDetail';
import MonthlyRevenue from './pages/Reports/MonthlyRevenue';
import ProfitLoss from './pages/Reports/ProfitLoss';
import OutstandingDebts from './pages/Reports/OutstandingDebts';
import ClientBalances from './pages/Reports/ClientBalances';
import ActiveContracts from './pages/Reports/ActiveContracts';
import SubscriptionsReport from './pages/Reports/SubscriptionsReport';
import PageTitleUpdater from './components/layout/PageTitleUpdater';
import NetworkStatus from './components/ui/NetworkStatus';
import CompletedProjects from './pages/Reports/CompletedProjects';
import PartnerBalances from './pages/Reports/PartnerBalances';
import EmployeePerformance from './pages/Reports/EmployeePerformance';
import { ReemMovements, CompanyAccount } from './pages/Reports/AccountMovements';
import IncomeSources from './pages/Reports/IncomeSources';
import MonthlyExpenses from './pages/Reports/MonthlyExpenses';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import MySalary from './pages/Employee/MySalary';

import { useAuth } from './hooks/useAuth';

// صلاحيات المسارات حسب الدور
const ROUTE_ROLES = {
  '/': ['admin','finance','pm','accountant','employee'],
  '/clients': ['admin','pm'],
  '/contracts': ['admin','pm'],
  '/projects': ['admin','pm'],
  '/transactions': ['admin','finance'],
  '/invoices': ['admin','finance','accountant'],
  '/expenses': ['admin','finance','accountant'],
  '/vendors': ['admin','finance','accountant'],
  '/accounts': ['admin','finance','accountant'],
  '/employees': ['admin','finance','pm'],
  '/salaries': ['admin','finance','employee'],
  '/my-salary': ['admin','finance','employee'],
  '/advances': ['admin','finance'],
  '/partners': ['admin','finance'],
  '/subscriptions': ['admin','finance'],
  '/currency-exchange': ['admin','finance'],
  '/reports': ['admin','finance','pm'],
  '/import': ['admin','finance'],
  '/settings': ['admin'],
  '/settings/users': ['admin'],
  '/settings/currencies': ['admin'],
};

// التحقق من صلاحية المسار للدور
const hasRouteAccess = (pathname, role) => {
  // البحث عن تطابق تام أولاً
  if (ROUTE_ROLES[pathname]) {
    return ROUTE_ROLES[pathname].includes(role);
  }
  // البحث عن تطابق جزئي (للمسارات الديناميكية)
  for (const [pattern, roles] of Object.entries(ROUTE_ROLES)) {
    if (pattern.endsWith('*')) {
      const basePattern = pattern.slice(0, -1);
      if (pathname.startsWith(basePattern)) {
        return roles.includes(role);
      }
    }
  }
  return ROUTE_ROLES['/']?.includes(role) || false;
};

// مكون حماية المسارات
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        fontFamily: 'Cairo, sans-serif',
        textAlign: 'center',
        padding: '20px',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>⛔</div>
        <h1 style={{ color: '#dc2626', marginBottom: '10px', fontWeight: 700 }}>غير مصرح</h1>
        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px' }}>
          ليس لديك صلاحية الوصول إلى هذه الصفحة. دورك الحالي لا يسمح بعرض هذه البيانات.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          يرجى التواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
        </p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Cairo, sans-serif',
          },
        }}
      />
      <PageTitleUpdater />
      <NetworkStatus />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          
          <Route path="clients" element={<ProtectedRoute allowedRoles={['admin','pm']}><ClientList /></ProtectedRoute>} />
          <Route path="clients/new" element={<ProtectedRoute allowedRoles={['admin','pm']}><ClientForm /></ProtectedRoute>} />
          <Route path="clients/edit/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ClientForm /></ProtectedRoute>} />
          <Route path="clients/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ClientDetail /></ProtectedRoute>} />

          <Route path="contracts" element={<ProtectedRoute allowedRoles={['admin','pm']}><ContractList /></ProtectedRoute>} />
          <Route path="contracts/new" element={<ProtectedRoute allowedRoles={['admin','pm']}><ContractForm /></ProtectedRoute>} />
          <Route path="contracts/edit/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ContractForm /></ProtectedRoute>} />
          <Route path="contracts/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ContractDetail /></ProtectedRoute>} />

          <Route path="projects" element={<ProtectedRoute allowedRoles={['admin','pm']}><ProjectList /></ProtectedRoute>} />
          <Route path="projects/new" element={<ProtectedRoute allowedRoles={['admin','pm']}><ProjectForm /></ProtectedRoute>} />
          <Route path="projects/edit/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ProjectForm /></ProtectedRoute>} />
          <Route path="projects/:id" element={<ProtectedRoute allowedRoles={['admin','pm']}><ProjectDetail /></ProtectedRoute>} />

          <Route path="transactions/new" element={<ProtectedRoute allowedRoles={['admin','finance']}><TransactionForm /></ProtectedRoute>} />
          <Route path="transactions/edit/:id" element={<ProtectedRoute allowedRoles={['admin','finance']}><TransactionForm /></ProtectedRoute>} />
          <Route path="transactions/:id" element={<ProtectedRoute allowedRoles={['admin','finance']}><TransactionDetail /></ProtectedRoute>} />
          <Route path="transactions" element={<ProtectedRoute allowedRoles={['admin','finance']}><TransactionList /></ProtectedRoute>} />

          <Route path="invoices" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><InvoiceList /></ProtectedRoute>} />
          <Route path="invoices/new" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><InvoiceForm /></ProtectedRoute>} />
          <Route path="invoices/edit/:id" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><InvoiceForm /></ProtectedRoute>} />
          <Route path="invoices/:id" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><InvoiceDetail /></ProtectedRoute>} />

          <Route path="expenses" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><ExpenseList /></ProtectedRoute>} />
          <Route path="expenses/new" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><ExpenseForm /></ProtectedRoute>} />
          <Route path="vendors" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><VendorList /></ProtectedRoute>} />

          <Route path="accounts" element={<ProtectedRoute allowedRoles={['admin','finance','accountant']}><AccountsOverview /></ProtectedRoute>} />

          <Route path="employees" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><EmployeeList /></ProtectedRoute>} />
          <Route path="employees/new" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><EmployeeForm /></ProtectedRoute>} />
          <Route path="employees/edit/:id" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><EmployeeForm /></ProtectedRoute>} />
          <Route path="employees/:id" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><EmployeeDetail /></ProtectedRoute>} />

          <Route path="salaries" element={<ProtectedRoute allowedRoles={['admin','finance','employee']}><SalaryList /></ProtectedRoute>} />
          <Route path="salaries/new" element={<ProtectedRoute allowedRoles={['admin','finance']}><SalaryForm /></ProtectedRoute>} />
          <Route path="my-salary" element={<ProtectedRoute allowedRoles={['admin','finance','employee']}><MySalary /></ProtectedRoute>} />

          <Route path="advances" element={<ProtectedRoute allowedRoles={['admin','finance']}><AdvanceList /></ProtectedRoute>} />
          <Route path="advances/new" element={<ProtectedRoute allowedRoles={['admin','finance']}><AdvanceForm /></ProtectedRoute>} />

          <Route path="partners" element={<ProtectedRoute allowedRoles={['admin','finance']}><PartnerList /></ProtectedRoute>} />
          <Route path="partners/new" element={<ProtectedRoute allowedRoles={['admin','finance']}><PartnerForm /></ProtectedRoute>} />
          <Route path="partners/:id" element={<ProtectedRoute allowedRoles={['admin','finance']}><PartnerDetail /></ProtectedRoute>} />

          <Route path="subscriptions" element={<ProtectedRoute allowedRoles={['admin','finance']}><SubscriptionList /></ProtectedRoute>} />
          <Route path="subscriptions/new" element={<ProtectedRoute allowedRoles={['admin','finance']}><SubscriptionForm /></ProtectedRoute>} />
          <Route path="subscriptions/edit/:id" element={<ProtectedRoute allowedRoles={['admin','finance']}><SubscriptionForm /></ProtectedRoute>} />

          <Route path="currency-exchange" element={<ProtectedRoute allowedRoles={['admin','finance']}><CurrencyExchangeList /></ProtectedRoute>} />
          <Route path="import" element={<ProtectedRoute allowedRoles={['admin','finance']}><ImportData /></ProtectedRoute>} />

          <Route path="reports" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><ReportList /></ProtectedRoute>} />
          <Route path="reports/monthly-revenue" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><MonthlyRevenue /></ProtectedRoute>} />
          <Route path="reports/profit-loss" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><ProfitLoss /></ProtectedRoute>} />
          <Route path="reports/outstanding-debts" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><OutstandingDebts /></ProtectedRoute>} />
          <Route path="reports/client-balances" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><ClientBalances /></ProtectedRoute>} />
          <Route path="reports/active-contracts" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><ActiveContracts /></ProtectedRoute>} />
          <Route path="reports/subscriptions" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><SubscriptionsReport /></ProtectedRoute>} />
          <Route path="reports/monthly-expenses" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><MonthlyExpenses /></ProtectedRoute>} />
          <Route path="reports/completed-projects" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><CompletedProjects /></ProtectedRoute>} />
          <Route path="reports/partner-balances" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><PartnerBalances /></ProtectedRoute>} />
          <Route path="reports/employee-performance" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><EmployeePerformance /></ProtectedRoute>} />
          <Route path="reports/reem-movements" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><ReemMovements /></ProtectedRoute>} />
          <Route path="reports/company-account" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><CompanyAccount /></ProtectedRoute>} />
          <Route path="reports/income-sources" element={<ProtectedRoute allowedRoles={['admin','finance','pm']}><IncomeSources /></ProtectedRoute>} />

          <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute>} />
          <Route path="settings/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="settings/currencies" element={<ProtectedRoute allowedRoles={['admin']}><CurrenciesManagement /></ProtectedRoute>} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;