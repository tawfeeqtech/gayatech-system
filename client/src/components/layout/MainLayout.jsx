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
      <Layout style={{ marginRight: '260px', minHeight: '100vh', background: '#f8fafc' }}>
        <TopBar />
        <Content
          style={{
            padding: '32px',
            minHeight: '280px',
          }}
        >
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
