import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import salaryAPI from '../../api/salaries';
import employeeAPI from '../../api/employees';

const { Title } = Typography;

const SalaryForm = () => {
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
      const emp = employees.find(e => e._id === values.employee);
      await salaryAPI.create({ ...values, baseAmount: emp?.baseSalary || values.baseAmount });
      message.success('تم إضافة الراتب');
      navigate('/salaries');
    } catch (e) { message.error(e.response?.data?.message || 'فشل في الحفظ'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/salaries')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>صرف راتب</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ currency: 'USD' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="employee" label="الموظف" rules={[{ required: true }]}>
                <Select placeholder="اختر الموظف" showSearch optionFilterProp="label"
                  options={employees.map(e => ({ value: e._id, label: `${e.name} - ${e.jobTitle}` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField name="month" label="الشهر" placeholder="2026-06" rules={[{ required: true }]} />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="baseAmount" label="المبلغ" type="number" rules={[{ required: true }]} min={0} />
            </Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/salaries')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SalaryForm;