import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import reportAPI from '../../api/reports';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Title } = Typography;

const ReemMovements = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ movements: [], balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.reemMovements()
      .then(res => setData(res.data.data))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'التاريخ', dataIndex: 'transactionDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    {
      title: 'النوع', dataIndex: 'type', key: 'type', width: 90,
      render: (t) => <Tag color={t === 'دخل' ? 'green' : t === 'مصروف' ? 'red' : 'blue'}>{t}</Tag>,
    },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v, r) => (
        <span style={{ color: r.type === 'دخل' ? '#10b981' : r.type === 'مصروف' ? '#ef4444' : '#3b82f6', fontWeight: 600 }}>
          {r.type === 'دخل' ? '+' : r.type === 'مصروف' ? '-' : '↔'} {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    { title: 'العميل', key: 'client', width: 140, render: (_, r) => r.client?.name || '—' },
    { title: 'الوصف', dataIndex: 'description', key: 'desc', ellipsis: true },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>حركة صندوق ريم</Title>
      </div>
      <StatCard title="الرصيد الحالي" value={data.balance} prefix="$" color={data.balance >= 0 ? '#10b981' : '#ef4444'} icon="🔄" />
      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <Table columns={columns} dataSource={data.movements} rowKey="_id" locale={{ emptyText: 'لا توجد حركة' }} />
      </Card>
    </div>
  );
};

const CompanyAccount = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ movements: [], balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.companyAccount()
      .then(res => setData(res.data.data))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'التاريخ', dataIndex: 'transactionDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    {
      title: 'النوع', dataIndex: 'type', key: 'type', width: 90,
      render: (t) => <Tag color={t === 'دخل' ? 'green' : t === 'مصروف' ? 'red' : 'blue'}>{t}</Tag>,
    },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v, r) => (
        <span style={{ color: r.type === 'دخل' ? '#10b981' : r.type === 'مصروف' ? '#ef4444' : '#3b82f6', fontWeight: 600 }}>
          {r.type === 'دخل' ? '+' : r.type === 'مصروف' ? '-' : '↔'} {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    { title: 'العميل', key: 'client', width: 140, render: (_, r) => r.client?.name || '—' },
    { title: 'الوصف', dataIndex: 'description', key: 'desc', ellipsis: true },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>حركة حساب الشركة</Title>
      </div>
      <StatCard title="الرصيد الحالي" value={data.balance} prefix="$" color={data.balance >= 0 ? '#10b981' : '#ef4444'} icon="🏦" />
      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <Table columns={columns} dataSource={data.movements} rowKey="_id" locale={{ emptyText: 'لا توجد حركة' }} />
      </Card>
    </div>
  );
};

export { ReemMovements, CompanyAccount };