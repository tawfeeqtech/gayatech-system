import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import partnerAPI from '../../api/partners';

const { Title } = Typography;

const PartnerForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await partnerAPI.create(values);
      message.success('تمت إضافة الشريك');
      navigate('/partners');
    } catch (e) { message.error(e.response?.data?.message || 'فشل'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/partners')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة شريك</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ partnerType: 'ممول' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}><FormField name="name" label="الاسم" rules={[{ required: true }]} /></Col>
            <Col xs={24} md={12}>
              <Form.Item name="partnerType" label="النوع"><Select options={[
                { value: 'مؤسس', label: 'مؤسس' }, { value: 'مستثمر', label: 'مستثمر' },
                { value: 'شريك استراتيجي', label: 'شريك استراتيجي' }, { value: 'ممول', label: 'ممول' },
              ]} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}><FormField name="email" label="البريد" /></Col>
            <Col xs={24} md={12}><FormField name="phone" label="الهاتف" /></Col>
          </Row>
          <Row gutter={24}><Col span={24}><FormField name="notes" label="ملاحظات" type="textarea" /></Col></Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space><Button onClick={() => navigate('/partners')}>إلغاء</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button></Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PartnerForm;