import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const PartnerBalances = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.partnerBalances()
      .then(res => setData(res.data.data.partners || []))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'الشريك', dataIndex: 'name', key: 'name' },
    { title: 'النوع', dataIndex: 'partnerType', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', render: (p) => p || '—' },
    { title: 'إجمالي التمويل', key: 'funded', render: (_, r) => formatCurrency(r.computedStats?.totalFunded || 0) },
    { title: 'إجمالي المسدد', key: 'repaid', render: (_, r) => formatCurrency(r.computedStats?.totalRepaid || 0) },
    {
      title: 'المستحق', key: 'balance',
      render: (_, r) => {
        const b = r.computedStats?.balance || 0;
        return (
          <span style={{ color: b < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
            {b < 0 ? `${formatCurrency(Math.abs(b))} (للشريك)` : formatCurrency(b)}
          </span>
        );
      },
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>أرصدة الشركاء</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={data} rowKey="_id" locale={{ emptyText: 'لا يوجد شركاء' }} />
      </Card>
    </div>
  );
};

export default PartnerBalances;