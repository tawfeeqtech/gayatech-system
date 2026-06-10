import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const ClientBalances = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.clientBalances().then(res => setData(res.data.data.clients || [])).catch(() => message.error('فشل')).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'العميل', key: 'name', render: (_, r) => r.company ? `${r.name} - ${r.company}` : r.name },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone' },
    { title: 'إجمالي الفواتير', key: 'inv', render: (_, r) => formatCurrency(r.computedStats?.totalInvoiced || 0) },
    { title: 'المدفوع', key: 'paid', render: (_, r) => formatCurrency(r.computedStats?.totalPaid || 0) },
    { title: 'الرصيد', key: 'bal', render: (_, r) => {
      const b = r.computedStats?.balance || 0;
      return <span style={{ color: b > 0 ? '#10b981' : b < 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>{formatCurrency(b)}</span>;
    }},
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>أرصدة العملاء</Title>
      </div>
      <Card style={{ borderRadius: 8 }}><Table columns={columns} dataSource={data} rowKey="_id" /></Card>
    </div>
  );
};

export default ClientBalances;