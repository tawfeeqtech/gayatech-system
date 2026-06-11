import React from 'react';
import { Menu, Layout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ProjectOutlined,
  DollarOutlined,
  SolutionOutlined,
  BankOutlined,
  WalletOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  BellOutlined,
  BarChartOutlined,
  SettingOutlined,
  UploadOutlined,
  PercentageOutlined,
  MoneyCollectOutlined,
  FundOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

// ألوان الهوية
const COLORS = {
  BRAND_PRIMARY: "#2d6c5b",
  BRAND_SECONDARY: "#3d8b74",
  BRAND_LIGHT: "#e8f5e9",
  BRAND_ACCENT: "#ffd54f",
  BRAND_DARK: "#1b4332",
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // الأقسام الرئيسية (قابلة للطي)
  const menuItems = [
    // العنصر الوحيد بدون طي
    { key: '/', icon: <DashboardOutlined />, label: 'لوحة التحكم' },

    // 📋 العملاء والعقود (قسم قابل للطي)
    {
      key: 'clients-contracts',
      icon: <UserOutlined />,
      label: 'العملاء والعقود',
      children: [
        { key: '/clients', icon: <UserOutlined />, label: 'العملاء' },
        { key: '/contracts', icon: <FileTextOutlined />, label: 'العقود الشهرية' },
        { key: '/projects', icon: <ProjectOutlined />, label: 'المشاريع' },
      ]
    },

    // 💰 المالية (قسم قابل للطي)
    {
      key: 'finance',
      icon: <MoneyCollectOutlined />,
      label: 'المالية',
      children: [
        { key: '/transactions', icon: <DollarOutlined />, label: 'المعاملات المالية' },
        { key: '/invoices', icon: <SolutionOutlined />, label: 'الفواتير' },
        { key: '/accounts', icon: <BankOutlined />, label: 'الحسابات والمحافظ' },
        { key: '/expenses', icon: <WalletOutlined />, label: 'المصاريف' },
      ]
    },

    // 👔 الموارد البشرية (قسم قابل للطي)
    {
      key: 'hr',
      icon: <TeamOutlined />,
      label: 'الموارد البشرية',
      children: [
        { key: '/employees', icon: <TeamOutlined />, label: 'الموظفون' },
        { key: '/salaries', icon: <DollarOutlined />, label: 'الرواتب' },
        { key: '/advances', icon: <WalletOutlined />, label: 'السلف' },
      ]
    },

    // 🤝 الشركاء والاشتراكات (قسم قابل للطي)
    {
      key: 'partners',
      icon: <UsergroupAddOutlined />,
      label: 'الشركاء والاشتراكات',
      children: [
        { key: '/partners', icon: <UsergroupAddOutlined />, label: 'الشركاء والتمويل' },
        { key: '/subscriptions', icon: <BellOutlined />, label: 'الاشتراكات' },
        { key: '/currency-exchange', icon: <PercentageOutlined />, label: 'تحويل العملات' },
      ]
    },

    // 📈 التقارير والاستيراد (قسم قابل للطي)
    {
      key: 'reports-data',
      icon: <FundOutlined />,
      label: 'التقارير والبيانات',
      children: [
        { key: '/reports', icon: <BarChartOutlined />, label: 'التقارير' },
        { key: '/import', icon: <UploadOutlined />, label: 'استيراد البيانات' },
      ]
    },

    // ⚙️ الإعدادات (قسم قابل للطي)
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'الإعدادات',
      children: [
        { key: '/settings', label: 'إعدادات النظام' },
        { key: '/settings/users', label: 'إدارة المستخدمين' },
      ]
    },
  ];

  // تحديد المسار النشط
  const getActiveKey = () => {
    const path = location.pathname;
    
    if (path === '/') return '/';
    if (path === '/settings/users') return '/settings/users';
    if (path === '/settings') return '/settings';
    if (path === '/currency-exchange') return '/currency-exchange';
    if (path === '/import') return '/import';
    
    return path;
  };

  // تحديد الأقسام المفتوحة تلقائياً حسب المسار الحالي
  const getOpenKeys = () => {
    const path = location.pathname;
    const openSections = [];

    // العملاء والعقود
    if (['/clients', '/contracts', '/projects'].includes(path)) {
      openSections.push('clients-contracts');
    }
    
    // المالية
    if (['/transactions', '/invoices', '/accounts', '/expenses'].includes(path)) {
      openSections.push('finance');
    }
    
    // الموارد البشرية
    if (['/employees', '/salaries', '/advances'].includes(path)) {
      openSections.push('hr');
    }
    
    // الشركاء والاشتراكات
    if (['/partners', '/subscriptions', '/currency-exchange'].includes(path)) {
      openSections.push('partners');
    }
    
    // التقارير والبيانات
    if (['/reports', '/import'].includes(path)) {
      openSections.push('reports-data');
    }
    
    // الإعدادات
    if (path === '/settings' || path === '/settings/users') {
      openSections.push('settings');
    }
    
    return openSections;
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={280}
      style={{
        backgroundColor: COLORS.BRAND_DARK,
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* الشعار */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '64px',
          borderBottom: `1px solid ${COLORS.BRAND_PRIMARY}`,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '18px',
          fontFamily: 'Cairo, sans-serif',
          background: `linear-gradient(135deg, ${COLORS.BRAND_PRIMARY}, ${COLORS.BRAND_SECONDARY})`,
          margin: '0 0 8px 0',
        }}
      >
        🏢 نظام غايتك المالي
      </div>

      {/* القائمة */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        defaultOpenKeys={getOpenKeys()}
        onClick={({ key }) => navigate(key)}
        style={{
          backgroundColor: COLORS.BRAND_DARK,
          fontFamily: 'Cairo, sans-serif',
          paddingTop: '8px',
          borderRight: 'none',
        }}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;