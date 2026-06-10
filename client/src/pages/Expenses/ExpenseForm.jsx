import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import expenseAPI from '../../api/expenses';
import categoryAPI from '../../api/expenseCategories';
import accountAPI from '../../api/accounts';

const { Title } = Typography;

const ExpenseForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data.categories || [])).catch(() => {});
    accountAPI.getAll().then(r => setAccounts(r.data.data.accounts || [])).catch(() => {});
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await expenseAPI.create(values);
      message.success('تمت إضافة المصروف');
      navigate('/expenses');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/expenses')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة مصروف جديد</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ currency: 'USD', paymentMethod: 'تحويل بنكي', status: 'مدفوع' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField name="amount" label="المبلغ" type="number" rules={[{ required: true }]} min={0} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[{ value: 'USD', label: '$' }, { value: 'ILS', label: '₪' }, { value: 'SAR', label: '﷼' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField name="expenseDate" label="التاريخ" type="date" rules={[{ required: true }]} />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="التصنيف" rules={[{ required: true }]}>
                <Select placeholder="اختر التصنيف" options={categories.map(c => ({ value: c._id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="paidFrom" label="مدفوع من">
                <Select placeholder="اختر الحساب" allowClear options={accounts.map(a => ({ value: a._id, label: a.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="paymentMethod" label="وسيلة الدفع">
                <Select options={[
                  { value: 'تحويل بنكي', label: 'تحويل بنكي' }, { value: 'نقد', label: 'نقد' },
                  { value: 'بطاقة ائتمان', label: 'بطاقة ائتمان' }, { value: 'أخرى', label: 'أخرى' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <FormField name="description" label="الوصف" rules={[{ required: true }]} placeholder="وصف المصروف" />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="vendor" label="المزود" placeholder="اسم المزود" />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <FormField name="notes" label="ملاحظات" type="textarea" />
            </Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/expenses')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ExpenseForm;