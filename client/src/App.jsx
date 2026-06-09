import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
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
          <Route path="clients/*" element={<div>العملاء (قيد التطوير)</div>} />
          <Route path="contracts/*" element={<div>العقود (قيد التطوير)</div>} />
          <Route path="projects/*" element={<div>المشاريع (قيد التطوير)</div>} />
          <Route path="transactions/*" element={<div>المعاملات (قيد التطوير)</div>} />
          <Route path="invoices/*" element={<div>الفواتير (قيد التطوير)</div>} />
          <Route path="accounts/*" element={<div>الحسابات (قيد التطوير)</div>} />
          <Route path="expenses/*" element={<div>المصاريف (قيد التطوير)</div>} />
          <Route path="employees/*" element={<div>الموظفون (قيد التطوير)</div>} />
          <Route path="partners/*" element={<div>الشركاء (قيد التطوير)</div>} />
          <Route path="subscriptions/*" element={<div>الاشتراكات (قيد التطوير)</div>} />
          <Route path="reports/*" element={<div>التقارير (قيد التطوير)</div>} />
          <Route path="settings/*" element={<div>الإعدادات (قيد التطوير)</div>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;