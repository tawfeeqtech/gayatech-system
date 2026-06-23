import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, Typography, Spin, Switch } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import SmartSelect from '../../components/ui/SmartSelect';
import employeeAPI from '../../api/employees';
import jobTitleAPI from '../../api/jobTitles';
import dayjs from 'dayjs';
import { useCurrencies } from '../../hooks/useCurrencies';
import toast from 'react-hot-toast';

const { Title } = Typography;

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobTitles, setJobTitles] = useState([]);
  const [jobTitlesLoading, setJobTitlesLoading] = useState(false);

  useEffect(() => {
    // جلب المسميات الوظيفية
    setJobTitlesLoading(true);
    jobTitleAPI.getAll()
      .then((res) => {
        const titles = res.data.data?.jobTitles || res.data.data || [];
        setJobTitles(titles.map((t) => ({ value: t.name || t.title || t, label: t.name || t.title || t })));
      })
      .catch(() => {
        // لا نعرض خطأ إذا فشل - المكون سيعمل بشكل عادي
        setJobTitles([]);
      })
      .finally(() => setJobTitlesLoading(false));
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      employeeAPI.getById(id)
        .then(r => {
          const e = r.data.data.employee;
          form.setFieldsValue({ ...e, joiningDate: e.joiningDate ? dayjs(e.joiningDate) : undefined });
        })
        .catch(() => { toast.error('فشل في جلب البيانات'); navigate('/employees'); })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const ensureJobTitleCreated = async (titleValue) => {
    // إذا كانت القيمة موجودة بالفعل في الخيارات، لا داعي لإنشائها
    const exists = jobTitles.some(
      (t) => t.value?.toString().toLowerCase() === titleValue?.toString().toLowerCase()
    );
    if (exists || !titleValue) return titleValue;
    try {
      const res = await jobTitleAPI.create({ name: titleValue });
      const created = res.data.data?.jobTitle || res.data.data;
      const name = created?.name || created?.title || titleValue;
      // تحديث القائمة المحلية
      setJobTitles((prev) => [...prev, { value: name, label: name }]);
      return name;
    } catch {
      // إذا فشل الإنشاء، نستمر بالقيمة كما هي
      return titleValue;
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // تأكد من أن المسمى الوظيفي الجديد قد أضيف في الـ backend
      const finalJobTitle = await ensureJobTitleCreated(values.jobTitle);
      const payload = { ...values, jobTitle: finalJobTitle };
      if (isEdit) { await employeeAPI.update(id, payload); toast.success('تم التحديث'); }
      else { await employeeAPI.create(payload); toast.success('تمت الإضافة'); }
      navigate('/employees');
    } catch (e) { toast.error(e.response?.data?.message || 'فشل في الحفظ'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/employees')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل موظف' : 'إضافة موظف'}</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ status: 'نشط', salaryCurrency: 'USD' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}><FormField name="name" label="الاسم" rules={[{ required: true }]} /></Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="jobTitle"
                label={<span style={{ fontFamily: 'Cairo, sans-serif' }}>المسمى الوظيفي</span>}
                rules={[{ required: true, message: 'المسمى الوظيفي مطلوب' }]}
              >
                <SmartSelect
                  options={jobTitles}
                  placeholder="ابحث أو اكتب مسمى وظيفي..."
                  allowCreate
                  loading={jobTitlesLoading}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}><FormField name="email" label="البريد الإلكتروني" /></Col>
            <Col xs={24} md={8}><FormField name="phone" label="الهاتف" /></Col>
            <Col xs={24} md={8}><FormField name="department" label="القسم" /></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={6}><FormField name="baseSalary" label="الراتب الأساسي" type="number" rules={[{ required: true }]} min={0} /></Col>
            <Col xs={24} md={6}>
              <Form.Item name="salaryCurrency" label="العملة">
                <Select options={currencies} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="autoGenerateSalary" label="توليد الرواتب تلقائياً" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}><FormField name="joiningDate" label="تاريخ الانضمام" type="date" rules={[{ required: true }]} /></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'نشط', label: 'نشط' }, { value: 'إجازة', label: 'إجازة' },
                  { value: 'متوقف', label: 'متوقف' }, { value: 'مستقيل', label: 'مستقيل' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}><FormField name="notes" label="ملاحظات" type="textarea" /></Col>
          </Row>
          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/employees')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {isEdit ? 'تحديث' : 'حفظ'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EmployeeForm;