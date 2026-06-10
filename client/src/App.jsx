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
import ReportList from './pages/Reports/ReportList';
import MonthlyRevenue from './pages/Reports/MonthlyRevenue';
import ProfitLoss from './pages/Reports/ProfitLoss';
import OutstandingDebts from './pages/Reports/OutstandingDebts';
import ClientBalances from './pages/Reports/ClientBalances';
import ActiveContracts from './pages/Reports/ActiveContracts';
import SubscriptionsReport from './pages/Reports/SubscriptionsReport';

import CompletedProjects from './pages/Reports/CompletedProjects';
import PartnerBalances from './pages/Reports/PartnerBalances';
import EmployeePerformance from './pages/Reports/EmployeePerformance';
import { ReemMovements, CompanyAccount } from './pages/Reports/AccountMovements';
import IncomeSources from './pages/Reports/IncomeSources';
import MonthlyExpenses from './pages/Reports/MonthlyExpenses';

import { useAuth } from './hooks/useAuth';

// مكون حماية المسارات
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
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
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/edit/:id" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientDetail />} />

          <Route path="contracts" element={<ContractList />} />
          <Route path="contracts/new" element={<ContractForm />} />
          <Route path="contracts/edit/:id" element={<ContractForm />} />
          <Route path="contracts/:id" element={<ContractDetail />} />

          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectForm />} />
          <Route path="projects/edit/:id" element={<ProjectForm />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          
          <Route path="transactions" element={<TransactionList />} />
          <Route path="transactions/new" element={<TransactionForm />} />

          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<InvoiceForm />} />

          <Route path="expenses" element={<ExpenseList />} />
          <Route path="expenses/new" element={<ExpenseForm />} />

          <Route path="accounts" element={<AccountsOverview />} />

          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/new" element={<EmployeeForm />} />
          <Route path="employees/edit/:id" element={<EmployeeForm />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />

          <Route path="salaries" element={<SalaryList />} />
          <Route path="salaries/new" element={<SalaryForm />} />
          
          <Route path="advances" element={<AdvanceList />} />
          <Route path="advances/new" element={<AdvanceForm />} />

          <Route path="partners" element={<PartnerList />} />
          <Route path="partners/new" element={<PartnerForm />} />
          <Route path="partners/:id" element={<PartnerDetail />} />

          <Route path="subscriptions" element={<SubscriptionList />} />
          <Route path="subscriptions/new" element={<SubscriptionForm />} />

          <Route path="currency-exchange" element={<CurrencyExchangeList />} />
          <Route path="import" element={<ImportData />} />

          <Route path="reports" element={<ReportList />} />
          <Route path="reports/monthly-revenue" element={<MonthlyRevenue />} />
          <Route path="reports/profit-loss" element={<ProfitLoss />} />
          <Route path="reports/outstanding-debts" element={<OutstandingDebts />} />
          <Route path="reports/client-balances" element={<ClientBalances />} />
          <Route path="reports/active-contracts" element={<ActiveContracts />} />
          <Route path="reports/subscriptions" element={<SubscriptionsReport />} />

          <Route path="reports/monthly-expenses" element={<MonthlyExpenses />} />
          <Route path="reports/completed-projects" element={<CompletedProjects />} />
          <Route path="reports/partner-balances" element={<PartnerBalances />} />
          <Route path="reports/employee-performance" element={<EmployeePerformance />} />
          <Route path="reports/reem-movements" element={<ReemMovements />} />
          <Route path="reports/company-account" element={<CompanyAccount />} />
          <Route path="reports/income-sources" element={<IncomeSources />} />

          
          <Route path="settings" element={<SystemSettings />} />
          <Route path="settings/users" element={<UserManagement />} />

        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;