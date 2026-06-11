import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography, AutoComplete } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import subscriptionAPI from '../../api/subscriptions';

const { Title } = Typography;

// تصنيفات افتراضية
const DEFAULT_CATEGORIES = [
  'استضافة',
  'خدمات سحابية',
  'برمجيات',
  'أدوات',
  'تسويق',
  'تعليم',
  'أمان',
  'نطاقات',
  'أخرى',
];

const SubscriptionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [status, setStatus] = useState('نشط');

  useEffect(() => {
    // تحميل التصنيفات المحفوظة من localStorage
    const saved = localStorage.getItem('subscription_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCategories([...new Set([...DEFAULT_CATEGORIES, ...parsed])]);
      } catch {}
    }

    if (isEdit) fetchSubscription();
  }, [id]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await subscriptionAPI.getAll({ limit: 100 });
      const allSubs = res.data.data.subscriptions || [];
      const sub = allSubs.find(s => s._id === id);
      if (sub) {
        form.setFieldsValue({
          ...sub,
          startDate: sub.startDate?.split('T')[0],
          endDate: sub.endDate?.split('T')[0],
        });
        setStatus(sub.status);
      }
    } catch {
      message.error('فشل في جلب بيانات الاشتراك');
      navigate('/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // حساب الحالة تلقائياً بناءً على تاريخ الانتهاء
  const calculateStatus = (endDate) => {
    if (!endDate) return 'نشط';
    
    const now = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'منتهي';
    if (diffDays <= 30) return 'قريب';
    return 'نشط';
  };

  const onEndDateChange = (date) => {
    if (date) {
      const newStatus = calculateStatus(date);
      setStatus(newStatus);
      form.setFieldsValue({ status: newStatus });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // حفظ التصنيف الجديد إذا كان غير موجود
      if (values.category && !categories.includes(values.category)) {
        const newCategories = [...categories, values.category];
        setCategories(newCategories);
        localStorage.setItem('subscription_categories', JSON.stringify(newCategories));
      }

      // حساب الحالة النهائية
      const finalStatus = calculateStatus(values.endDate);
      
      const data = {
        ...values,
        status: values.status || finalStatus,
      };

      if (isEdit) {
        await subscriptionAPI.update(id, data);
        message.success('تم تحديث الاشتراك');
      } else {
        await subscriptionAPI.create(data);
        message.success('تمت إضافة الاشتراك');
      }
      navigate('/subscriptions');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}>جاري التحميل...</div>;
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/subscriptions')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل اشتراك' : 'إضافة اشتراك جديد'}</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ currency: 'USD', renewalType: 'سنوي', status: 'نشط' }}>
          
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="provider" label="المزود" rules={[{ required: true, message: 'المزود مطلوب' }]}>
                <input placeholder="مثال: Vercel, AWS, Google..." 
                  style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'Cairo, sans-serif' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="serviceName" label="اسم الخدمة" rules={[{ required: true, message: 'اسم الخدمة مطلوب' }]}>
                <input placeholder="مثال: خطة Pro, Basic Hosting..."
                  style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'Cairo, sans-serif' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="التصنيف" rules={[{ required: true, message: 'التصنيف مطلوب' }]}>
                <AutoComplete
                  placeholder="اختر أو اكتب تصنيفاً جديداً"
                  options={categories.map(c => ({ value: c, label: c }))}
                  filterOption={(inputValue, option) =>
                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="amount" label="القيمة" rules={[{ required: true, message: 'القيمة مطلوبة' }]}>
                <input type="number" min={0} step="0.01" placeholder="0.00"
                  style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'Cairo, sans-serif' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[
                  { value: 'USD', label: 'دولار $' },
                  { value: 'ILS', label: 'شيكل ₪' },
                  { value: 'SAR', label: 'ريال ﷼' },
                  { value: 'JOD', label: 'دينار د.أ' },
                  { value: 'EUR', label: 'يورو €' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="renewalType" label="نوع التجديد">
                <Select options={[
                  { value: 'شهري', label: 'شهري' },
                  { value: 'ربع سنوي', label: 'ربع سنوي' },
                  { value: 'نصف سنوي', label: 'نصف سنوي' },
                  { value: 'سنوي', label: 'سنوي' },
                  { value: 'مرة واحدة', label: 'مرة واحدة' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="startDate" label="تاريخ البداية" rules={[{ required: true, message: 'تاريخ البداية مطلوب' }]}>
                <input type="date"
                  style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'Cairo, sans-serif' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="endDate" label="تاريخ الانتهاء" rules={[{ required: true, message: 'تاريخ الانتهاء مطلوب' }]}>
                <input type="date" onChange={(e) => onEndDateChange(e.target.value)}
                  style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'Cairo, sans-serif' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'نشط', label: '🟢 نشط' },
                  { value: 'قريب', label: '🟡 قريب من الانتهاء' },
                  { value: 'منتهي', label: '🔴 منتهي' },
                  { value: 'ملغي', label: '⚫ ملغي' },
                  { value: 'بانتظار التجديد', label: '🔵 بانتظار التجديد' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* معلومات الحالة التلقائية */}
          <div style={{ 
            background: '#f0f9ff', 
            padding: '12px 16px', 
            borderRadius: 8, 
            marginTop: 8,
            fontSize: 13,
            color: '#1e40af' 
          }}>
            💡 <strong>الحالة التلقائية:</strong> {status === 'نشط' ? '🟢' : status === 'قريب' ? '🟡' : '🔴'} {
              status === 'نشط' ? 'الاشتراك نشط' :
              status === 'قريب' ? 'سينتهي خلال 30 يوماً' :
              status === 'منتهي' ? 'الاشتراك منتهي' : ''
            }
          </div>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/subscriptions')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {isEdit ? 'تحديث الاشتراك' : 'حفظ الاشتراك'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SubscriptionForm;