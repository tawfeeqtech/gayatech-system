import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Space, Tag, Button, Modal, Form, Select, InputNumber, DatePicker, Input, Card, Row, Col, Alert } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import currencyAPI from '../../api/currencyExchange';
import walletAPI from '../../api/wallets';
import accountAPI from '../../api/accounts';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import toast from 'react-hot-toast';

const CURRENCY_SYMBOLS = { USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' };
const CURRENCY_NAMES = { USD: 'دولار', ILS: 'شيكل', SAR: 'ريال', JOD: 'دينار', EUR: 'يورو' };

const CurrencyExchangeList = () => {
  const { currencies } = useCurrencies();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromCurrencyFilter, setFromCurrencyFilter] = useState('');
  const [toCurrencyFilter, setToCurrencyFilter] = useState('');

  // Modal state — used for both create and edit
  const [showModal, setShowModal] = useState(false);
  const [editingExchange, setEditingExchange] = useState(null); // null = create mode
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Wallets & Accounts data
  const [allWallets, setAllWallets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  // Preview state
  const [preview, setPreview] = useState(null);

  // Form watch values
  const [formValues, setFormValues] = useState({});
  const formWatcher = Form.useWatch([], form);

  useEffect(() => {
    if (formWatcher) {
      setFormValues(formWatcher);
      generatePreview(formWatcher);
    }
  }, [formWatcher]);

  // Load wallets and accounts
  useEffect(() => {
    if (showModal) {
      loadWalletsAndAccounts();
    }
  }, [showModal]);

  const loadWalletsAndAccounts = async () => {
    setLoadingWallets(true);
    try {
      const [walletRes, accountRes] = await Promise.all([
        walletAPI.getAll(),
        accountAPI.getAll(),
      ]);
      setAllWallets(walletRes.data.data.wallets || []);
      setAccounts(accountRes.data.data.accounts || []);
    } catch (e) {
      toast.error('فشل في تحميل المحافظ');
    } finally {
      setLoadingWallets(false);
    }
  };

  // Group wallets by account
  const walletsByAccount = useMemo(() => {
    const map = {};
    allWallets.forEach(w => {
      const accId = typeof w.account === 'object' ? w.account._id : w.account;
      if (!map[accId]) map[accId] = [];
      map[accId].push(w);
    });
    return map;
  }, [allWallets]);

  const fromWallets = useMemo(() => {
    const accId = formValues.fromAccount;
    return walletsByAccount[accId] || [];
  }, [formValues.fromAccount, walletsByAccount]);

  const toWallets = useMemo(() => {
    const accId = formValues.toAccount;
    return walletsByAccount[accId] || [];
  }, [formValues.toAccount, walletsByAccount]);

  const handleFromWalletChange = (walletId) => {
    const wallet = allWallets.find(w => w._id === walletId);
    if (wallet) form.setFieldsValue({ fromCurrency: wallet.currency });
  };

  const handleToWalletChange = (walletId) => {
    const wallet = allWallets.find(w => w._id === walletId);
    if (wallet) form.setFieldsValue({ toCurrency: wallet.currency });
  };

  const handleAmountChange = (changedField, allValues) => {
    const { fromAmount, toAmount, exchangeRate } = allValues;
    if (changedField === 'fromAmount' || changedField === 'exchangeRate') {
      if (fromAmount && exchangeRate) {
        form.setFieldsValue({ toAmount: Number((fromAmount * exchangeRate).toFixed(2)) });
      }
    } else if (changedField === 'toAmount') {
      if (toAmount && exchangeRate) {
        form.setFieldsValue({ fromAmount: Number((toAmount / exchangeRate).toFixed(2)) });
      }
    }
  };

  const generatePreview = (values) => {
    const { fromCurrency, toCurrency, fromAmount, toAmount, exchangeRate, fromWallet, toWallet } = values || {};
    if (!fromCurrency || !toCurrency || !fromAmount || !exchangeRate) {
      setPreview(null);
      return;
    }
    const fromName = CURRENCY_NAMES[fromCurrency] || fromCurrency;
    const toName = CURRENCY_NAMES[toCurrency] || toCurrency;

    const fromWalletObj = fromWallet ? allWallets.find(w => w._id === fromWallet) : null;
    const toWalletObj = toWallet ? allWallets.find(w => w._id === toWallet) : null;
    let fromAccountName = '', toAccountName = '';
    if (fromWalletObj && typeof fromWalletObj.account === 'object') fromAccountName = fromWalletObj.account.name;
    if (toWalletObj && typeof toWalletObj.account === 'object') toAccountName = toWalletObj.account.name;

    setPreview({
      fromAmount, toAmount: toAmount || (fromAmount * exchangeRate).toFixed(2),
      fromCurrency, toCurrency, exchangeRate, fromName, toName,
      fromAccountName, toAccountName,
      fromWalletName: fromWalletObj?.name || '', toWalletName: toWalletObj?.name || '',
    });
  };

  const accountOptions = useMemo(() => {
    return accounts
      .filter(acc => walletsByAccount[acc._id] && walletsByAccount[acc._id].length > 0)
      .map(acc => ({ value: acc._id, label: `${acc.name} (${acc.accountType || ''})` }));
  }, [accounts, walletsByAccount]);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (fromCurrencyFilter) params.fromCurrency = fromCurrencyFilter;
      if (toCurrencyFilter) params.toCurrency = toCurrencyFilter;
      const response = await currencyAPI.getAll(params);
      setExchanges(response.data.data.exchanges);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('فشل في جلب التحويلات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fromCurrencyFilter, toCurrencyFilter]);

  useEffect(() => { fetchExchanges(); }, [fetchExchanges]);

  // Open modal for create
  const openCreateModal = () => {
    setEditingExchange(null);
    form.resetFields();
    form.setFieldsValue({
      fromCurrency: 'SAR', toCurrency: 'USD', exchangeRate: 0.27,
      via: 'بنك', exchangeDate: dayjs(),
    });
    setPreview(null);
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (exchange) => {
    setEditingExchange(exchange);
    form.resetFields();
    // Pre-fill form with exchange data
    const fromWalletId = typeof exchange.fromWallet === 'object' ? exchange.fromWallet._id : exchange.fromWallet;
    const toWalletId = typeof exchange.toWallet === 'object' ? exchange.toWallet._id : exchange.toWallet;
    let fromAccountId = exchange.fromAccount;
    let toAccountId = exchange.toAccount;
    if (!fromAccountId && exchange.fromWallet) {
      const w = allWallets.find(ww => ww._id === fromWalletId);
      if (w) fromAccountId = typeof w.account === 'object' ? w.account._id : w.account;
    }
    if (!toAccountId && exchange.toWallet) {
      const w = allWallets.find(ww => ww._id === toWalletId);
      if (w) toAccountId = typeof w.account === 'object' ? w.account._id : w.account;
    }
    form.setFieldsValue({
      fromAccount: fromAccountId,
      fromWallet: fromWalletId,
      toAccount: toAccountId,
      toWallet: toWalletId,
      fromCurrency: exchange.fromCurrency,
      toCurrency: exchange.toCurrency,
      fromAmount: exchange.fromAmount,
      toAmount: exchange.toAmount,
      exchangeRate: exchange.exchangeRate,
      exchangeDate: dayjs(exchange.exchangeDate),
      via: exchange.via,
      notes: exchange.notes,
    });
    setPreview(null);
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        exchangeDate: values.exchangeDate?.toISOString() || dayjs().toISOString(),
      };
      if (editingExchange) {
        await currencyAPI.update(editingExchange._id, payload);
        toast.success('تم تحديث التحويل');
      } else {
        await currencyAPI.create(payload);
        toast.success('تمت إضافة التحويل');
      }
      setShowModal(false);
      form.resetFields();
      setPreview(null);
      setEditingExchange(null);
      fetchExchanges();
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await currencyAPI.delete(deleteTarget._id);
      toast.success('تم حذف التحويل');
      setDeleteTarget(null);
      fetchExchanges();
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filterBar = (
    <Space wrap>
      <Select placeholder="من عملة" allowClear style={{ width: 120 }}
        value={fromCurrencyFilter || undefined}
        onChange={(v) => { setFromCurrencyFilter(v || ''); setPage(1); }}
        options={currencies} />
      <Select placeholder="إلى عملة" allowClear style={{ width: 120 }}
        value={toCurrencyFilter || undefined}
        onChange={(v) => { setToCurrencyFilter(v || ''); setPage(1); }}
        options={currencies} />
    </Space>
  );

  const columns = [
    {
      title: 'التاريخ', dataIndex: 'exchangeDate', key: 'date', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'من', key: 'fromAccount', width: 140,
      render: (_, r) => {
        if (r.fromWallet) {
          const name = typeof r.fromWallet === 'object' ? r.fromWallet.name : 'محفظة';
          const bal = typeof r.fromWallet === 'object' ? r.fromWallet.balance : null;
          const cur = typeof r.fromWallet === 'object' ? r.fromWallet.currency : '';
          return <Tag>{name}{bal !== null ? ` (${formatCurrency(bal, cur)})` : ''}</Tag>;
        }
        return <span>{formatCurrency(r.fromAmount, r.fromCurrency)}</span>;
      },
    },
    {
      title: 'المبلغ الأصلي', key: 'from', width: 140,
      render: (_, r) => (
        <span style={{ fontWeight: 600, fontSize: 14, color: '#ef4444' }}>
          {formatCurrency(r.fromAmount, r.fromCurrency)}
        </span>
      ),
    },
    {
      title: 'إلى', key: 'toAccount', width: 140,
      render: (_, r) => {
        if (r.toWallet) {
          const name = typeof r.toWallet === 'object' ? r.toWallet.name : 'محفظة';
          const bal = typeof r.toWallet === 'object' ? r.toWallet.balance : null;
          const cur = typeof r.toWallet === 'object' ? r.toWallet.currency : '';
          return <Tag color="blue">{name}{bal !== null ? ` (${formatCurrency(bal, cur)})` : ''}</Tag>;
        }
        return <span>{formatCurrency(r.toAmount, r.toCurrency)}</span>;
      },
    },
    {
      title: 'المبلغ المحول', key: 'to', width: 140,
      render: (_, r) => (
        <span style={{ fontWeight: 600, fontSize: 14, color: '#10b981' }}>
          {formatCurrency(r.toAmount, r.toCurrency)}
        </span>
      ),
    },
    {
      title: 'سعر الصرف', dataIndex: 'exchangeRate', key: 'rate', width: 100,
      render: (v) => v?.toFixed(4),
    },
    {
      title: 'عبر', dataIndex: 'via', key: 'via', width: 90,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'ملاحظات', dataIndex: 'notes', key: 'notes', width: 180, ellipsis: true,
    },
  ];

  // Custom actions for edit (modal-based, not navigation)
  const customActions = (record) => (
    <Button type="text" size="small"
      icon={<EditOutlined style={{ color: '#10b981' }} />}
      onClick={() => openEditModal(record)}
    />
  );

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>تحويلات العملات</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          إضافة تحويل
        </Button>
      </div>

      <DataTable
        columns={columns}
        dataSource={exchanges}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        onRefresh={fetchExchanges}
        showActions={true}
        onDelete={(r) => setDeleteTarget(r)}
        customActions={customActions}
        filters={filterBar}
        rowSelection={true}
        onBulkDelete={(ids) => currencyAPI.bulkDelete(ids)}
        onBulkEdit={(ids, field, value) => currencyAPI.bulkUpdate(ids, field, value)}
      />

      {/* ====== Create/Edit Modal ====== */}
      <Modal
        title={editingExchange ? 'تعديل تحويل عملات' : 'إضافة تحويل عملات'}
        open={showModal}
        onCancel={() => { setShowModal(false); setPreview(null); setEditingExchange(null); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingExchange ? 'تحديث' : 'حفظ'}
        cancelText="إلغاء"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          onValuesChange={(changed, all) => {
            const key = Object.keys(changed)[0];
            handleAmountChange(key, all);
          }}
          initialValues={{
            fromCurrency: 'SAR', toCurrency: 'USD', exchangeRate: 0.27,
            via: 'بنك', exchangeDate: dayjs(),
          }}
          style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}
        >
          {/* FROM */}
          <Card size="small" title={<span style={{ color: '#ef4444' }}>⬅️ من</span>} style={{ marginBottom: 12, borderRadius: 8, borderColor: '#fecaca' }}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="fromAccount" label="اختر الحساب" rules={[{ required: true, message: 'اختر الحساب المصدر' }]}>
                  <Select
                    placeholder="اختر الحساب" showSearch optionFilterProp="label"
                    options={accountOptions}
                    loading={loadingWallets}
                    notFoundContent="لا توجد حسابات بمحافظ"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fromWallet" label="اختر المحفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}
                  dependencies={['fromAccount']}
                >
                  <Select
                    placeholder="اختر المحفظة" showSearch optionFilterProp="label"
                    options={fromWallets.map(w => ({
                      value: w._id,
                      label: `${w.name} (${formatCurrency(w.balance, w.currency)})`,
                      currency: w.currency,
                    }))}
                    loading={loadingWallets}
                    notFoundContent="لا توجد محافظ لهذا الحساب"
                    onChange={(val) => handleFromWalletChange(val)}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="fromCurrency" label="عملة المصدر" hidden><Input /></Form.Item>
          </Card>

          {/* TO */}
          <Card size="small" title={<span style={{ color: '#10b981' }}>➡️ إلى</span>} style={{ marginBottom: 12, borderRadius: 8, borderColor: '#bbf7d0' }}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="toAccount" label="اختر الحساب" rules={[{ required: true, message: 'اختر الحساب الهدف' }]}>
                  <Select
                    placeholder="اختر الحساب" showSearch optionFilterProp="label"
                    options={accountOptions}
                    loading={loadingWallets}
                    notFoundContent="لا توجد حسابات بمحافظ"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="toWallet" label="اختر المحفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}
                  dependencies={['toAccount']}
                >
                  <Select
                    placeholder="اختر المحفظة" showSearch optionFilterProp="label"
                    options={toWallets.map(w => ({
                      value: w._id,
                      label: `${w.name} (${formatCurrency(w.balance, w.currency)})`,
                      currency: w.currency,
                    }))}
                    loading={loadingWallets}
                    notFoundContent="لا توجد محافظ لهذا الحساب"
                    onChange={(val) => handleToWalletChange(val)}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="toCurrency" label="عملة الهدف" hidden><Input /></Form.Item>
          </Card>

          {/* Amounts */}
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="fromAmount" label="المبلغ الأصلي" rules={[{ required: true, message: 'أدخل المبلغ' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="exchangeRate" label="سعر الصرف" rules={[{ required: true, message: 'أدخل السعر' }]}>
                <InputNumber min={0} step={0.0001} style={{ width: '100%' }} placeholder="0.0000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="toAmount" label="المبلغ المحول" dependencies={['fromAmount', 'exchangeRate']}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="سيتم حسابه" disabled />
              </Form.Item>
            </Col>
          </Row>

          {/* Details */}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="exchangeDate" label="التاريخ">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="via" label="عبر">
                <Select options={[
                  { value: 'ريم', label: 'ريم' }, { value: 'بنك', label: 'بنك' },
                  { value: 'نقد', label: 'نقد' }, { value: 'صرافة', label: 'صرافة' },
                  { value: 'شيك', label: 'شيك' }, { value: 'تحويل بنكي', label: 'تحويل بنكي' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="ملاحظات">
            <Input.TextArea rows={2} placeholder="ملاحظات إضافية..." />
          </Form.Item>
        </Form>

        {/* Preview */}
        {preview && (
          <Alert
            type="info" showIcon
            message={editingExchange ? '🔍 معاينة التعديل' : '🔍 تأكيد التحويل'}
            description={
              <div style={{ fontSize: 15, lineHeight: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#1d4ed8' }}>
                  ⚠️ {editingExchange ? 'تعديل التحويل' : 'أنت بصدد تحويل'}{' '}
                  <span style={{ color: '#dc2626' }}>{formatCurrency(preview.fromAmount, preview.fromCurrency)}</span>
                  {' ← '}
                  <span style={{ color: '#16a34a' }}>{formatCurrency(preview.toAmount, preview.toCurrency)}</span>
                </div>
                <div style={{ color: '#475569' }}>
                  <div>• سعر الصرف: <strong>1 {preview.fromName} = {preview.exchangeRate} {preview.toName}</strong></div>
                  <div>• المبلغ الناتج النهائي: <strong style={{ color: '#16a34a', fontSize: 17 }}>
                    {formatCurrency(preview.toAmount, preview.toCurrency)}
                  </strong></div>
                  {preview.fromWalletName && (
                    <div>• من محفظة: <Tag>{preview.fromWalletName}</Tag> {preview.fromAccountName && `(${preview.fromAccountName})`}</div>
                  )}
                  {preview.toWalletName && (
                    <div>• إلى محفظة: <Tag color="blue">{preview.toWalletName}</Tag> {preview.toAccountName && `(${preview.toAccountName})`}</div>
                  )}
                </div>
              </div>
            }
            style={{ borderRadius: 8, marginTop: 8 }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف التحويل"
        message={`هل أنت متأكد من حذف التحويل بقيمة ${deleteTarget ? formatCurrency(deleteTarget.fromAmount, deleteTarget.fromCurrency) : ''}؟`}
        description="سيتم التراجع عن تأثير التحويل على أرصدة المحافظ. لا يمكن التراجع عن هذا الإجراء." type="danger" />
    </div>
  );
};

export default CurrencyExchangeList;