import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ProjectOutlined, FileTextOutlined, TeamOutlined, DollarOutlined, WalletOutlined, CrownOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

const { Title, Paragraph } = Typography;

const data = [
  { name: 'يناير', revenue: 4000, expenses: 2400 },
  { name: 'فبراير', revenue: 3000, expenses: 1398 },
  { name: 'مارس', revenue: 9800, expenses: 2000 },
  { name: 'أبريل', revenue: 2780, expenses: 3908 },
  { name: 'مايو', revenue: 1890, expenses: 4800 },
  { name: 'يونيو', revenue: 2390, expenses: 3800 },
  { name: 'يونيو', revenue: 3490, expenses: 4300 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  // 📊 لوحة الموظف - بسيطة ومركزة
  const EmployeeDashboard = () => (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          مرحباً {user?.fullName || 'بك'} 👋
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          لوحة معلومات الموظف
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif', color: '#fff' }}>رصيد الراتب الحالي</span>}
              value={1500}
              precision={2}
              valueStyle={{ color: '#fff', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 📊 لوحة المحاسب
  const AccountantDashboard = () => (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          لوحة المحاسبة
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          نظرة عامة على الفواتير والمصاريف
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>الفواتير المعلقة</span>}
              value={12}
              valueStyle={{ color: '#d97706', fontFamily: 'Cairo, sans-serif' }}
              prefix={<FileTextOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المصاريف هذا الشهر</span>}
              value={4800}
              precision={2}
              valueStyle={{ color: '#cf1322', fontFamily: 'Cairo, sans-serif' }}
              prefix={<WalletOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المزودون النشطون</span>}
              value={8}
              valueStyle={{ color: '#1d4ed8', fontFamily: 'Cairo, sans-serif' }}
              prefix={<TeamOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>رصيد الحسابات</span>}
              value={28500}
              precision={2}
              valueStyle={{ color: '#3f8600', fontFamily: 'Cairo, sans-serif' }}
              prefix={<DollarOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 📊 لوحة مدير المشاريع
  const PMDashboard = () => (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          لوحة إدارة المشاريع
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          إحصائيات المشاريع والعملاء
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المشاريع النشطة</span>}
              value={8}
              valueStyle={{ color: '#1d4ed8', fontFamily: 'Cairo, sans-serif' }}
              prefix={<ProjectOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>العقود النشطة</span>}
              value={15}
              valueStyle={{ color: '#854d0e', fontFamily: 'Cairo, sans-serif' }}
              prefix={<FileTextOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>إجمالي العملاء</span>}
              value={45}
              valueStyle={{ color: '#059669', fontFamily: 'Cairo, sans-serif' }}
              prefix={<TeamOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المشاريع المكتملة</span>}
              value={23}
              valueStyle={{ color: '#3f8600', fontFamily: 'Cairo, sans-serif' }}
              prefix={<CrownOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 📊 لوحة المدير المالي
  const FinanceDashboard = () => (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          لوحة الإدارة المالية
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          نظرة عامة مالية شاملة
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>الإيرادات الشهرية</span>}
              value={12500}
              precision={2}
              valueStyle={{ color: '#3f8600', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المصاريف الشهرية</span>}
              value={4800}
              precision={2}
              valueStyle={{ color: '#cf1322', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
              suffix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>الفواتير الصادرة</span>}
              value={32}
              valueStyle={{ color: '#1d4ed8', fontFamily: 'Cairo, sans-serif' }}
              prefix={<SolutionOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>صافي الربح</span>}
              value={7700}
              precision={2}
              valueStyle={{ color: '#3f8600', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 📊 لوحة المدير العام (جميع البيانات)
  const AdminDashboard = () => (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          لوحة التحكم العامة
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          مرحباً بك في نظام غايتك المالي والتشغيلي المتكامل.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>الإيرادات الشهرية</span>}
              value={12500}
              precision={2}
              valueStyle={{ color: '#3f8600', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المصاريف الشهرية</span>}
              value={4800}
              precision={2}
              valueStyle={{ color: '#cf1322', fontFamily: 'Cairo, sans-serif' }}
              prefix="$"
              suffix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المشاريع النشطة</span>}
              value={8}
              valueStyle={{ color: '#1d4ed8', fontFamily: 'Cairo, sans-serif' }}
              prefix={<ProjectOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>العقود النشطة</span>}
              value={15}
              valueStyle={{ color: '#854d0e', fontFamily: 'Cairo, sans-serif' }}
              prefix={<FileTextOutlined style={{ marginLeft: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>

    </div>
  );

  // اختيار لوحة التحكم المناسبة حسب الدور
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'finance':
      return <FinanceDashboard />;
    case 'pm':
      return <PMDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default Dashboard;
