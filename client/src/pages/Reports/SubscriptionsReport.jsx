import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Tag, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import reportAPI from '../../api/reports';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { Title } = Typography;

const SubscriptionsReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.subscriptions().then(res => setData(res.data.data)).catch(() => message.error('فشل')).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'المزود', dataIndex: 'provider', key: 'provider' },
    { title: 'الخدمة', dataIndex: 'serviceName', key: 'service' },
    { title: 'القيمة', dataIndex: 'amount', key: 'amount', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'تاريخ الانتهاء', dataIndex: 'endDate', key: 'end', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    { title: 'الحالة', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'نشط' ? 'green' : 'red'}>{s}</Tag> },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return null;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>تقرير الاشتراكات</Title>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}><StatCard title="النشطة" value={data.summary?.active || 0} color="#10b981" /></Col>
        <Col xs={8}><StatCard title="تنتهي قريباً" value={data.summary?.expiringSoon || 0} color="#f59e0b" /></Col>
        <Col xs={8}><StatCard title="منتهية" value={data.summary?.expired || 0} color="#ef4444" /></Col>
      </Row>
      <Card style={{ borderRadius: 8 }}><Table columns={columns} dataSource={data.subscriptions} rowKey="_id" /></Card>
    </div>
  );
};

export default SubscriptionsReport;