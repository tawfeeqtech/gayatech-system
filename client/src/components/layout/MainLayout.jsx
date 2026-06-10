import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../hooks/useAuth';

const { Content } = Layout;

const MainLayout = () => {
  const { checkCurrentUser } = useAuth();

  useEffect(() => {
    checkCurrentUser();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Sidebar />
      <Layout style={{ marginRight: '260px', minHeight: '100vh' }}>
        <TopBar />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f8fafc',
            minHeight: '280px',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
