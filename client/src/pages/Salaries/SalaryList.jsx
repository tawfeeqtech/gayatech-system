import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import salaryAPI from '../../api/salaries';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';

const SalaryList = () => {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const response = await salaryAPI.getAll(params);
      setSalaries(response.data.data.salaries);
      setTotal(response.data.total);
    } catch (error) { message.error('فشل في جلب الرواتب'); }
    finally { setLoading(false); }
  }, [page, pageSize, statusFilter]);

  useEffect(() => { fetchSalaries(); }, [fetchSalaries]);

  const handlePay = async (id) => {
    try {
      await salaryAPI.pay(id);
      message.success('تم تسجيل الدفع');
      fetchSalaries();
    } catch (e) { message.error('فشل في الدفع'); }
  };

  const columns = [
    { title: 'الموظف', key: 'employee', width: 160, render: (_, r) => r.employee?.name || '—' },
    { title: 'الشهر', dataIndex: 'month', key: 'month', width: 100 },
    { title: 'المبلغ', dataIndex: 'totalAmount', key: 'amount', width: 110, render: (v) => formatCurrency(v) },
    { title: 'المدفوع', dataIndex: 'paidAmount', key: 'paid', width: 110 },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => <Tag color={s === 'مدفوع' ? 'green' : 'orange'}>{s}</Tag>,
    },
    {
      title: 'إجراء', key: 'action', width: 80,
      render: (_, r) => r.status !== 'مدفوع' ? <Button size="small" type="primary" onClick={() => handlePay(r._id)}>دفع</Button> : null,
    },
  ];

  return (
    <DataTable
      title="الرواتب" columns={columns} dataSource={salaries}
      loading={loading} total={total} page={page} pageSize={pageSize}
      onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
      addPath="/salaries/new" onRefresh={fetchSalaries} showActions={false}
    />
  );
};

export default SalaryList;