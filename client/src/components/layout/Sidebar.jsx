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

// ألوان الهوية الجديدة (SaaS Dark Theme)
const COLORS = {
  BRAND_PRIMARY: "#2563eb", // Blue 600
  BRAND_SECONDARY: "#3b82f6", // Blue 500
  BRAND_LIGHT: "#f1f5f9", // Slate 100
  BRAND_ACCENT: "#60a5fa", // Blue 400
  BRAND_DARK: "#0f172a", // Slate 900
  BRAND_HOVER: "#1e293b", // Slate 800
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // الأقسام الرئيسية (قابلة للطي)
  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'لوحة التحكم' },

    // 📋 العملاء والعقود
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

    // 💰 المالية
    {
      key: 'finance',
      icon: <MoneyCollectOutlined />,
      label: 'المالية',
      children: [
        { key: '/transactions', icon: <DollarOutlined />, label: 'المعاملات المالية' },
        { key: '/invoices', icon: <SolutionOutlined />, label: 'الفواتير' },
        { key: '/accounts', icon: <BankOutlined />, label: 'الحسابات والمحافظ' },
        { key: '/expenses', icon: <WalletOutlined />, label: 'المصاريف' },
        { key: '/vendors', icon: <UsergroupAddOutlined />, label: 'المزودون' },
      ]
    },

    // 👔 الموارد البشرية
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

    // 🤝 الشركاء والاشتراكات
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

    // 📈 التقارير والاستيراد
    {
      key: 'reports-data',
      icon: <FundOutlined />,
      label: 'التقارير والبيانات',
      children: [
        { key: '/reports', icon: <BarChartOutlined />, label: 'التقارير' },
        { key: '/import', icon: <UploadOutlined />, label: 'استيراد البيانات' },
      ]
    },

    // ⚙️ الإعدادات
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'الإعدادات',
      children: [
        { key: '/settings', label: 'إعدادات النظام' },
        { key: '/settings/users', label: 'إدارة المستخدمين' },
        { key: '/settings/currencies', label: 'إدارة العملات' },
      ]
    },
  ];

  // تحديد العنصر الفرعي النشط الذكي
  const getActiveKey = () => {
    const path = location.pathname;
    
    if (path === '/') return '/';

    // البحث في القائمة عن عنصر يبدأ به الرابط الحالي
    for (const item of menuItems) {
      if (item.children) {
        const activeChild = item.children.find(child => path.startsWith(child.key));
        if (activeChild) return activeChild.key;
      }
    }
    
    return path;
  };

  // تحديد القسم الأب المفتوح تلقائياً
  const getOpenKeys = () => {
    const path = location.pathname;
    const openSections = [];

    // فحص العملاء والعقود (مثال: /contracts أو /contracts/new)
    if (path.startsWith('/clients') || path.startsWith('/contracts') || path.startsWith('/projects')) {
      openSections.push('clients-contracts');
    }
    
    // المالية
    if (path.startsWith('/transactions') || path.startsWith('/invoices') || path.startsWith('/accounts') || path.startsWith('/expenses') || path.startsWith('/vendors')) {
      openSections.push('finance');
    }
    
    // الموارد البشرية
    if (path.startsWith('/employees') || path.startsWith('/salaries') || path.startsWith('/advances')) {
      openSections.push('hr');
    }
    
    // الشركاء والاشتراكات
    if (path.startsWith('/partners') || path.startsWith('/subscriptions') || path.startsWith('/currency-exchange')) {
      openSections.push('partners');
    }
    
    // التقارير والبيانات
    if (path.startsWith('/reports') || path.startsWith('/import')) {
      openSections.push('reports-data');
    }
    
    // الإعدادات
    if (path.startsWith('/settings')) {
      openSections.push('settings');
    }
    
    return openSections;
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={260}
      className="shadow-xl"
      style={{
        backgroundColor: COLORS.BRAND_DARK,
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* الشعار */}
      <div 
        className="flex items-center justify-center h-16 mb-2"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: `linear-gradient(135deg, ${COLORS.BRAND_DARK}, #1e293b)`,
        }}
      >
        <span className="text-white font-bold text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xl">🏢</div>
          نظام غايتك
        </span>
      </div>

      {/* القائمة */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        defaultOpenKeys={getOpenKeys()} 
        onClick={({ key }) => navigate(key)}
        className="modern-sidebar-menu border-0 px-2"
        style={{
          backgroundColor: 'transparent',
        }}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;