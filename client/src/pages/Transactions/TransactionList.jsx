import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, message, Tag, Row, Col, Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/ui/StatCard';
import transactionAPI from '../../api/transactions';
import accountAPI from '../../api/accounts';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { RangePicker } = DatePicker;

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

  const typeIcons = { 'دخل': <ArrowUpOutlined style={{ color: '#10b981' }} />, 'مصروف': <ArrowDownOutlined style={{ color: '#ef4444' }} />, 'تحويل': <SwapOutlined style={{ color: '#3b82f6' }} /> };
  const typeColors = { 'دخل': '#10b981', 'مصروف': '#ef4444', 'تحويل': '#3b82f6' };

  const columns = [
    {
      title: 'رقم المعاملة', dataIndex: 'transactionNumber', key: 'number', width: 140,
      render: (text) => <Tag>{text || '—'}</Tag>,
    },
    {
      title: 'التاريخ', dataIndex: 'transactionDate', key: 'date', width: 110,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'النوع', dataIndex: 'type', key: 'type', width: 90,
      render: (t) => <Tag color={typeColors[t]} icon={typeIcons[t]}>{t}</Tag>,
    },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 130,
      render: (v, r) => (
        <span style={{ color: r.type === 'دخل' ? '#10b981' : r.type === 'مصروف' ? '#ef4444' : '#3b82f6', fontWeight: 600, fontSize: 15 }}>
          {r.type === 'دخل' ? '+' : r.type === 'مصروف' ? '-' : '↔'} {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: 'العميل', key: 'client', width: 140,
      render: (_, r) => r.client?.name || '—',
    },
    {
      title: 'من', dataIndex: 'fromAccount', key: 'from', width: 110,
      render: (a) => a?.name || '—',
    },
    {
      title: 'إلى', dataIndex: 'toAccount', key: 'to', width: 110,
      render: (a) => a?.name || '—',
    },
    {
      title: 'وسيلة الدفع', dataIndex: 'paymentMethod', key: 'method', width: 110,
    },
    {
      title: 'الوصف', dataIndex: 'description', key: 'desc', width: 180,
      ellipsis: true,
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select placeholder="نوع المعاملة" allowClear style={{ width: 130 }}
        value={typeFilter || undefined}
        onChange={(v) => { setTypeFilter(v || ''); setPage(1); }}
        options={[{ value: 'دخل', label: 'دخل' }, { value: 'مصروف', label: 'مصروف' }, { value: 'تحويل', label: 'تحويل' }]} />
      <Select placeholder="الحساب" allowClear style={{ width: 150 }}
        value={accountFilter || undefined}
        onChange={(v) => { setAccountFilter(v || ''); setPage(1); }}
        options={accounts.map(a => ({ value: a._id, label: a.name }))} />
      <RangePicker onChange={(dates) => { setDateRange(dates); setPage(1); }} style={{ fontFamily: 'Cairo, sans-serif' }} />
    </Space>
  );

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* بطاقات الملخص حسب العملة */}
      {Object.keys(summary).length === 0 ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <StatCard title="إجمالي الدخل (الشهر)" value={0} prefix="$" color="#10b981" icon="💰" />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard title="إجمالي المصروف (الشهر)" value={0} prefix="$" color="#ef4444" icon="💸" />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard title="الصافي" value={0} prefix="$" color="#3b82f6" icon="📊" />
          </Col>
        </Row>
      ) : (
        Object.entries(summary).map(([currency, stats]) => (
          <div key={currency} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#475569' }}>
              الملخص المالي لشهر يونيو ({currency})
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <StatCard 
                  title={`إجمالي الدخل (${currency})`} 
                  value={stats.income || 0} 
                  prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[currency] || currency} 
                  color="#10b981" 
                  icon="💰" 
                />
              </Col>
              <Col xs={24} sm={8}>
                <StatCard 
                  title={`إجمالي المصروف (${currency})`} 
                  value={stats.expense || 0} 
                  prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[currency] || currency} 
                  color="#ef4444" 
                  icon="💸" 
                />
              </Col>
              <Col xs={24} sm={8}>
                <StatCard 
                  title={`الصافي (${currency})`} 
                  value={stats.net || 0} 
                  prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[currency] || currency} 
                  color={(stats.net || 0) >= 0 ? '#3b82f6' : '#ef4444'} 
                  icon="📊" 
                />
              </Col>
            </Row>
          </div>
        ))
      )}

      <DataTable
        title="المعاملات المالية" columns={columns} dataSource={transactions}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن معاملة..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/transactions/new"
        detailPath="/transactions"
        onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchTransactions}
        filters={filterBar}
        showActions={true}
        editPath="/transactions/edit"
      />

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف المعاملة"
        message={`هل أنت متأكد من حذف المعاملة "${deleteTarget?.transactionNumber}"؟`}
        description="لا يمكن التراجع عن هذا الإجراء. قد يؤثر على الأرصدة والفواتير المرتبطة." type="danger" />
    </div>
  );
};

export default TransactionList;