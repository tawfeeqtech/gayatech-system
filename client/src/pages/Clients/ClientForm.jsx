import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Spin, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import clientAPI from '../../api/clients';
import { useCurrencies } from '../../hooks/useCurrencies';

const { Title } = Typography;

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await clientAPI.getById(id);
      const client = response.data.data.client;
      form.setFieldsValue(client);
    } catch (error) {
      message.error('فشل في جلب بيانات العميل');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await clientAPI.update(id, values);
        message.success('تم تحديث العميل بنجاح');
      } else {
        await clientAPI.create(values);
        message.success('تم إضافة العميل بنجاح');
      }
      navigate('/clients');
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حفظ العميل');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          icon={<ArrowRightOutlined />}
          onClick={() => navigate('/clients')}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          العودة للقائمة
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? 'تعديل عميل' : 'إضافة عميل جديد'}
        </Title>
      </div>

      <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            clientType: 'شركة',
            status: 'نشط',
            preferredCurrency: 'USD',
            country: 'فلسطين',
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField
                name="name"
                label="اسم العميل"
                rules={[{ required: true, message: 'اسم العميل مطلوب' }]}
                placeholder="أدخل اسم العميل"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                name="company"
                label="اسم الشركة"
                placeholder="أدخل اسم الشركة (اختياري)"
              />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField
                name="email"
                label="البريد الإلكتروني"
                type="text"
                placeholder="example@domain.com"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormField
                name="phone"
                label="رقم الهاتف"
                placeholder="0599xxxxxx"
              />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="clientType"
                label={<span>نوع العميل</span>}
              >
                <Select
                  placeholder="اختر نوع العميل"
                  options={[
                    { value: 'شركة', label: 'شركة' },
                    { value: 'مؤسسة', label: 'مؤسسة' },
                    { value: 'فرد', label: 'فرد' },
                    { value: 'جهة حكومية', label: 'جهة حكومية' },
                    { value: 'أخرى', label: 'أخرى' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label={<span>الحالة</span>}
              >
                <Select
                  placeholder="اختر الحالة"
                  options={[
                    { value: 'نشط', label: 'نشط' },
                    { value: 'غير نشط', label: 'غير نشط' },
                    { value: 'متوقف مؤقتاً', label: 'متوقف مؤقتاً' },
                    { value: 'محظور', label: 'محظور' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="preferredCurrency"
                label={<span>العملة المفضلة</span>}
              >
                <Select
                  placeholder="اختر العملة"
                  options={currencies}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name={['address', 'city']} label={<span>المدينة</span>}>
                <Select
                  placeholder="اختر المدينة"
                  allowClear
                  options={[
                    { value: 'غزة', label: 'غزة' },
                    { value: 'رام الله', label: 'رام الله' },
                    { value: 'نابلس', label: 'نابلس' },
                    { value: 'الخليل', label: 'الخليل' },
                    { value: 'أخرى', label: 'أخرى' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['address', 'street']} label={<span>العنوان</span>}>
                <Select
                  placeholder="أدخل العنوان"
                  allowClear
                  options={[]}
                  mode={undefined}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <FormField
                name="notes"
                label="ملاحظات"
                type="textarea"
                placeholder="أي ملاحظات إضافية..."
              />
            </Col>
          </Row>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button
                onClick={() => navigate('/clients')}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                إلغاء
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {isEdit ? 'تحديث العميل' : 'حفظ العميل'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ClientForm;