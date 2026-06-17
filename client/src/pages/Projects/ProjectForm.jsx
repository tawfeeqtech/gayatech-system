import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Spin, Typography, Switch } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import projectAPI from '../../api/projects';
import projectTaskAPI from '../../api/projectTasks';
import clientAPI from '../../api/clients';
import employeeAPI from '../../api/employees';
import dayjs from 'dayjs';
import { useCurrencies } from '../../hooks/useCurrencies';

const { Title } = Typography;

const ProjectForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customRoles, setCustomRoles] = useState([
    'مطور رئيسي', 'مطور مساعد', 'مصمم رئيسي', 'مصمم جرافيك',
    'مسوق رقمي', 'مدير مشروع', 'محلل بيانات', 'مهندس DevOps',
    'مختبر جودة', 'مستشار تقني', 'مدقق مالي', 'مساعد إداري'
  ]);

  useEffect(() => {
    Promise.all([fetchClients(), fetchEmployees()]);
    if (isEdit) fetchProject();
  }, [id]);

  const fetchClients = async () => {
    try { const r = await clientAPI.getAll({ limit: 100 }); setClients(r.data.data.clients || []); } catch {}
  };
  const fetchEmployees = async () => {
    try { const r = await employeeAPI.getAll({ limit: 100 }); setEmployees(r.data.data.employees || []); } catch {}
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const r = await projectAPI.getById(id);
      const p = r.data.data.project;
      form.setFieldsValue({
        ...p,
        client: p.client?._id,
        startDate: p.startDate ? dayjs(p.startDate) : undefined,      // ✅ dayjs
        deliveryDate: p.deliveryDate ? dayjs(p.deliveryDate) : undefined, // ✅ dayjs
        team: p.team?.map(t => ({ employee: t.employee?._id, role: t.role })),
      });
    } catch { 
      message.error('فشل في جلب بيانات المشروع'); 
      navigate('/projects'); 
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { autoGenerateTasks, team, ...projectData } = values;

      const dataToSend = {
        ...projectData,
        team: team || [], 
      };
      
      console.log('📋 Form values:', values);
      console.log('👥 Team:', team);
      console.log('🔄 Auto generate:', autoGenerateTasks);
      
      let projectId = id; // استخدم id الموجود إذا كان تعديل
      
      if (isEdit) {
        await projectAPI.update(id, projectData);
        message.success('تم تحديث المشروع');
      } else {
        const result = await projectAPI.create(projectData);
        projectId = result?.data?.data?.project?._id;
        console.log('✅ Project created, ID:', projectId);
        message.success('تم إضافة المشروع');
      }

      // 👈 توليد مهام تلقائية للفريق
      if (!isEdit && autoGenerateTasks !== false && team && team.length > 0 && projectId) {
        console.log('🚀 Generating tasks for project:', projectId);
        
        for (const member of team) {
          if (member.employee && member.role) {
            const emp = employees.find(e => e._id === member.employee);
            const taskTitle = `${member.role} - ${emp?.name || 'عضو الفريق'}`;
            
            console.log('📝 Creating task:', taskTitle);
            
            try {
              await projectTaskAPI.create(projectId, {
                title: taskTitle,
                description: `مهمة ${member.role} ضمن مشروع ${projectData.title}`,
                assignedTo: [{ employee: member.employee, role: member.role }],
                priority: 'متوسطة',
                status: 'لم تبدأ',
                startDate: member.startDate || new Date(),
              });
              console.log('✅ Task created:', taskTitle);
            } catch (e) {
              console.error('❌ Failed to create task:', e.response?.data || e.message);
            }
          }
        }
        
        message.success('تم إنشاء المهام للفريق بنجاح');
      } else {
        console.log('⏭️ Skipping task generation:', { autoGenerateTasks, teamLength: team?.length, projectId });
      }

      navigate('/projects');
    } catch (e) {
      console.error('❌ Submit error:', e);
      message.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/projects')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل مشروع' : 'إضافة مشروع جديد'}</Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ status: 'قيد التخطيط', currency: 'USD', paymentType: 'دفعة واحدة' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="client" label="العميل" rules={[{ required: true, message: 'العميل مطلوب' }]}>
                <Select placeholder="اختر العميل" showSearch optionFilterProp="label"
                  options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <FormField name="title" label="عنوان المشروع" rules={[{ required: true, message: 'العنوان مطلوب' }]} placeholder="مثال: تصميم هوية بصرية" />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField name="serviceType" label="نوع الخدمة" rules={[{ required: true }]} placeholder="مثال: تصميم جرافيك" />
            </Col>
            <Col xs={24} md={6}>
              <FormField name="totalValue" label="قيمة المشروع" type="number" rules={[{ required: true }]} min={0} />
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="currency" label="العملة">
                <Select options={currencies} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField name="startDate" label="تاريخ البداية" type="date" rules={[{ required: true }]} />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="deliveryDate" label="تاريخ التسليم" type="date" rules={[{ required: true }]} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'قيد التخطيط', label: 'قيد التخطيط' }, { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
                  { value: 'تحت المراجعة', label: 'تحت المراجعة' }, { value: 'مكتمل', label: 'مكتمل' },
                  { value: 'تم التسليم', label: 'تم التسليم' }, { value: 'متوقف', label: 'متوقف' }, { value: 'ملغي', label: 'ملغي' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="paymentType" label="نوع الدفعات">
                <Select options={[
                  { value: 'دفعة واحدة', label: 'دفعة واحدة' }, { value: 'مرحلي', label: 'مرحلي' },
                  { value: 'حسب الإنجاز', label: 'حسب الإنجاز' }, { value: 'شهري', label: 'شهري' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="deliveryStatus" label="حالة التسليم">
                <Select options={[
                  { value: 'لم يبدأ', label: 'لم يبدأ' }, { value: 'قيد التسليم', label: 'قيد التسليم' },
                  { value: 'تم التسليم', label: 'تم التسليم' }, { value: 'مقبول', label: 'مقبول' }, { value: 'مرفوض', label: 'مرفوض' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* فريق العمل */}
          <Card title="فريق العمل" size="small" style={{ marginTop: 16, background: '#f8fafc' }}>
            <Form.List name="team">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                      <Col xs={10}>
                        <Form.Item {...rest} name={[name, 'employee']} rules={[{ required: true, message: 'اختر موظف' }]} label="اختر موظف" noStyle>
                          <Select 
                            placeholder="اختر موظف" 
                            showSearch 
                            optionFilterProp="label"
                            style={{ width: '100%' }} // <--- هذا السطر سيجبر الحقل على التمدد بكامل مساحة العمود
                            dropdownMatchSelectWidth={false} // لكي تفتح القائمة المنسدلة بعرض النص الطويل إذا تجاوز الحقل
                            options={employees.map(e => ({ 
                              value: e._id, 
                              label: `${e.name} - ${e.jobTitle}` 
                            }))} 
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={6}>
                        <Form.Item {...rest} name={[name, 'role']} rules={[{ required: true, message: 'الدور مطلوب' }]} label="اختر أو اكتب دوراً" noStyle>
                          <Select 
                            placeholder="اختر أو اكتب دوراً"
                            showSearch
                            optionFilterProp="label"
                            style={{ width: '100%' }} // <--- إضافة العرض الكامل هنا أيضاً لتوحيد المظهر
                            dropdownMatchSelectWidth={false}
                            options={customRoles.map(role => ({ value: role, label: role }))}
                            onSearch={(value) => {
                              if (value && !customRoles.includes(value)) {
                                setCustomRoles(prev => [...new Set([...prev, value])]);
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={6}>
                        <Form.Item {...rest} name={[name, 'startDate']} noStyle>
                          <input type="date" placeholder="تاريخ البداية" 
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Col xs={2}>
                        <Button danger onClick={() => remove(name)} style={{ width: '100%' }}>✕</Button>
                      </Col>
                    </Row>
                  ))}
                  <Space>
                    <Button type="dashed" onClick={() => add({ role: '', startDate: '' })} block>
                      + إضافة عضو للفريق
                    </Button>
                    <Button type="link" onClick={() => {
                      const newRole = prompt('أدخل اسم الدور الجديد:');
                      if (newRole && !customRoles.includes(newRole)) {
                        setCustomRoles(prev => [...prev, newRole]);
                        message.success(`تمت إضافة "${newRole}" إلى قائمة الأدوار`);
                      }
                    }}>
                      + إدارة الأدوار
                    </Button>
                  </Space>
                </>
              )}
            </Form.List>
          </Card>

          <Card size="small" style={{ marginTop: 16, background: '#f0f9ff', borderRadius: 8 }}>
            <Form.Item name="autoGenerateTasks" label="توليد مهام تلقائية للفريق" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              سيتم إنشاء مهمة لكل عضو في الفريق بناءً على دوره في المشروع
            </div>
          </Card>

          <Row gutter={24} style={{ marginTop: 16 }}>
            <Col span={24}>
              <FormField name="description" label="الوصف" type="textarea" placeholder="وصف المشروع..." />
            </Col>
          </Row>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/projects')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {isEdit ? 'تحديث المشروع' : 'حفظ المشروع'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectForm;