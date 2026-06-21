import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Typography, DatePicker, Button, Space } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import StatCard from '../../components/ui/StatCard';
import reportAPI from '../../api/reports';
import settingsAPI from '../../api/settings';
import { formatCurrency } from '../../utils/formatters';

const { Title, Text } = Typography;
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

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
      <Spin size="large" />
      <Text type="secondary">جاري تحليل البيانات المالية...</Text>
    </div>
  );

  if (!data) return null;

  const pieData = [
    { name: 'الإيرادات', value: data.totalIncome, color: '#10b981' },
    { name: 'المصاريف', value: data.totalExpense, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/reports')}
            className="rounded-full border-slate-200 text-slate-500 hover:text-blue-600"
          >
            التقارير
          </Button>
          <div>
            <Title level={3} className="!mb-0">الأرباح والخسائر</Title>
            <Text type="secondary" className="text-xs">نظرة شاملة على الأداء المالي للشركة</Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker
            onChange={(d) => setDates(d)}
            className="rounded-lg shadow-sm h-10"
            suffixIcon={<CalendarOutlined />}
          />
          <Button icon={<DownloadOutlined />} className="h-10 rounded-lg">تصدير</Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="إجمالي الإيرادات"
            value={data.totalIncome}
            prefix={defaultCurrency}
            variant="primary"
            icon="💰"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="إجمالي المصاريف"
            value={data.totalExpense}
            prefix={defaultCurrency}
            variant="danger"
            icon="💸"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="صافي الربح"
            value={data.netProfit}
            prefix={defaultCurrency}
            variant={data.netProfit >= 0 ? 'success' : 'danger'}
            trend={{ value: Math.abs(data.profitMargin), isUp: data.netProfit >= 0 }}
            icon={data.netProfit >= 0 ? '📈' : '📉'}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span className="text-base font-bold">توزيع المؤشرات المالية</span>}
            className="border-0 shadow-sm rounded-2xl h-full"
          >
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v) => formatCurrency(v, defaultCurrency)}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<span className="text-base font-bold">التفاصيل المالية</span>}
            className="border-0 shadow-sm rounded-2xl h-full"
          >
            <div className="space-y-6 py-2">
              <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div>
                  <div className="text-emerald-600 text-xs font-medium uppercase">إجمالي الإيرادات</div>
                  <div className="text-2xl font-bold text-emerald-700">{formatCurrency(data.totalIncome, defaultCurrency)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-rose-50 border border-rose-100">
                <div>
                  <div className="text-rose-600 text-xs font-medium uppercase">إجمالي المصاريف</div>
                  <div className="text-2xl font-bold text-rose-700">{formatCurrency(data.totalExpense, defaultCurrency)}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <Text className="text-slate-500">صافي الربح</Text>
                  <Text className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(data.netProfit, defaultCurrency)}
                  </Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-slate-500">هامش الربح</Text>
                  <Tag className="rounded-full border-0 bg-slate-100 px-3 font-bold">{data.profitMargin}%</Tag>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 italic">
                * جميع المبالغ أعلاه محسوبة بالعملة الافتراضية للنظام ({defaultCurrency}) بناءً على أسعار الصرف الحالية.
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfitLoss;
