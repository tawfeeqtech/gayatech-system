import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Descriptions, Button, Spin, Table, Tag, Space, message, Progress, Form, Input, Select } from 'antd';
import { ArrowRightOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import projectAPI from '../../api/projects';
import projectTaskAPI from '../../api/projectTasks';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [taskForm] = Form.useForm();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchData();
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => { });
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([projectAPI.getById(id), projectAPI.getTasks(id)]);
      setProject(pRes.data.data.project);
      setTasks(tRes.data.data.tasks || []);
    } catch { message.error('فشل في جلب البيانات'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const handleAddTask = async (values) => {
    try {
      await projectTaskAPI.create(id, { ...values, status: 'لم تبدأ' });
      message.success('تمت إضافة المهمة');
      setShowTaskForm(false);
      taskForm.resetFields();
      fetchData();
    } catch (e) { message.error('فشل في إضافة المهمة'); }
  };

  const handleTaskStatus = async (taskId, status) => {
    try { await projectTaskAPI.updateStatus(taskId, status); fetchData(); }
    catch { message.error('فشل في تحديث الحالة'); }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try { await projectTaskAPI.delete(deleteTarget); message.success('تم حذف المهمة'); setDeleteTarget(null); fetchData(); }
    catch { message.error('فشل في الحذف'); }
  };

  const handleAddTasksFromTeam = async () => {
    console.log('👥 Team data:', project?.team);
    
    if (!project?.team || project.team.length === 0) {
      message.warning('لا يوجد فريق عمل لتوليد المهام');
      return;
    }

    let created = 0;
    for (const member of project.team) {
      console.log('Member:', member);
      
      const employeeId = typeof member.employee === 'object' 
        ? member.employee?._id 
        : member.employee;
      
      const employeeName = typeof member.employee === 'object' 
        ? member.employee?.name 
        : 'عضو الفريق';
      
      if (!employeeId) {
        console.log('❌ No employee ID for:', member);
        continue;
      }

      try {
        const taskData = {
          title: `${member.role || 'مهمة'} - ${employeeName}`,
          description: `مهمة ${member.role || ''} ضمن مشروع ${project.title}`,
          assignedTo: [{ employee: employeeId, role: member.role }],
          priority: 'متوسطة',
          status: 'لم تبدأ',
        };
        
        console.log('📝 Creating task:', taskData);
        
        await projectTaskAPI.create(id, taskData);
        created++;
      } catch (e) {
        console.error('❌ Failed to create task:', e.response?.data || e.message);
      }
    }
    
    if (created > 0) {
      message.success(`تم إنشاء ${created} مهمة من الفريق`);
      fetchData();
    } else {
      message.warning('لم يتم إنشاء أي مهمة - تحقق من Console');
    }
  };

  const taskColumns = [
    { title: 'المهمة', dataIndex: 'title', key: 'title' },
    { title: 'المسؤول', key: 'assignee', render: (_, r) => r.assignedTo?.map(a => a.employee?.name).join(', ') || '—' },
    {
      title: 'الأولوية', dataIndex: 'priority', key: 'priority', render: (p) => {
        const colors = { 'منخفضة': 'default', 'متوسطة': 'blue', 'عالية': 'orange', 'حرجة': 'red' };
        return <Tag color={colors[p]}>{p}</Tag>;
      }
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', render: (s) => {
        const colors = { 'لم تبدأ': 'default', 'قيد التنفيذ': 'processing', 'تحت المراجعة': 'warning', 'مكتملة': 'success', 'ملغاة': 'red' };
        return <Tag color={colors[s]}>{s}</Tag>;
      }
    },
    {
      title: 'إجراءات', key: 'actions', width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'مكتملة' && (
            <Button size="small" type="primary" onClick={() => handleTaskStatus(record._id, 'مكتملة')}>إكمال</Button>
          )}
          {record.status === 'لم تبدأ' && (
            <Button size="small" onClick={() => handleTaskStatus(record._id, 'قيد التنفيذ')}>بدء</Button>
          )}
          <Button size="small" danger onClick={() => setDeleteTarget(record._id)}>حذف</Button>
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!project) return null;

  const stats = project.computedStats || {};

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/projects')}>العودة</Button>
          <div>
            <h2 style={{ margin: 0 }}>{project.title}</h2>
            <Tag color="purple">{project.projectNumber}</Tag>
          </div>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/projects/edit/${id}`)}>تعديل</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><StatCard title="نسبة الإنجاز" value={stats.progressPercentage || 0} suffix="%" color="#3b82f6" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="المهام" value={`${stats.completedTasks || 0}/${stats.totalTasks || 0}`} color="#8b5cf6" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="القيمة" value={project.totalValue} prefix="$" color="#f59e0b" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="الساعات" value={stats.totalHoursSpent || 0} color="#10b981" /></Col>
      </Row>

      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات المشروع" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="العميل">{project.client?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="نوع الخدمة">{project.serviceType}</Descriptions.Item>
          <Descriptions.Item label="الحالة"><StatusBadge status={project.status} mapping={statusColors.project} /></Descriptions.Item>
          <Descriptions.Item label="تاريخ البداية">{project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA') : '—'}</Descriptions.Item>
          <Descriptions.Item label="تاريخ التسليم">{project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString('ar-SA') : '—'}</Descriptions.Item>
          <Descriptions.Item label="نوع الدفع">{project.paymentType}</Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 16 }}>
          <Progress percent={stats.progressPercentage || 0} />
        </div>
      </Card>

      <Card
        title="المهام"
        extra={<Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowTaskForm(!showTaskForm)}>إضافة مهمة</Button>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => handleAddTasksFromTeam()}
          >
            توليد مهام من الفريق
          </Button>
        </Space>}
        style={{ borderRadius: 8 }}
      >
        {showTaskForm && (
          <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
            <Form form={taskForm} layout="inline" onFinish={handleAddTask}>
              <Form.Item name="title" rules={[{ required: true }]}><Input placeholder="عنوان المهمة" style={{ width: 200 }} /></Form.Item>
              <Form.Item name="priority"><Select placeholder="الأولوية" style={{ width: 120 }} options={[
                { value: 'منخفضة', label: 'منخفضة' }, { value: 'متوسطة', label: 'متوسطة' },
                { value: 'عالية', label: 'عالية' }, { value: 'حرجة', label: 'حرجة' },
              ]} /></Form.Item>
              <Form.Item name={['assignedTo', 0, 'employee']}><Select placeholder="مسؤول" style={{ width: 160 }}
                options={employees.map(e => ({ value: e._id, label: e.name }))} /></Form.Item>
              <Button type="primary" htmlType="submit">حفظ</Button>
              <Button onClick={() => setShowTaskForm(false)}>إلغاء</Button>
            </Form>
          </Card>
        )}
        <Table columns={taskColumns} dataSource={tasks} rowKey="_id" locale={{ emptyText: 'لا توجد مهام' }} />
      </Card>

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteTask}
        title="تأكيد حذف المهمة" message="هل أنت متأكد من حذف هذه المهمة؟" type="danger" />
    </div>
  );
};

export default ProjectDetail;