import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import invoiceAPI from '../../api/invoices';
import { formatCurrency } from '../../utils/formatters';

const { Text } = Typography;

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
      title: 'رقم الفاتورة',
      dataIndex: 'invoiceNumber',
      key: 'number',
      width: 140,
      render: (text) => (
        <Space>
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
            <FileTextOutlined />
          </div>
          <Text strong className="text-blue-600">{text || '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'العميل',
      key: 'client',
      width: 180,
      render: (_, r) => (
        <div>
          <div className="font-medium text-slate-900">{r.client?.name || '—'}</div>
          <div className="text-xs text-slate-500">{r.invoiceType}</div>
        </div>
      ),
    },
    {
      title: 'المبلغ الإجمالي',
      dataIndex: 'totalAmount',
      key: 'amount',
      width: 130,
      render: (v, r) => <span className="font-bold text-slate-900">{formatCurrency(v, r.currency)}</span>,
    },
    {
      title: 'المدفوع',
      dataIndex: 'paidAmount',
      key: 'paid',
      width: 130,
      render: (v, r) => (
        <span className={`font-medium ${v > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: 'المتبقي',
      key: 'remaining',
      width: 130,
      render: (_, r) => {
        const rem = r.totalAmount - r.paidAmount;
        return <span className={`font-bold ${rem > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(rem, r.currency)}</span>;
      },
    },
    {
      title: 'تاريخ الاستحقاق',
      dataIndex: 'dueDate',
      key: 'due',
      width: 130,
      render: (d) => (
        <div className="text-slate-600">
          {d ? new Date(d).toLocaleDateString('ar-SA') : '—'}
        </div>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => <StatusBadge status={s} mapping={statusColors.invoice} />,
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select
        placeholder="تصفية حسب الحالة"
        allowClear
        className="w-48"
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'مسودة', label: 'مسودة' },
          { value: 'مصدرة', label: 'مصدرة' },
          { value: 'مدفوعة جزئياً', label: 'مدفوعة جزئياً' },
          { value: 'مدفوعة', label: 'مدفوعة' },
          { value: 'متأخرة', label: 'متأخرة' },
        ]}
      />
    </Space>
  );

  return (
    <div className="space-y-4">
      <DataTable
        title="إدارة الفواتير"
        columns={columns}
        dataSource={invoices}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="البحث برقم الفاتورة أو العميل..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/invoices/new"
        detailPath="/invoices"
        onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchInvoices}
        filters={filterBar}
        editPath="/invoices/edit"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف الفاتورة"
        message={`هل أنت متأكد من حذف الفاتورة رقم "${deleteTarget?.invoiceNumber}"؟`}
        description="هذا الإجراء سيؤدي إلى حذف كافة البيانات المرتبطة بالفاتورة ولا يمكن التراجع عنه."
        type="danger"
      />
    </div>
  );
};

export default InvoiceList;
