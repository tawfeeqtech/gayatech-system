import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Select, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import reportAPI from '../../api/reports';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const MonthlyExpenses = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    reportAPI.monthlyExpenses({ year })
      .then(res => {
        const expenses = res.data.data.expenses || [];
        const formatted = Array.from({ length: 12 }, (_, i) => {
          const found = expenses.find(r => r._id === i + 1);
          return { month: monthNames[i], expenses: found?.total || 0, count: found?.count || 0 };
        });
        setData(formatted);
      })
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, [year]);

  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);

  const columns = [
    { title: 'الشهر', dataIndex: 'month', key: 'month' },
    { title: 'عدد المصاريف', dataIndex: 'count', key: 'count', align: 'center' },
    { title: 'المصاريف', dataIndex: 'expenses', key: 'expenses', render: (v) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(v)}</span> },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
          <Title level={4} style={{ margin: 0 }}>المصاريف الشهرية</Title>
        </div>
        <Select value={year} onChange={setYear} style={{ width: 100 }}>
          {[2024, 2025, 2026, 2027].map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
        </Select>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={{ borderRadius: 8, marginBottom: 16 }}>
            <Title level={5}>إجمالي المصاريف: {formatCurrency(totalExpenses)}</Title>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="expenses" name="المصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={24}>
          <Card title="تفاصيل المصاريف" style={{ borderRadius: 8 }}>
            <Table columns={columns} dataSource={data} rowKey="month" pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>الإجمالي</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center"><strong>{data.reduce((s, d) => s + d.count, 0)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}><strong style={{ color: '#ef4444' }}>{formatCurrency(totalExpenses)}</strong></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MonthlyExpenses;