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
      className="sticky top-0 z-50 flex items-center px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100"
      style={{
        boxShadow: 'none',
        position: 'sticky',
        top: 0,
      }}
    >
      <div className="mr-auto">
        {/* Placeholder for breadcrumbs or page title if needed in future */}
      </div>

      <div className="ml-0">
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomLeft">
          <a onClick={(e) => e.preventDefault()} className="hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-block">
            <Space size="middle">
              <Avatar
                className="bg-blue-600 shadow-sm"
                icon={<UserOutlined />}
                src={user?.avatar}
              />
              <div className="hidden md:flex flex-col text-right leading-tight">
                <Text strong className="text-slate-800 text-[14px]">
                  {user?.fullName || 'المستخدم'}
                </Text>
                <Text type="secondary" className="text-[11px] opacity-70">
                  {user?.role === 'admin' ? 'مدير النظام' : user?.role || 'مستخدم'}
                </Text>
              </div>
              <DownOutlined className="text-slate-400 text-[10px]" />
            </Space>
          </a>
        </Dropdown>
      </div>
    </Header>
  );
};

export default TopBar;
