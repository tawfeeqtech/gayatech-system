import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import subscriptionAPI from '../../api/subscriptions';

const { Title } = Typography;

const SubscriptionForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await subscriptionAPI.create(values);
      message.success('تمت الإضافة');
      navigate('/subscriptions');
    } catch (e) { message.error('فشل'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/subscriptions')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة اشتراك</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ currency: 'USD', renewalType: 'سنوي', status: 'نشط' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}><FormField name="provider" label="المزود" rules={[{ required: true }]} /></Col>
            <Col xs={24} md={12}><FormField name="serviceName" label="اسم الخدمة" rules={[{ required: true }]} /></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={6}><FormField name="amount" label="القيمة" type="number" rules={[{ required: true }]} min={0} /></Col>
            <Col xs={24} md={6}><Form.Item name="currency" label="العملة"><Select options={[{ value: 'USD', label: '$' }]} /></Form.Item></Col>
            <Col xs={24} md={6}><FormField name="category" label="التصنيف" /></Col>
            <Col xs={24} md={6}>
              <Form.Item name="renewalType" label="نوع التجديد"><Select options={[
                { value: 'شهري', label: 'شهري' }, { value: 'ربع سنوي', label: 'ربع سنوي' },
                { value: 'نصف سنوي', label: 'نصف سنوي' }, { value: 'سنوي', label: 'سنوي' },
              ]} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}><FormField name="startDate" label="تاريخ البداية" type="date" rules={[{ required: true }]} /></Col>
            <Col xs={24} md={12}><FormField name="endDate" label="تاريخ الانتهاء" type="date" rules={[{ required: true }]} /></Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space><Button onClick={() => navigate('/subscriptions')}>إلغاء</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button></Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SubscriptionForm;