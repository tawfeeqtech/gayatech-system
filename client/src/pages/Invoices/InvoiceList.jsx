import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import invoiceAPI from '../../api/invoices';
import { formatCurrency } from '../../utils/formatters';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await invoiceAPI.getAll(params);
      setInvoices(response.data.data.invoices);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب الفواتير');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await invoiceAPI.delete(deleteTarget._id);
      message.success('تم حذف الفاتورة');
      setDeleteTarget(null);
      fetchInvoices();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'رقم الفاتورة', dataIndex: 'invoiceNumber', key: 'number', width: 140,
      render: (text) => <Tag color="blue">{text || '—'}</Tag>,
    },
    {
      title: 'العميل', key: 'client', width: 160,
      render: (_, r) => r.client?.name || '—',
    },
    {
      title: 'النوع', dataIndex: 'invoiceType', key: 'type', width: 100,
    },
    {
      title: 'المبلغ', dataIndex: 'totalAmount', key: 'amount', width: 120,
      render: (v, r) => formatCurrency(v, r.currency),
    },
    {
      title: 'المدفوع', dataIndex: 'paidAmount', key: 'paid', width: 120,
      render: (v, r) => (
        <span style={{ color: v > 0 ? '#10b981' : '#94a3b8' }}>{formatCurrency(v, r.currency)}</span>
      ),
    },
    {
      title: 'المتبقي', key: 'remaining', width: 120,
      render: (_, r) => {
        const rem = r.totalAmount - r.paidAmount;
        return <span style={{ color: rem > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(rem, r.currency)}</span>;
      },
    },
    {
      title: 'الاستحقاق', dataIndex: 'dueDate', key: 'due', width: 110,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => <StatusBadge status={s} mapping={statusColors.invoice} />,
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select placeholder="الحالة" allowClear style={{ width: 140 }}
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'مسودة', label: 'مسودة' }, { value: 'مصدرة', label: 'مصدرة' },
          { value: 'مدفوعة جزئياً', label: 'مدفوعة جزئياً' }, { value: 'مدفوعة', label: 'مدفوعة' },
          { value: 'متأخرة', label: 'متأخرة' },
        ]} />
    </Space>
  );

  return (
    <>
      <DataTable
        title="الفواتير" columns={columns} dataSource={invoices}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن فاتورة..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/invoices/new" detailPath="/invoices"
        onDelete={(r) => setDeleteTarget(r)} onRefresh={fetchInvoices}
        filters={filterBar} editPath={undefined}
      />
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف الفاتورة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.invoiceNumber}"؟`}
        description="لا يمكن التراجع عن هذا الإجراء." type="danger" />
    </>
  );
};

export default InvoiceList;