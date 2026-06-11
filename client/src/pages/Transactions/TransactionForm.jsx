import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Spin, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import transactionAPI from '../../api/transactions';
import clientAPI from '../../api/clients';
import accountAPI from '../../api/accounts';

const { Title } = Typography;

const TransactionForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [type, setType] = useState('دخل');

  useEffect(() => {
    Promise.all([
      clientAPI.getAll({ limit: 100 }).then(r => setClients(r.data.data.clients || [])).catch(() => {}),
      accountAPI.getAll().then(r => setAccounts(r.data.data.accounts || [])).catch(() => {}),
    ]);
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        nature: values.type === 'تحويل' ? 'داخلي' : 'خارجي',
      };
      await transactionAPI.create(values);
      message.success('تمت إضافة المعاملة بنجاح');
      navigate('/transactions');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في إضافة المعاملة');
    } finally {
      setSubmitting(false);
    }
  };

  const onTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({ fromAccount: undefined, toAccount: undefined });
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/transactions')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>إضافة معاملة مالية جديدة</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ type: 'دخل', currency: 'USD', paymentMethod: 'تحويل بنكي', status: 'مكتمل' }}>
          
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="type" label="نوع المعاملة" rules={[{ required: true }]}>
                <Select onChange={onTypeChange} options={[
                  { value: 'دخل', label: '💰 دخل' }, { value: 'مصروف', label: '💸 مصروف' }, { value: 'تحويل', label: '🔄 تحويل' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormField name="amount" label="المبلغ" type="number" rules={[{ required: true }]} min={0} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[
                  { value: 'USD', label: '$' }, { value: 'ILS', label: '₪' }, { value: 'SAR', label: '﷼' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            {/* الحسابات - تظهر حسب النوع */}
            {type === 'تحويل' ? (
              <>
                <Col xs={24} md={12}>
                  <Form.Item name="fromAccount" label="من حساب" rules={[{ required: true, message: 'مطلوب للتحويل' }]}>
                    <Select placeholder="اختر الحساب المصدر" options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="toAccount" label="إلى حساب" rules={[{ required: true, message: 'مطلوب للتحويل' }]}>
                    <Select placeholder="اختر الحساب الوجهة" options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
              </>
            ) : type === 'دخل' ? (
              <Col xs={24} md={12}>
                <Form.Item name="toAccount" label="إلى حساب (المستلم)" rules={[{ required: true, message: 'مطلوب' }]}>
                  <Select placeholder="اختر الحساب المستلم" options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} md={12}>
                <Form.Item name="fromAccount" label="من حساب (المدفوع منه)" rules={[{ required: true, message: 'مطلوب' }]}>
                  <Select placeholder="اختر الحساب" options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <FormField name="transactionDate" label="تاريخ المعاملة" type="date" rules={[{ required: true }]} />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="client" label="العميل (اختياري)">
                <Select placeholder="اختر العميل" allowClear showSearch optionFilterProp="label"
                  options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="paymentMethod" label="وسيلة الدفع">
                <Select options={[
                  { value: 'تحويل بنكي', label: 'تحويل بنكي' }, { value: 'نقد', label: 'نقد' },
                  { value: 'شيك', label: 'شيك' }, { value: 'بطاقة ائتمان', label: 'بطاقة ائتمان' },
                  { value: 'ريم', label: 'ريم' }, { value: 'أخرى', label: 'أخرى' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'مكتمل', label: 'مكتمل' }, { value: 'معلق', label: 'معلق' },
                  { value: 'قيد المراجعة', label: 'قيد المراجعة' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <FormField name="description" label="الوصف" type="textarea" placeholder="وصف المعاملة..." />
            </Col>
          </Row>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/transactions')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>حفظ المعاملة</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default TransactionForm;