import React, { useState, useEffect, useCallback } from 'react';
import { Space, Tag, Button, Modal, Form, Select, Switch, Typography } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import userAPI from '../../api/users';
import employeeAPI from '../../api/employees';

const { Title } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, eRes] = await Promise.all([
        userAPI.getAll(),
        employeeAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: { employees: [] } } })),
      ]);
      setUsers(uRes.data.data.users);
      setEmployees(eRes.data.data.employees || []);
    } catch (error) { toast.error('فشل في جلب المستخدمين'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await userAPI.update(editingUser._id, values);
        toast.success('تم تحديث المستخدم');
      } else {
        await userAPI.create(values);
        toast.success('تم إضافة المستخدم');
      }
      setShowModal(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || 'فشل'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await userAPI.delete(deleteTarget._id); toast.success('تم حذف المستخدم'); setDeleteTarget(null); fetchUsers(); }
    catch (e) { toast.error(e.response?.data?.message || 'فشل'); }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      await userAPI.toggleStatus(toggleTarget._id);
      toast.success(`تم ${toggleTarget.isActive ? 'تعطيل' : 'تفعيل'} المستخدم`);
      setToggleTarget(null);
      fetchUsers();
    } catch (e) { toast.error('فشل'); }
  };

  const roleColors = { admin: 'red', finance: 'blue', pm: 'green', accountant: 'orange', employee: 'default' };
  const roleNames = { admin: 'مدير', finance: 'مدير مالي', pm: 'مدير مشاريع', accountant: 'محاسب', employee: 'موظف' };

  const columns = [
    { title: 'الاسم', dataIndex: 'fullName', key: 'name', width: 150 },
    { title: 'اسم المستخدم', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'البريد', dataIndex: 'email', key: 'email', width: 180 },
    {
      title: 'الدور', dataIndex: 'role', key: 'role', width: 120,
      render: (r) => <Tag color={roleColors[r]}>{roleNames[r] || r}</Tag>,
    },
    {
      title: 'الحالة', dataIndex: 'isActive', key: 'active', width: 80,
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'نشط' : 'معطل'}</Tag>,
    },
    {
      title: 'آخر دخول', dataIndex: 'lastLogin', key: 'login', width: 130,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'إجراءات', key: 'actions', width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditingUser(record);
            form.setFieldsValue(record);
            setShowModal(true);
          }}>تعديل</Button>
          <Button size="small" onClick={() => setToggleTarget(record)}>
            {record.isActive ? 'تعطيل' : 'تفعيل'}
          </Button>
          <Button size="small" danger onClick={() => setDeleteTarget(record)}>حذف</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>إدارة المستخدمين</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); form.resetFields(); setShowModal(true); }}>
          إضافة مستخدم
        </Button>
      </div>

      <DataTable columns={columns} dataSource={users} loading={loading} onRefresh={fetchUsers}
        showActions={false} pagination={false}
        rowSelection={true}
        onBulkDelete={(ids) => userAPI.bulkDelete(ids)}
        onBulkEdit={(ids, field, value) => userAPI.bulkUpdate(ids, field, value)} />

      <Modal
        title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        open={showModal}
        onCancel={() => { setShowModal(false); setEditingUser(null); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="حفظ" cancelText="إلغاء"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ role: 'employee', isActive: true }}>
          <Form.Item name="fullName" label="الاسم الكامل" rules={[{ required: true }]}>
            <input style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
          </Form.Item>
          <Form.Item name="username" label="اسم المستخدم" rules={[{ required: true }]}>
            <input style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
          </Form.Item>
          <Form.Item name="email" label="البريد الإلكتروني" rules={[{ required: true, type: 'email' }]}>
            <input style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="كلمة المرور" rules={[{ required: true, min: 6 }]}>
              <input type="password" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item name="role" label="الدور">
            <Select options={[
              { value: 'admin', label: 'مدير النظام' }, { value: 'finance', label: 'مدير مالي' },
              { value: 'pm', label: 'مدير مشاريع' }, { value: 'accountant', label: 'محاسب' },
              { value: 'employee', label: 'موظف' },
            ]} />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="تأكيد حذف المستخدم" message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟`} type="danger" />
      <ConfirmDialog open={!!toggleTarget} onCancel={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={`${toggleTarget?.isActive ? 'تعطيل' : 'تفعيل'} المستخدم`}
        message={`هل أنت متأكد من ${toggleTarget?.isActive ? 'تعطيل' : 'تفعيل'} "${toggleTarget?.fullName}"؟`}
        type="warning" confirmText={toggleTarget?.isActive ? 'نعم، عطل' : 'نعم، فعل'} />
    </div>
  );
};

export default UserManagement;