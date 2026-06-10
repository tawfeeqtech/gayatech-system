import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const IncomeSources = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ sources: [], totalIncome: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.incomeSources()
      .then(res => setData(res.data.data))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'المصدر', dataIndex: '_id', key: 'source', render: (t) => t || 'أخرى' },
    { title: 'عدد المعاملات', dataIndex: 'count', key: 'count', align: 'center' },
    { title: 'الإجمالي', dataIndex: 'total', key: 'total', render: (v) => <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(v)}</span> },
    {
      title: 'النسبة', key: 'pct',
      render: (_, r) => data.totalIncome > 0 ? `${((r.total / data.totalIncome) * 100).toFixed(1)}%` : '0%',
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const pieData = data.sources.map((s, i) => ({ name: s._id || 'أخرى', value: s.total, color: COLORS[i % COLORS.length] }));

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>تحليل مصادر الدخل</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="توزيع الدخل حسب المصادر" style={{ borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="تفاصيل المصادر" style={{ borderRadius: 8 }}>
            <Table columns={columns} dataSource={data.sources} rowKey="_id" pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>الإجمالي</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center"><strong>{data.sources.reduce((s, d) => s + d.count, 0)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}><strong style={{ color: '#10b981' }}>{formatCurrency(data.totalIncome)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={3}><strong>100%</strong></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IncomeSources;