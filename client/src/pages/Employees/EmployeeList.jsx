import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag, Typography, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';

const { Text } = Typography;

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
      title: 'الموظف',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text, record) => (
        <Space size="middle">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-blue-100 text-blue-600 border-0"
            size={40}
          />
          <div>
            <div className="font-bold text-slate-900 leading-tight">{text}</div>
            <div className="text-xs text-slate-500 mt-0.5">{record.jobTitle}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'القسم',
      dataIndex: 'department',
      key: 'dept',
      width: 140,
      render: (d) => (
        <Tag className="rounded-md border-0 bg-slate-100 text-slate-600 px-2 py-0.5">
          {d || '—'}
        </Tag>
      )
    },
    {
      title: 'الراتب الأساسي',
      dataIndex: 'baseSalary',
      key: 'salary',
      width: 150,
      render: (v, r) => (
        <span className="font-bold text-slate-800">
          {formatCurrency(v, r.salaryCurrency)}
        </span>
      ),
    },
    {
      title: 'تاريخ الانضمام',
      dataIndex: 'joiningDate',
      key: 'join',
      width: 140,
      render: (d) => (
        <span className="text-slate-600">
          {d ? new Date(d).toLocaleDateString('ar-SA') : '—'}
        </span>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => <StatusBadge status={s} mapping={statusColors.client} />,
    },
    {
      title: 'معلومات التواصل',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (p, record) => (
        <div className="text-xs text-slate-500">
          <div>{p || '—'}</div>
          <div className="mt-0.5 opacity-75">{record.email}</div>
        </div>
      )
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select
        placeholder="تصفية حسب الحالة"
        allowClear
        className="w-40"
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'نشط', label: 'نشط' },
          { value: 'إجازة', label: 'إجازة' },
          { value: 'متوقف', label: 'متوقف' },
          { value: 'مستقيل', label: 'مستقيل' },
        ]}
      />
    </Space>
  );

  return (
    <div className="space-y-4">
      <DataTable
        title="إدارة الموظفين"
        columns={columns}
        dataSource={employees}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="البحث عن موظف بالاسم أو الوظيفة..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/employees/new"
        editPath="/employees/edit"
        detailPath="/employees"
        onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchEmployees}
        filters={filterBar}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف ملف الموظف"
        message={`هل أنت متأكد من حذف بيانات الموظف "${deleteTarget?.name}"؟`}
        description="سيؤدي هذا الإجراء إلى حذف كافة سجلات الموظف. يفضل تغيير الحالة إلى 'مستقيل' بدلاً من الحذف."
        type="danger"
      />
    </div>
  );
};

export default EmployeeList;
