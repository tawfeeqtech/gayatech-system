import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const ActiveContracts = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.activeContracts().then(res => setData(res.data.data.contracts || [])).catch(() => message.error('فشل')).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'العقد', dataIndex: 'title', key: 'title' },
    { title: 'العميل', key: 'client', render: (_, r) => r.client?.name || '—' },
    { title: 'الخدمة', dataIndex: 'serviceType', key: 'svc' },
    { title: 'القيمة', dataIndex: 'defaultMonthlyValue', key: 'val', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'تاريخ البداية', dataIndex: 'startDate', key: 'start', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>العقود النشطة</Title>
      </div>
      <Card style={{ borderRadius: 8 }}><Table columns={columns} dataSource={data} rowKey="_id" /></Card>
    </div>
  );
};

export default ActiveContracts;