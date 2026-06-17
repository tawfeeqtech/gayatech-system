import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography, InputNumber, DatePicker } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import salaryAPI from '../../api/salaries';
import employeeAPI from '../../api/employees';
import { useCurrencies } from '../../hooks/useCurrencies';

const { Title } = Typography;
const { MonthPicker } = DatePicker;

const SalaryForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const handleEmployeeChange = (value) => {
    setSelectedEmployee(value);
    const emp = employees.find(e => e._id === value);
    if (emp) {
      form.setFieldsValue({
        baseAmount: emp.baseSalary,
        currency: emp.salaryCurrency || 'USD',
      });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const monthValue = values.month ? values.month.format('YYYY-MM') : undefined;
      await salaryAPI.create({ ...values, month: monthValue });
      message.success('تم إضافة الراتب');
      navigate('/salaries');
    } catch (e) { message.error(e.response?.data?.message || 'فشل في الحفظ'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/salaries')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>صرف راتب جديد</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ currency: 'USD', status: 'مستحق' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="employee" label="الموظف" rules={[{ required: true }]}>
                <Select
                  placeholder="اختر الموظف"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleEmployeeChange}
                  options={employees.map(e => ({ value: e._id, label: `${e.name} - ${e.jobTitle}` }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="month" label="الشهر" rules={[{ required: true, message: 'اختر الشهر' }]}>
                <MonthPicker style={{ width: '100%' }} format="YYYY-MM" placeholder="اختر الشهر" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[
                  { value: 'USD', label: 'دولار $' }, { value: 'ILS', label: 'شيكل ₪' },
                  { value: 'SAR', label: 'ريال ﷼' }, { value: 'JOD', label: 'دينار د.أ' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="baseAmount" label="الراتب الأساسي" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="deductions" label="الخصومات">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bonuses" label="المكافآت">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
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