import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import expenseAPI from '../../api/expenses';
import categoryAPI from '../../api/expenseCategories';
import { formatCurrency } from '../../utils/formatters';

const ExpenseList = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data.categories || [])).catch(() => {});
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const response = await expenseAPI.getAll(params);
      setExpenses(response.data.data.expenses);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب المصاريف');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await expenseAPI.delete(deleteTarget._id);
      message.success('تم حذف المصروف');
      setDeleteTarget(null);
      fetchExpenses();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { title: 'التاريخ', dataIndex: 'expenseDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    { title: 'الوصف', dataIndex: 'description', key: 'desc', width: 250, ellipsis: true },
    {
      title: 'التصنيف', key: 'category', width: 120,
      render: (_, r) => r.category ? <Tag color={r.category.color || '#3b82f6'}>{r.category.name}</Tag> : '—',
    },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v, r) => <span style={{ color: '#ef4444', fontWeight: 600 }}>- {formatCurrency(v, r.currency)}</span>,
    },
    { title: 'المزود', dataIndex: 'vendor', key: 'vendor', width: 130 },
    { title: 'وسيلة الدفع', dataIndex: 'paymentMethod', key: 'method', width: 120 },
  ];

  const filterBar = (
    <Select placeholder="التصنيف" allowClear style={{ width: 160 }}
      value={categoryFilter || undefined}
      onChange={(v) => { setCategoryFilter(v || ''); setPage(1); }}
      options={categories.map(c => ({ value: c._id, label: c.name }))} />
  );

  return (
    <>
      <DataTable
        title="المصاريف" columns={columns} dataSource={expenses}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن مصروف..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/expenses/new" onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchExpenses} filters={filterBar}
        editPath={undefined} detailPath={undefined} showActions={true}
      />
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف المصروف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.description}"؟`} type="danger" />
    </>
  );
};

export default ExpenseList;