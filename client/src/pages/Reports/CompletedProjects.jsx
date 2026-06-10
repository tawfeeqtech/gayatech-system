import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const CompletedProjects = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.completedProjects()
      .then(res => setData(res.data.data.projects || []))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'المشروع', dataIndex: 'title', key: 'title' },
    { title: 'العميل', key: 'client', render: (_, r) => r.client?.name || '—' },
    { title: 'الخدمة', dataIndex: 'serviceType', key: 'service' },
    { title: 'القيمة', dataIndex: 'totalValue', key: 'value', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'تاريخ التسليم', dataIndex: 'deliveryDate', key: 'date', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>المشاريع المنجزة</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={data} rowKey="_id" locale={{ emptyText: 'لا توجد مشاريع منجزة' }} />
      </Card>
    </div>
  );
};

export default CompletedProjects;