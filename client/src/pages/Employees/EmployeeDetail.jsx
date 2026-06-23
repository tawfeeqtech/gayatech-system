import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Descriptions, Button, Spin, Table, Tag } from 'antd';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import employeeAPI from '../../api/employees';
import salaryAPI from '../../api/salaries';
import advanceAPI from '../../api/advances';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const EmployeeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeeAPI.getById(id),
      salaryAPI.getAll({ employee: id }).catch(() => ({ data: { data: { salaries: [] } } })),
      advanceAPI.getAll({ employee: id }).catch(() => ({ data: { data: { advances: [] } } })),
    ]).then(([eRes, sRes, aRes]) => {
      setEmployee(eRes.data.data.employee);
      setSalaries(sRes.data?.data?.salaries || []);
      setAdvances(aRes.data?.data?.advances || []);
    }).catch(() => toast.error('فشل في جلب البيانات'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!employee) return null;

  const stats = employee.computedStats || {};

  const salaryColumns = [
    { title: 'الشهر', dataIndex: 'month', key: 'month' },
    { title: 'المبلغ', dataIndex: 'totalAmount', key: 'amount', render: (v) => formatCurrency(v) },
    { title: 'المدفوع', dataIndex: 'paidAmount', key: 'paid' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'مدفوع' ? 'green' : s === 'مستحق' ? 'orange' : 'blue'}>{s}</Tag>,
    },
  ];

  const advanceColumns = [
    { title: 'التاريخ', dataIndex: 'requestDate', key: 'date', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v) => formatCurrency(v) },
    { title: 'المسدد', dataIndex: 'repaidAmount', key: 'repaid' },
    { title: 'المتبقي', dataIndex: 'remainingAmount', key: 'rem' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'مسددة' ? 'green' : s === 'موافق عليها' ? 'blue' : 'orange'}>{s}</Tag>,
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/employees')}>العودة</Button>
          <div><h2 style={{ margin: 0 }}>{employee.name}</h2><span style={{ color: '#64748b' }}>{employee.jobTitle}</span></div>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/employees/edit/${id}`)}>تعديل</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}><StatCard title="الراتب" value={employee.baseSalary} prefix="$" color="#3b82f6" /></Col>
        <Col xs={24} sm={6}><StatCard title="المشاريع" value={stats.activeProjects || 0} color="#8b5cf6" /></Col>
        <Col xs={24} sm={6}><StatCard title="المهام المنجزة" value={stats.completedTasks || 0} color="#10b981" /></Col>
        <Col xs={24} sm={6}><StatCard title="سلف معلقة" value={stats.pendingAdvances || 0} prefix="$" color="#f59e0b" /></Col>
      </Row>

      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="المعلومات الأساسية" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="البريد">{employee.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="الهاتف">{employee.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="القسم">{employee.department || '—'}</Descriptions.Item>
          <Descriptions.Item label="تاريخ الانضمام">{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('ar-SA') : '—'}</Descriptions.Item>
          <Descriptions.Item label="الحالة"><StatusBadge status={employee.status} mapping={statusColors.client} /></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ borderRadius: 8 }}>
        <Tabs items={[
          { key: 'salaries', label: 'الرواتب', children: <Table columns={salaryColumns} dataSource={salaries} rowKey="_id" locale={{ emptyText: 'لا توجد رواتب' }} /> },
          { key: 'advances', label: 'السلف', children: <Table columns={advanceColumns} dataSource={advances} rowKey="_id" locale={{ emptyText: 'لا توجد سلف' }} /> },
        ]} />
      </Card>
    </div>
  );
};

export default EmployeeDetail;