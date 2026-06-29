import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, Typography, Spin, Switch } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import SmartSelect from '../../components/ui/SmartSelect';
import employeeAPI from '../../api/employees';
import jobTitleAPI from '../../api/jobTitles';
import departmentAPI from '../../api/departments';
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
  const DEFAULT_JOB_TITLES = [
    'مستقطب مشاريع', 'تصميم ومونتاج', 'تصميم متاجر',
    'ادارة متاجر', 'ادارة حملات اعلانية', 'مصمم جرافيك',
    'مسوقين', 'مبرمجين', 'مونتاج', 'ادارة صفحات', 'مصورين',
  ];
  const [jobTitles, setJobTitles] = useState(
    DEFAULT_JOB_TITLES.map((t) => ({ value: t, label: t }))
  );
  const [jobTitlesLoading, setJobTitlesLoading] = useState(false);

  useEffect(() => {
    // جلب المسميات الوظيفية من قاعدة البيانات + دمجها مع الافتراضية
    setJobTitlesLoading(true);
    jobTitleAPI.getAll()
      .then((res) => {
        const titles = res.data.data?.jobTitles || res.data.data || [];
        const apiTitles = titles.map((t) => ({ value: t.name || t.title || t, label: t.name || t.title || t }));
        // دمج مع الافتراضية وتفادي التكرار
        const allTitles = [...DEFAULT_JOB_TITLES.map((t) => ({ value: t, label: t })), ...apiTitles];
        const seen = new Set();
        setJobTitles(allTitles.filter((t) => {
          const key = t.value?.toString().trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }));
      })
      .catch(() => {
        // في حال فشل الـ API، نستعمل الافتراضية (موجودة في initial state)
        setJobTitles(DEFAULT_JOB_TITLES.map((t) => ({ value: t, label: t })));
      })
      .finally(() => setJobTitlesLoading(false));
  }, []);

  const DEFAULT_DEPARTMENTS = [
    'ادارة', 'تقنية', 'تسويق', 'مبيعات', 'تصميم',
    'محاسبة', 'موارد بشرية', 'خدمة عملاء', 'مشتريات',
  ];
  const [departments, setDepartments] = useState(
    DEFAULT_DEPARTMENTS.map((d) => ({ value: d, label: d }))
  );
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  useEffect(() => {
    setDepartmentsLoading(true);
    departmentAPI.getAll()
      .then((res) => {
        const deps = res.data.data?.departments || res.data.data || [];
        const apiDeps = deps.map((d) => ({ value: d.name || d, label: d.name || d }));
        const allDeps = [...DEFAULT_DEPARTMENTS.map((d) => ({ value: d, label: d })), ...apiDeps];
        const seen = new Set();
        setDepartments(allDeps.filter((d) => {
          const key = d.value?.toString().trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }));
      })
      .catch(() => setDepartments(DEFAULT_DEPARTMENTS.map((d) => ({ value: d, label: d }))))
      .finally(() => setDepartmentsLoading(false));
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

  const ensureDepartmentCreated = async (deptValue) => {
    if (!deptValue) return deptValue;
    const exists = departments.some(
      (d) => d.value?.toString().toLowerCase() === deptValue?.toString().toLowerCase()
    );
    if (exists) return deptValue;
    try {
      const res = await departmentAPI.create({ name: deptValue });
      const created = res.data.data?.department || res.data.data;
      const name = created?.name || deptValue;
      setDepartments((prev) => [...prev, { value: name, label: name }]);
      return name;
    } catch {
      return deptValue;
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // تأكد من أن المسمى الوظيفي والقسم الجديد أضيفا في الـ backend
      const finalJobTitle = await ensureJobTitleCreated(values.jobTitle);
      const finalDepartment = await ensureDepartmentCreated(values.department);
      const payload = { ...values, jobTitle: finalJobTitle, department: finalDepartment };
      if (isEdit) { await employeeAPI.update(id, payload); toast.success('تم التحديث'); }
      else { await employeeAPI.create(payload); toast.success('تمت الإضافة'); }
      navigate('/employees');
    } catch (e) { toast.error(e.response?.data?.message || 'فشل في الحفظ'); }
    finally { setSubmitting(false); }
  };


  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/employees')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل موظف' : 'إضافة موظف'}</Title>
      </div>

      <Spin spinning={loading}>
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
            <Col xs={24} md={8}><FormField name="department" label="القسم" type="smartselect" options={departments} allowCreate placeholder="أدخل القسم" loading={departmentsLoading} /></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={6}><FormField name="baseSalary" label="الراتب الأساسي" type="number" rules={[{ required: true }]} min={0} /></Col>
            <Col xs={24} md={6}>
              <FormField type="smartselect" name="salaryCurrency" label="العملة" options={currencies} allowCreate />
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
              <FormField type="smartselect" name="status" label="الحالة" options={[
                { value: 'نشط', label: 'نشط' }, { value: 'إجازة', label: 'إجازة' },
                { value: 'متوقف', label: 'متوقف' }, { value: 'مستقيل', label: 'مستقيل' },
              ]} allowCreate />
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
      </Spin>
    </div>
  );
};

export default EmployeeForm;