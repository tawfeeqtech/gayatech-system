import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Typography, DatePicker } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatCard from '../../components/ui/StatCard';
import reportAPI from '../../api/reports';
import settingsAPI from '../../api/settings';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ProfitLoss = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState(null);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  useEffect(() => {
    settingsAPI.get().then(res => {
      if (res.data.data.settings?.defaultCurrency) {
        setDefaultCurrency(res.data.data.settings.defaultCurrency);
      }
    }).catch(() => {});
    fetchData();
  }, [dates]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dates) {
        params.startDate = dates[0].toISOString();
        params.endDate = dates[1].toISOString();
      }
      const res = await reportAPI.profitLoss(params);
      setData(res.data.data);
    } catch { message.error('فشل في جلب البيانات'); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return null;

  const pieData = [
    { name: 'الإيرادات', value: data.totalIncome, color: '#10b981' },
    { name: 'المصاريف', value: data.totalExpense, color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
          <Title level={4} style={{ margin: 0 }}>الأرباح والخسائر</Title>
        </div>
        <RangePicker onChange={(d) => setDates(d)} />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><StatCard title="الإيرادات" value={data.totalIncome} prefix={defaultCurrency} color="#10b981" icon="💰" /></Col>
        <Col xs={24} sm={8}><StatCard title="المصاريف" value={data.totalExpense} prefix={defaultCurrency} color="#ef4444" icon="💸" /></Col>
        <Col xs={24} sm={8}>
          <StatCard title="صافي الربح" value={data.netProfit} prefix={defaultCurrency}
            color={data.netProfit >= 0 ? '#3b82f6' : '#ef4444'}
            icon={data.netProfit >= 0 ? '📈' : '📉'} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="توزيع الإيرادات والمصاريف" style={{ borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value, defaultCurrency)}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, defaultCurrency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="ملخص" style={{ borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: 12, borderBottom: '1px solid #f1f5f9' }}>إجمالي الإيرادات</td><td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(data.totalIncome, defaultCurrency)}</td></tr>
                <tr><td style={{ padding: 12, borderBottom: '1px solid #f1f5f9' }}>إجمالي المصاريف</td><td style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(data.totalExpense, defaultCurrency)}</td></tr>
                <tr><td style={{ padding: 12, borderBottom: '1px solid #f1f5f9' }}>صافي الربح</td><td style={{ color: data.netProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 18 }}>{formatCurrency(data.netProfit, defaultCurrency)}</td></tr>
                <tr><td style={{ padding: 12 }}>هامش الربح</td><td style={{ fontWeight: 600 }}>{data.profitMargin}%</td></tr>
              </tbody>
            </table>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfitLoss;