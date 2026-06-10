import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Spin, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import invoiceAPI from '../../api/invoices';
import clientAPI from '../../api/clients';

const { Title } = Typography;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    clientAPI.getAll({ limit: 100 }).then(r => setClients(r.data.data.clients || [])).catch(() => {});
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await invoiceAPI.create(values);
      message.success('تمت إضافة الفاتورة');
      navigate('/invoices');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/invoices')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة فاتورة جديدة</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ invoiceType: 'مشروع', currency: 'USD', status: 'مسودة' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="client" label="العميل" rules={[{ required: true }]}>
                <Select placeholder="اختر العميل" showSearch optionFilterProp="label"
                  options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="invoiceType" label="نوع الفاتورة" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'مشروع', label: 'مشروع' }, { value: 'خدمة', label: 'خدمة' },
                  { value: 'عقد شهري', label: 'عقد شهري' }, { value: 'استقطاب', label: 'استقطاب' },
                  { value: 'متجر', label: 'متجر' }, { value: 'أخرى', label: 'أخرى' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField name="totalAmount" label="المبلغ الإجمالي" type="number" rules={[{ required: true }]} min={0} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[{ value: 'USD', label: '$' }, { value: 'ILS', label: '₪' }, { value: 'SAR', label: '﷼' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'مسودة', label: 'مسودة' }, { value: 'مصدرة', label: 'مصدرة' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField name="issueDate" label="تاريخ الإصدار" type="date" rules={[{ required: true }]} />
            </Col>
            <Col xs={24} md={12}>
              <FormField name="dueDate" label="تاريخ الاستحقاق" type="date" rules={[{ required: true }]} />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <FormField name="notes" label="ملاحظات" type="textarea" />
            </Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/invoices')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default InvoiceForm;