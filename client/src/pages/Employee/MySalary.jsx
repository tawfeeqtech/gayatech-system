import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Result, Button, Row, Col, Statistic, Descriptions, Tag } from 'antd';
import { DollarOutlined, ReloadOutlined, UserOutlined, CalendarOutlined, BankOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

const { Title, Paragraph } = Typography;

const MySalary = () => {
  const { user } = useAuth();
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMySalary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/salaries/me');
      setSalary(response.data.data || response.data.salary || response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('لم يتم العثور على بيانات راتب لك بعد.');
      } else {
        setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل بيانات الراتب');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySalary();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontFamily: 'Cairo, sans-serif' }}>
        <Spin size="large" tip="جاري تحميل بيانات الراتب..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: 'Cairo, sans-serif', padding: '24px' }}>
        <Result
          status="info"
          icon={<DollarOutlined style={{ color: '#1e3a8a' }} />}
          title="معلومات الراتب"
          subTitle={error}
          extra={
            <Button type="primary" onClick={fetchMySalary} icon={<ReloadOutlined />}>
              إعادة المحاولة
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'Cairo, sans-serif', color: '#1e3a8a' }}>
          <DollarOutlined style={{ marginLeft: '10px' }} />
          راتبي
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>
          معلومات الراتب الخاصة بك
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)'
            }}
          >
            <Statistic
              title={<span style={{ fontFamily: 'Cairo, sans-serif', color: 'rgba(255,255,255,0.85)' }}>الراتب الأساسي</span>}
              value={salary?.baseSalary || salary?.amount || 0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '32px' }}
            />
          </Card>
        </Col>

        {salary?.allowances > 0 && (
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Statistic
                title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>البدلات</span>}
                value={salary.allowances}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#16a34a', fontFamily: 'Cairo, sans-serif' }}
              />
            </Card>
          </Col>
        )}

        {salary?.deductions > 0 && (
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Statistic
                title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>الاستقطاعات</span>}
                value={salary.deductions}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#dc2626', fontFamily: 'Cairo, sans-serif' }}
              />
            </Card>
          </Col>
        )}
      </Row>

      <Card 
        bordered={false} 
        style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}
      >
        <Descriptions 
          title={<span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 'bold' }}>تفاصيل الراتب</span>}
          column={{ xs: 1, sm: 2, md: 3 }}
          labelStyle={{ fontFamily: 'Cairo, sans-serif', fontWeight: 500 }}
          contentStyle={{ fontFamily: 'Cairo, sans-serif' }}
        >
          <Descriptions.Item 
            label={
              <span><UserOutlined style={{ marginLeft: '6px' }} />الموظف</span>
            }
          >
            {user?.fullName || salary?.employeeName || '---'}
          </Descriptions.Item>
          
          {salary?.month && (
            <Descriptions.Item 
              label={
                <span><CalendarOutlined style={{ marginLeft: '6px' }} />الشهر</span>
              }
            >
              {salary.month}
            </Descriptions.Item>
          )}

          {salary?.year && (
            <Descriptions.Item 
              label={
                <span><CalendarOutlined style={{ marginLeft: '6px' }} />السنة</span>
              }
            >
              {salary.year}
            </Descriptions.Item>
          )}

          {salary?.currency && (
            <Descriptions.Item 
              label={
                <span><BankOutlined style={{ marginLeft: '6px' }} />العملة</span>
              }
            >
              {salary.currency}
            </Descriptions.Item>
          )}

          {salary?.status && (
            <Descriptions.Item label="الحالة">
              <Tag color={salary.status === 'paid' ? 'green' : salary.status === 'pending' ? 'orange' : 'blue'}>
                {salary.status === 'paid' ? 'مدفوع' : salary.status === 'pending' ? 'قيد الانتظار' : salary.status}
              </Tag>
            </Descriptions.Item>
          )}

          {salary?.paymentDate && (
            <Descriptions.Item label="تاريخ الدفع">
              {new Date(salary.paymentDate).toLocaleDateString('ar-EG')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {(salary?.baseSalary || salary?.amount) && (
        <Card 
          bordered={false} 
          style={{ 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            marginTop: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0'
          }}
        >
          <Title level={4} style={{ fontFamily: 'Cairo, sans-serif', color: '#16a34a', textAlign: 'center', margin: 0 }}>
            ✅ تم تحميل بيانات الراتب بنجاح
          </Title>
        </Card>
      )}
    </div>
  );
};

export default MySalary;
