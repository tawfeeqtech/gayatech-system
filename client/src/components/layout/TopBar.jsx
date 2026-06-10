import React from 'react';
import { Layout, Avatar, Dropdown, Space, Typography } from 'antd';
import { LogoutOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Header } = Layout;
const { Text } = Typography;

const TopBar = () => {
  const { user, logout } = useAuth();

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      logout();
    }
  };

  const menuItems = [
    {
      key: 'profile',
      label: 'الملف الشخصي',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'تسجيل الخروج',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: '#ffffff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        height: '64px',
      }}
    >
      <div style={{ marginLeft: 'auto' }}>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer' }}>
            <Space size="middle">
              <Avatar style={{ backgroundColor: '#1e3a8a' }} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: '1.2' }}>
                <Text strong style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {user?.fullName || 'المستخدم'}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'Cairo, sans-serif' }}>
                  {user?.role === 'admin' ? 'مدير النظام' : user?.role || 'مستخدم'}
                </Text>
              </div>
              <DownOutlined className="text-gray-400" />
            </Space>
          </a>
        </Dropdown>
      </div>
    </Header>
  );
};

export default TopBar;
