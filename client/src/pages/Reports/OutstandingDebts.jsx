import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import reportAPI from '../../api/reports';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { Title } = Typography;

const OutstandingDebts = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    reportAPI.outstandingDebts()
      .then(res => { setData(res.data.data.debts || []); setTotalOutstanding(res.data.totalOutstanding || 0); })
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'العميل', key: 'client', render: (_, r) => r.client?.name || '—' },
    { title: 'الشهر/الفاتورة', key: 'month', render: (_, r) => r.month || r.invoice?.invoiceNumber || '—' },
    { title: 'القيمة', dataIndex: 'value', key: 'value', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'المدفوع', dataIndex: 'paidAmount', key: 'paid', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'المتبقي', key: 'remaining', render: (_, r) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(r.value - r.paidAmount, r.currency)}</span> },
    { title: 'الاستحقاق', dataIndex: 'dueDate', key: 'due', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>الديون المستحقة</Title>
      </div>
      <StatCard title="إجمالي الديون المستحقة" value={totalOutstanding} prefix="$" color="#ef4444" />
      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <Table columns={columns} dataSource={data} rowKey="_id" />
      </Card>
    </div>
  );
};

export default OutstandingDebts;