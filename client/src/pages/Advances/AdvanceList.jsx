import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, message, Tag, Button, Modal, Form, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import advanceAPI from '../../api/advances';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';

const { RangePicker } = DatePicker;

const AdvanceList = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employee = employeeFilter;
      const response = await advanceAPI.getAll(params);
      setAdvances(response.data.data.advances);
      setTotal(response.data.total);
    } catch (error) { message.error('فشل في جلب السلف'); }
    finally { setLoading(false); }
  }, [page, pageSize, statusFilter, employeeFilter]);

  useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await advanceAPI.approve(id);
      else if (action === 'reject') await advanceAPI.reject(id);
      message.success('تم بنجاح');
      fetchAdvances();
    } catch (e) { message.error('فشل'); }
  };

  const handleEdit = async (values) => {
    setEditSubmitting(true);
    try {
      await advanceAPI.update(editingAdvance._id, values);
      message.success('تم التحديث');
      setEditingAdvance(null);
      fetchAdvances();
    } catch (e) { message.error('فشل في التحديث'); }
    finally { setEditSubmitting(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await advanceAPI.delete(deleteTarget._id);
      message.success('تم الحذف');
      setDeleteTarget(null);
      fetchAdvances();
    } catch (e) { message.error('فشل'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    { title: 'الموظف', key: 'employee', width: 140, render: (_, r) => r.employee?.name || '—' },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v, r) => formatCurrency(v, r.currency || 'USD'),
    },
    {
      title: 'المسدد', dataIndex: 'repaidAmount', key: 'repaid', width: 110,
      render: (v, r) => <span style={{ color: '#10b981' }}>{formatCurrency(v, r.currency || 'USD')}</span>,
    },
    {
      title: 'المتبقي', dataIndex: 'remainingAmount', key: 'rem', width: 110,
      render: (v, r) => <span style={{ color: v > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(v, r.currency || 'USD')}</span>,
    },
    { title: 'التاريخ', dataIndex: 'requestDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    { title: 'السبب', dataIndex: 'reason', key: 'reason', width: 150, ellipsis: true },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 120,
      render: (s) => {
        const colors = { 'مسددة': 'green', 'موافق عليها': 'blue', 'مرفوضة': 'red', 'معلقة': 'orange', 'مسددة جزئياً': 'purple' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'إجراءات', key: 'actions', width: 200,
      render: (_, r) => (
        <Space size="small">
          {r.status === 'معلقة' && (
            <>
              <Button size="small" type="primary" onClick={() => handleAction(r._id, 'approve')}>موافقة</Button>
              <Button size="small" danger onClick={() => handleAction(r._id, 'reject')}>رفض</Button>
            </>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditingAdvance(r);
            editForm.setFieldsValue(r);
          }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(r)} />
        </Space>
      ),
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select placeholder="الموظف" allowClear style={{ width: 150 }}
        value={employeeFilter || undefined}
        onChange={(v) => { setEmployeeFilter(v || ''); setPage(1); }}
        options={employees.map(e => ({ value: e._id, label: e.name }))} />
      <Select placeholder="الحالة" allowClear style={{ width: 130 }}
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'معلقة', label: 'معلقة' }, { value: 'موافق عليها', label: 'موافق عليها' },
          { value: 'مسددة', label: 'مسددة' }, { value: 'مسددة جزئياً', label: 'مسددة جزئياً' },
          { value: 'مرفوضة', label: 'مرفوضة' },
        ]} />
    </Space>
  );

  return (
    <>
      <DataTable
        title="السلف" columns={columns} dataSource={advances}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/advances/new" onRefresh={fetchAdvances}
        showActions={false} filters={filterBar}
      />

      {/* Modal تعديل */}
      <Modal
        title="تعديل السلفة"
        open={!!editingAdvance}
        onCancel={() => setEditingAdvance(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="حفظ" cancelText="إلغاء"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="amount" label="المبلغ">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="repaidAmount" label="المبلغ المسدد">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="العملة">
            <Select options={[
              { value: 'USD', label: 'دولار $' }, { value: 'ILS', label: 'شيكل ₪' },
              { value: 'SAR', label: 'ريال ﷼' }, { value: 'JOD', label: 'دينار د.أ' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف السلفة"
        message={`هل أنت متأكد من حذف سلفة "${deleteTarget?.employee?.name}"؟`} type="danger" />
    </>
  );
};

export default AdvanceList;