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
  RightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const reportGroups = [
  {
    group: 'التحليل المالي',
    reports: [
      { title: 'الإيرادات الشهرية', desc: 'تحليل الإيرادات حسب الأشهر', icon: <RiseOutlined />, color: '#10b981', path: '/reports/monthly-revenue' },
      { title: 'المصاريف الشهرية', desc: 'تحليل المصاريف حسب الأشهر', icon: <FallOutlined />, color: '#ef4444', path: '/reports/monthly-expenses' },
      { title: 'الأرباح والخسائر', desc: 'ملخص الأرباح والخسائر', icon: <PieChartOutlined />, color: '#3b82f6', path: '/reports/profit-loss' },
      { title: 'تحليل مصادر الدخل', desc: 'توزيع الدخل حسب المصادر', icon: <BarChartOutlined />, color: '#f97316', path: '/reports/income-sources' },
    ]
  },
  {
    group: 'الأرصدة والديون',
    reports: [
      { title: 'الديون المستحقة', desc: 'الفواتير غير المدفوعة', icon: <WalletOutlined />, color: '#f59e0b', path: '/reports/outstanding-debts' },
      { title: 'أرصدة العملاء', desc: 'ملخص أرصدة العملاء', icon: <UserOutlined />, color: '#8b5cf6', path: '/reports/client-balances' },
      { title: 'أرصدة الشركاء', desc: 'ملخص أرصدة الشركاء', icon: <TeamOutlined />, color: '#ec4899', path: '/reports/partner-balances' },
    ]
  },
  {
    group: 'الموارد البشرية والمشاريع',
    reports: [
      { title: 'أداء الموظفين', desc: 'إحصائيات أداء الموظفين', icon: <TeamOutlined />, color: '#06b6d4', path: '/reports/employee-performance' },
      { title: 'المشاريع المنجزة', desc: 'قائمة المشاريع المكتملة', icon: <ProjectOutlined />, color: '#84cc16', path: '/reports/completed-projects' },
      { title: 'العقود النشطة', desc: 'العقود الحالية', icon: <FileTextOutlined />, color: '#14b8a6', path: '/reports/active-contracts' },
      { title: 'تقرير الاشتراكات', desc: 'حالة الاشتراكات', icon: <BellOutlined />, color: '#a855f7', path: '/reports/subscriptions' },
    ]
  },
  {
    group: 'حركة الحسابات',
    reports: [
      { title: 'حركة صندوق ريم', desc: 'تفاصيل حركة الوسيط', icon: <BankOutlined />, color: '#6366f1', path: '/reports/reem-movements' },
      { title: 'حركة حساب الشركة', desc: 'تفاصيل الحساب الرئيسي', icon: <DollarOutlined />, color: '#0ea5e9', path: '/reports/company-account' },
    ]
  }
];

const ReportList = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <Title level={3} className="!mb-1">مركز التقارير</Title>
        <Text type="secondary">استكشف التقارير المالية والتشغيلية لاتخاذ قرارات مبنية على البيانات</Text>
      </div>

      {reportGroups.map((group, gIndex) => (
        <div key={gIndex}>
          <Title level={5} className="!mb-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
            {group.group}
          </Title>
          <Row gutter={[24, 24]}>
            {group.reports.map((report, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card
                  hoverable
                  onClick={() => navigate(report.path)}
                  className="border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group overflow-hidden"
                  bodyStyle={{ padding: '24px' }}
                >
                  <div className="flex flex-col items-start">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 duration-300"
                      style={{ background: `${report.color}15`, color: report.color }}
                    >
                      {report.icon}
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <Text strong className="text-base text-slate-800">{report.title}</Text>
                      <RightOutlined className="text-[10px] text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <Text type="secondary" className="text-xs mt-1 leading-relaxed">
                      {report.desc}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
};

export default ReportList;
