import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  TeamOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BankOutlined,
  WalletOutlined,
  UserOutlined,
  BellOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const reports = [
  { title: 'الإيرادات الشهرية', desc: 'تحليل الإيرادات حسب الأشهر', icon: <RiseOutlined />, color: '#10b981', path: '/reports/monthly-revenue' },
  { title: 'المصاريف الشهرية', desc: 'تحليل المصاريف حسب الأشهر', icon: <FallOutlined />, color: '#ef4444', path: '/reports/monthly-expenses' },
  { title: 'الأرباح والخسائر', desc: 'ملخص الأرباح والخسائر', icon: <PieChartOutlined />, color: '#3b82f6', path: '/reports/profit-loss' },
  { title: 'الديون المستحقة', desc: 'الفواتير غير المدفوعة', icon: <WalletOutlined />, color: '#f59e0b', path: '/reports/outstanding-debts' },
  { title: 'أرصدة العملاء', desc: 'ملخص أرصدة العملاء', icon: <UserOutlined />, color: '#8b5cf6', path: '/reports/client-balances' },
  { title: 'أرصدة الشركاء', desc: 'ملخص أرصدة الشركاء', icon: <TeamOutlined />, color: '#ec4899', path: '/reports/partner-balances' },
  { title: 'أداء الموظفين', desc: 'إحصائيات أداء الموظفين', icon: <TeamOutlined />, color: '#06b6d4', path: '/reports/employee-performance' },
  { title: 'المشاريع المنجزة', desc: 'قائمة المشاريع المكتملة', icon: <ProjectOutlined />, color: '#84cc16', path: '/reports/completed-projects' },
  { title: 'العقود النشطة', desc: 'العقود الحالية', icon: <FileTextOutlined />, color: '#14b8a6', path: '/reports/active-contracts' },
  { title: 'حركة صندوق ريم', desc: 'تفاصيل حركة الوسيط', icon: <BankOutlined />, color: '#6366f1', path: '/reports/reem-movements' },
  { title: 'حركة حساب الشركة', desc: 'تفاصيل الحساب الرئيسي', icon: <DollarOutlined />, color: '#0ea5e9', path: '/reports/company-account' },
  { title: 'تحليل مصادر الدخل', desc: 'توزيع الدخل حسب المصادر', icon: <BarChartOutlined />, color: '#f97316', path: '/reports/income-sources' },
  { title: 'تقرير الاشتراكات', desc: 'حالة الاشتراكات', icon: <BellOutlined />, color: '#a855f7', path: '/reports/subscriptions' },
];

const ReportList = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <Title level={4} style={{ marginBottom: 24 }}>التقارير</Title>
      <Row gutter={[16, 16]}>
        {reports.map((report, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Card
              hoverable
              onClick={() => navigate(report.path)}
              style={{ borderRadius: 8, height: '100%', cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: `${report.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: report.color, margin: '0 auto 12px',
                }}>
                  {report.icon}
                </div>
                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{report.title}</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>{report.desc}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ReportList;