import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography, InputNumber, DatePicker } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import advanceAPI from '../../api/advances';
import employeeAPI from '../../api/employees';
import FormField from '../../components/ui/FormField';
import { useCurrencies } from '../../hooks/useCurrencies';

const { Title } = Typography;

const AdvanceForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
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
        <Title level={4} style={{ margin: 0 }}>إضافة سلفة جديدة</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ currency: 'USD', repaymentMethod: 'خصم من الراتب' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="employee" label="الموظف" rules={[{ required: true }]}>
                <Select placeholder="اختر الموظف" showSearch optionFilterProp="label"
                  options={employees.map(e => ({ value: e._id, label: e.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="amount" label="المبلغ" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField type="smartselect" name="currency" label="العملة" options={currencies} allowCreate />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="requestDate" label="تاريخ الطلب" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="expectedRepaymentDate" label="تاريخ السداد المتوقع">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField type="smartselect" name="repaymentMethod" label="طريقة السداد" options={[
                  { value: 'خصم من الراتب', label: 'خصم من الراتب' },
                  { value: 'دفعة واحدة', label: 'دفعة واحدة' },
                  { value: 'أقساط', label: 'أقساط' },
                ]} allowCreate />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <FormField type="smartselect" name="reason" label="سبب السلفة" placeholder="اختر السبب" options={[
                  { value: 'ظروف طارئة', label: 'ظروف طارئة' },
                  { value: 'مصاريف طبية', label: 'مصاريف طبية' },
                  { value: 'تعليم', label: 'تعليم' },
                  { value: 'سكن', label: 'سكن' },
                  { value: 'أخرى', label: 'أخرى' },
                ]} allowCreate />
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