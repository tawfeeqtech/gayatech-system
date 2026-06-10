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
  SettingOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'لوحة التحكم' },
    { key: '/clients', icon: <UserOutlined />, label: 'العملاء' },
    { key: '/contracts', icon: <FileTextOutlined />, label: 'العقود الشهرية' },
    { key: '/projects', icon: <ProjectOutlined />, label: 'المشاريع' },
    { key: '/transactions', icon: <DollarOutlined />, label: 'المعاملات المالية' },
    { key: '/invoices', icon: <SolutionOutlined />, label: 'الفواتير' },
    { key: '/accounts', icon: <BankOutlined />, label: 'الحسابات والمحافظ' },
    { key: '/expenses', icon: <WalletOutlined />, label: 'المصاريف' },
    { key: '/employees', icon: <TeamOutlined />, label: 'الموظفون' },
    { key: '/partners', icon: <UsergroupAddOutlined />, label: 'الشركاء والتمويل' },
    { key: '/subscriptions', icon: <BellOutlined />, label: 'الاشتراكات' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'التقارير' },
    { key: '/settings', icon: <SettingOutlined />, label: 'الإعدادات' },
  ];

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/') return '/';
    // Match sub-routes
    const matched = menuItems.find(item => item.key !== '/' && path.startsWith(item.key));
    return matched ? matched.key : '/';
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={260}
      style={{
        backgroundColor: '#0f172a',
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '64px',
          borderBottom: '1px solid #1e293b',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '16px',
          fontFamily: 'Cairo, sans-serif'
        }}
      >
        🏢 نظام غايتك المالي
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        onClick={({ key }) => navigate(key)}
        style={{
          backgroundColor: '#0f172a',
          fontFamily: 'Cairo, sans-serif',
          paddingTop: '1rem',
        }}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;
