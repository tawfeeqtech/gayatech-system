import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await employeeAPI.getAll(params);
      setEmployees(response.data.data.employees);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب بيانات الموظفين');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await employeeAPI.delete(deleteTarget._id);
      message.success('تم حذف الموظف');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'الموظف', dataIndex: 'name', key: 'name', width: 180,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.jobTitle}</div>
        </div>
      ),
    },
    { title: 'القسم', dataIndex: 'department', key: 'dept', width: 100, render: (d) => d || '—' },
    {
      title: 'الراتب', dataIndex: 'baseSalary', key: 'salary', width: 120,
      render: (v, r) => formatCurrency(v, r.salaryCurrency),
    },
    {
      title: 'تاريخ الانضمام', dataIndex: 'joiningDate', key: 'join', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => <StatusBadge status={s} mapping={statusColors.client} />,
    },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', width: 130, render: (p) => p || '—' },
  ];

  const filterBar = (
    <Select placeholder="الحالة" allowClear style={{ width: 140 }}
      value={statusFilter || undefined}
      onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
      options={[
        { value: 'نشط', label: 'نشط' }, { value: 'إجازة', label: 'إجازة' },
        { value: 'متوقف', label: 'متوقف' }, { value: 'مستقيل', label: 'مستقيل' },
      ]} />
  );

  return (
    <>
      <DataTable
        title="الموظفون" columns={columns} dataSource={employees}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن موظف..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/employees/new" editPath="/employees/edit" detailPath="/employees"
        onDelete={(r) => setDeleteTarget(r)} onRefresh={fetchEmployees} filters={filterBar}
      />
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف الموظف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`} type="danger" />
    </>
  );
};

export default EmployeeList;