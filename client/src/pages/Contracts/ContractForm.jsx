import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Spin, Switch, Typography, InputNumber } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import contractAPI from '../../api/contracts';
import clientAPI from '../../api/clients';
import dayjs from 'dayjs';

const { Title } = Typography;

const ContractForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
    if (isEdit) fetchContract();
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll({ limit: 100 });
      setClients(response.data.data.clients || []);
    } catch (error) {
      // silently fail
    }
  };

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await contractAPI.getById(id);
      const contract = response.data.data.contract;
      form.setFieldsValue({
        ...contract,
        client: contract.client?._id,
        startDate: contract.startDate ? dayjs(contract.startDate) : undefined,
        endDate: contract.endDate ? dayjs(contract.endDate) : undefined,
      });
    } catch (error) {
      message.error('فشل في جلب بيانات العقد');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const data = { ...values };
      if (!data.endDate) delete data.endDate;

      if (isEdit) {
        await contractAPI.update(id, data);
        message.success('تم تحديث العقد بنجاح');
      } else {
        await contractAPI.create(data);
        message.success('تم إضافة العقد بنجاح');
      }
      navigate('/contracts');
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حفظ العقد');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/contracts')} style={{ fontFamily: 'Cairo, sans-serif' }}>
          العودة للقائمة
        </Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل عقد' : 'إضافة عقد جديد'}</Title>
      </div>

      <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'نشط',
            currency: 'USD',
            dueDayOfMonth: 10,
            'autoGeneration.enabled': true,
            'autoGeneration.dayOfMonth': 1,
            'autoGeneration.autoConfirm': false,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="client" label="العميل" rules={[{ required: true, message: 'العميل مطلوب' }]}>
                <Select
                  placeholder="اختر العميل"
                  showSearch
                  optionFilterProp="label"
                  options={clients.map(c => ({
                    value: c._id,
                    label: c.company ? `${c.name} - ${c.company}` : c.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <FormField name="title" label="عنوان العقد" rules={[{ required: true, message: 'عنوان العقد مطلوب' }]} placeholder="مثال: عقد تسويق شهري" />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField name="serviceType" label="نوع الخدمة" rules={[{ required: true, message: 'نوع الخدمة مطلوب' }]} placeholder="مثال: تسويق رقمي" />
            </Col>
            <Col xs={24} md={6}>
              <FormField name="defaultMonthlyValue" label="القيمة الشهرية" type="number" rules={[{ required: true, message: 'القيمة مطلوبة' }]} min={0} />
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="currency" label="العملة">
                <Select
                  options={[
                    { value: 'USD', label: 'دولار $' },
                    { value: 'ILS', label: 'شيكل ₪' },
                    { value: 'SAR', label: 'ريال ﷼' },
                    { value: 'JOD', label: 'دينار د.أ' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField name="startDate" label="تاريخ البداية" type="date" rules={[{ required: true, message: 'تاريخ البداية مطلوب' }]} />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="endDate" label="تاريخ النهاية (اختياري)" type="date" />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="dueDayOfMonth" label="يوم الاستحقاق الشهري" type="number" min={1} max={31} />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select
                  options={[
                    { value: 'نشط', label: 'نشط' },
                    { value: 'متوقف', label: 'متوقف' },
                    { value: 'منتهي', label: 'منتهي' },
                    { value: 'ملغي', label: 'ملغي' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <FormField name="description" label="الوصف" type="textarea" placeholder="وصف الخدمة المقدمة..." />
            </Col>
          </Row>

          {/* إعدادات التوليد التلقائي */}
          <Card title="إعدادات التوليد التلقائي للفواتير" size="small" style={{ marginTop: 16, background: '#f8fafc' }}>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item name={['autoGeneration', 'enabled']} label="تفعيل التوليد التلقائي" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <FormField name={['autoGeneration', 'dayOfMonth']} label="يوم التوليد" type="number" min={1} max={28} />
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['autoGeneration', 'autoConfirm']} label="تأكيد تلقائي" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/contracts')} style={{ fontFamily: 'Cairo, sans-serif' }}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} style={{ fontFamily: 'Cairo, sans-serif' }}>
                {isEdit ? 'تحديث العقد' : 'حفظ العقد'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ContractForm;