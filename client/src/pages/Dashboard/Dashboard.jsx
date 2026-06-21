import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ProjectOutlined, FileTextOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Paragraph } = Typography;

const data = [
  { name: 'يناير', revenue: 4000, expenses: 2400 },
  { name: 'فبراير', revenue: 3000, expenses: 1398 },
  { name: 'مارس', revenue: 9800, expenses: 2000 },
  { name: 'أبريل', revenue: 2780, expenses: 3908 },
  { name: 'مايو', revenue: 1890, expenses: 4800 },
  { name: 'يونيو', revenue: 2390, expenses: 3800 },
  { name: 'يونيو', revenue: 3490, expenses: 4300 },
];

import StatCard from '../../components/ui/StatCard';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <Title level={2} className="!m-0 text-slate-800">
          لوحة التحكم العامة
        </Title>
        <Paragraph className="!mt-2 text-slate-500">
          مرحباً بك في نظام غايتك المالي والتشغيلي المتكامل.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="الإيرادات الشهرية"
            value={12500}
            type="success"
            trend="+12.5%"
            description="مقارنة بالشهر الماضي"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="المصاريف الشهرية"
            value={4800}
            type="error"
            trend="+3.2%"
            description="مقارنة بالشهر الماضي"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="المشاريع النشطة"
            value={8}
            type="info"
            description="مشاريع قيد التنفيذ حالياً"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="العقود النشطة"
            value={15}
            type="warning"
            description="عقود صيانة وخدمات سنوية"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            title={<span className="font-bold text-slate-800">رصد التدفق المالي (الإيرادات والمصاريف)</span>}
            className="shadow-sm border-slate-100 rounded-2xl"
          >
            <div className="w-full h-[400px] mt-4">
              <ResponsiveContainer>
                <LineChart
                  data={data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontFamily: 'Cairo, sans-serif' }} />
                  <YAxis style={{ fontFamily: 'Cairo, sans-serif' }} />
                  <Tooltip style={{ fontFamily: 'Cairo, sans-serif' }} />
                  <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" name="المصاريف" stroke="#ef4444" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
