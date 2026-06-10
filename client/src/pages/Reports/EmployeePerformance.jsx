import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Typography, Progress } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import reportAPI from '../../api/reports';

const { Title } = Typography;

const EmployeePerformance = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.employeePerformance()
      .then(res => setData(res.data.data.employees || []))
      .catch(() => message.error('فشل في جلب البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'الموظف', dataIndex: 'name', key: 'name' },
    { title: 'المسمى', dataIndex: 'jobTitle', key: 'job' },
    { title: 'القسم', dataIndex: 'department', key: 'dept', render: (d) => d || '—' },
    { title: 'المشاريع', key: 'projects', align: 'center', render: (_, r) => r.computedStats?.activeProjects || 0 },
    { title: 'المهام المنجزة', key: 'tasks', align: 'center', render: (_, r) => `${r.computedStats?.completedTasks || 0}/${r.computedStats?.totalTasks || 0}` },
    { title: 'الساعات', key: 'hours', align: 'center', render: (_, r) => r.computedStats?.totalHoursWorked || 0 },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a onClick={() => navigate('/reports')} style={{ cursor: 'pointer', color: '#3b82f6' }}><ArrowRightOutlined /> التقارير</a>
        <Title level={4} style={{ margin: 0 }}>أداء الموظفين</Title>
      </div>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={data} rowKey="_id" locale={{ emptyText: 'لا يوجد موظفون' }} />
      </Card>
    </div>
  );
};

export default EmployeePerformance;