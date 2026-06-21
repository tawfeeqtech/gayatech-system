import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, message, Tag, Row, Col, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined, TransactionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/ui/StatCard';
import transactionAPI from '../../api/transactions';
import accountAPI from '../../api/accounts';
import { formatCurrency } from '../../utils/formatters';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const TransactionList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    accountAPI.getAll().then(r => setAccounts(r.data.data.accounts || [])).catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (accountFilter) params.account = accountFilter;
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const [txRes, sumRes] = await Promise.all([
        transactionAPI.getAll(params),
        transactionAPI.getSummary().catch(() => ({ data: { data: { month: {} } } })),
      ]);

      setTransactions(txRes.data.data.transactions);
      setTotal(txRes.data.total);
      setSummary(sumRes.data?.data?.month || {});
    } catch (error) {
      message.error('فشل في جلب المعاملات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter, accountFilter, dateRange]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await transactionAPI.delete(deleteTarget._id);
      message.success('تم حذف المعاملة');
      setDeleteTarget(null);
      fetchTransactions();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeIcons = {
    'دخل': <ArrowUpOutlined className="text-emerald-600" />,
    'مصروف': <ArrowDownOutlined className="text-rose-600" />,
    'تحويل': <SwapOutlined className="text-blue-600" />
  };

  const typeBgColors = {
    'دخل': 'bg-emerald-50',
    'مصروف': 'bg-rose-50',
    'تحويل': 'bg-blue-50'
  };

  const columns = [
    {
      title: 'المعاملة',
      dataIndex: 'transactionNumber',
      key: 'number',
      width: 160,
      render: (text, r) => (
        <Space>
          <div className={`w-8 h-8 rounded-lg ${typeBgColors[r.type] || 'bg-slate-50'} flex items-center justify-center`}>
            {typeIcons[r.type] || <TransactionOutlined className="text-slate-600" />}
          </div>
          <div>
            <Text strong className="text-slate-900 block leading-tight">{text || '—'}</Text>
            <Text type="secondary" className="text-[11px]">{new Date(r.transactionDate).toLocaleDateString('ar-SA')}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (v, r) => (
        <span className={`font-bold text-base ${r.type === 'دخل' ? 'text-emerald-600' : r.type === 'مصروف' ? 'text-rose-600' : 'text-blue-600'}`}>
          {r.type === 'دخل' ? '+' : r.type === 'مصروف' ? '-' : ''} {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: 'الطرف الثاني',
      key: 'client',
      width: 180,
      render: (_, r) => (
        <div>
          <div className="font-medium text-slate-800">{r.client?.name || r.vendor?.name || '—'}</div>
          <div className="text-xs text-slate-500">{r.category || r.paymentMethod}</div>
        </div>
      ),
    },
    {
      title: 'الحسابات',
      key: 'accounts',
      width: 200,
      render: (_, r) => (
        <div className="flex flex-col gap-1">
          {r.fromAccount && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 w-6 text-left">من:</span>
              <Tag className="m-0 text-[10px] bg-slate-50 border-slate-200">{r.fromAccount.name}</Tag>
            </div>
          )}
          {r.toAccount && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 w-6 text-left">إلى:</span>
              <Tag className="m-0 text-[10px] bg-blue-50 border-blue-100 text-blue-600">{r.toAccount.name}</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'الوصف',
      dataIndex: 'description',
      key: 'desc',
      ellipsis: true,
      render: (text) => <Text type="secondary" className="text-xs italic">{text || 'بدون وصف'}</Text>
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select
        placeholder="النوع"
        allowClear
        className="w-32"
        value={typeFilter || undefined}
        onChange={(v) => { setTypeFilter(v || ''); setPage(1); }}
        options={[{ value: 'دخل', label: 'دخل' }, { value: 'مصروف', label: 'مصروف' }, { value: 'تحويل', label: 'تحويل' }]}
      />
      <Select
        placeholder="الحساب"
        allowClear
        className="w-48"
        value={accountFilter || undefined}
        onChange={(v) => { setAccountFilter(v || ''); setPage(1); }}
        options={accounts.map(a => ({ value: a._id, label: a.name }))}
      />
      <RangePicker
        onChange={(dates) => { setDateRange(dates); setPage(1); }}
        className="rounded-lg"
      />
    </Space>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3} className="!mb-1">المعاملات المالية</Title>
          <Text type="secondary">تتبع كافة التدفقات النقدية الصادرة والواردة والتحويلات الداخلية</Text>
        </div>
      </div>

      {/* ملخص العملات */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(summary).slice(0, 3).map(([currency, stats]) => (
            <StatCard
              key={currency}
              title={`صافي حركة ${currency}`}
              value={stats.net || 0}
              prefix={currency}
              variant={(stats.net || 0) >= 0 ? 'primary' : 'danger'}
              trend={{ value: 0, isUp: (stats.net || 0) >= 0 }}
              icon={<TransactionOutlined />}
            />
          ))}
        </div>
      )}

      <DataTable
        title="سجل المعاملات"
        columns={columns}
        dataSource={transactions}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="البحث برقم المعاملة أو الوصف..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/transactions/new"
        detailPath="/transactions"
        onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchTransactions}
        filters={filterBar}
        showActions={true}
        editPath="/transactions/edit"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف المعاملة"
        message={`هل أنت متأكد من حذف المعاملة رقم "${deleteTarget?.transactionNumber}"؟`}
        description="هذا الإجراء سيؤدي إلى تحديث أرصدة الحسابات المرتبطة وقد يؤثر على التقارير المالية. لا يمكن التراجع عن الحذف."
        type="danger"
      />
    </div>
  );
};

export default TransactionList;
