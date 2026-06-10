import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import advanceAPI from '../../api/advances';
import employeeAPI from '../../api/employees';

const { Title } = Typography;

const AdvanceForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await advanceAPI.create(values);
      message.success('تمت إضافة السلفة');
      navigate('/advances');
    } catch (e) { message.error(e.response?.data?.message || 'فشل'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/advances')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة سلفة</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ currency: 'USD' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="employee" label="الموظف" rules={[{ required: true }]}>
                <Select placeholder="اختر الموظف" showSearch optionFilterProp="label"
                  options={employees.map(e => ({ value: e._id, label: e.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField name="amount" label="المبلغ" type="number" rules={[{ required: true }]} min={0} />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="requestDate" label="التاريخ" type="date" rules={[{ required: true }]} />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <FormField name="reason" label="السبب" type="textarea" />
            </Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/advances')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdvanceForm;