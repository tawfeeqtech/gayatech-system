import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Typography, InputNumber } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import transactionAPI from '../../api/transactions';
import clientAPI from '../../api/clients';
import accountAPI from '../../api/accounts';
import invoiceAPI from '../../api/invoices';
import api from '../../api/axios';
import { useParams } from 'react-router-dom';
import contractAPI from '../../api/contracts';

const { Title } = Typography;

const formatCurrency = (amount, currency = 'USD') => {
  const symbols = { USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' };
  try {
    return `${symbols[currency] || ''}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch { return `${amount}`; }
};

const TransactionForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contractMonths, setContractMonths] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [type, setType] = useState('دخل');

  // المحافظ
  const [toWallets, setToWallets] = useState([]);
  const [fromWallets, setFromWallets] = useState([]);
  const [loadingToWallets, setLoadingToWallets] = useState(false);
  const [loadingFromWallets, setLoadingFromWallets] = useState(false);

  useEffect(() => { 
    clientAPI.getAll({ limit: 100 }).then(r => setClients(r.data.data.clients || [])).catch(() => {});
    accountAPI.getAll().then(r => setAccounts(r.data.data.accounts || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      const res = await transactionAPI.getById(id);
      const t = res.data.data.transaction;

      form.setFieldsValue({
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        transactionDate: t.transactionDate?.split('T')[0],
        fromAccount: t.fromAccount?._id,
        toAccount: t.toAccount?._id,
        client: t.client?._id,
        paymentMethod: t.paymentMethod,
        status: t.status,
        description: t.description,
      });

      setType(t.type);

      // جلب المحافظ للحسابات المحددة
      if (t.toAccount?._id) {
        handleToAccountChange(t.toAccount._id);
      }
      if (t.fromAccount?._id) {
        handleFromAccountChange(t.fromAccount._id);
      }
      if (t.client?._id) {
        handleClientChange(t.client._id);
      }

      // تأخير بسيط لتعيين المحفظة بعد جلبها
      setTimeout(() => {
        if (t.fromWallet?._id) {
          form.setFieldsValue({ fromWallet: t.fromWallet._id });
        }
        if (t.toWallet?._id) {
          form.setFieldsValue({ toWallet: t.toWallet._id });
        }
      }, 800);
    } catch {
      message.error('فشل في جلب بيانات المعاملة');
    }
  };

  // عند تغيير "إلى حساب" - جلب محافظه
  const handleToAccountChange = async (accountId) => {
    form.setFieldsValue({ toWallet: undefined });
    if (!accountId) { setToWallets([]); return; }
    
    setLoadingToWallets(true);
    try {
      const res = await api.get(`/accounts/${accountId}/wallets`);
      setToWallets(res.data.data.wallets || []);
    } catch {
      setToWallets([]);
    } finally {
      setLoadingToWallets(false);
    }
  };

  // عند تغيير "من حساب" - جلب محافظه
  const handleFromAccountChange = async (accountId) => {
    form.setFieldsValue({ fromWallet: undefined });
    if (!accountId) { setFromWallets([]); return; }
    
    setLoadingFromWallets(true);
    try {
      const res = await api.get(`/accounts/${accountId}/wallets`);
      setFromWallets(res.data.data.wallets || []);
    } catch {
      setFromWallets([]);
    } finally {
      setLoadingFromWallets(false);
    }
  };

  // عند اختيار العميل - جلب فواتيره
  const handleClientChange = async (clientId) => {
    form.setFieldsValue({ invoice: undefined, contractMonth: undefined });
    if (!clientId) { 
      setInvoices([]); 
      setContractMonths([]); 
      return; 
    }

    setLoadingInvoices(true);
    try {
      // جلب الفواتير
      const invRes = await invoiceAPI.getAll({ limit: 200 });
      const allInvoices = invRes.data.data.invoices || [];
      const clientInvoices = allInvoices.filter(inv => {
        const invClientId = typeof inv.client === 'object' ? inv.client?._id : inv.client;
        return invClientId === clientId && inv.status !== 'مدفوعة' && inv.status !== 'ملغاة';
      });
      setInvoices(clientInvoices);

      // جلب العقود النشطة للعميل
      const contractsRes = await contractAPI.getAll({ client: clientId, status: 'نشط', limit: 100 });
      const clientContracts = contractsRes.data.data.contracts || [];
      console.log('📋 Contracts found:', clientContracts.length);

      // جلب كل أشهر العقود دفعة واحدة
      const monthPromises = clientContracts.map(contract => 
        contractAPI.getMonths(contract._id)
          .then(res => ({ contract, months: res.data.data.months || [] }))
          .catch(() => ({ contract, months: [] }))
      );
      
      const results = await Promise.all(monthPromises);
      
      const allMonths = [];
      results.forEach(({ contract, months }) => {
        const unpaidMonths = months.filter(m => 
          m.status === 'confirmed' || 
          m.status === 'overdue' || 
          m.status === 'partially_paid' || 
          m.status === 'pending_review'
        );
        unpaidMonths.forEach(m => {
          allMonths.push({ 
            ...m, 
            contractTitle: contract.title,
            contractId: contract._id 
          });
        });
      });

      console.log('📅 Unpaid months found:', allMonths.length);
      allMonths.forEach(m => console.log(`  - ${m.contractTitle} | ${m.month} | ${m.value} ${m.currency} | paid: ${m.paidAmount}`));
      
      setContractMonths(allMonths);
      
      if (clientInvoices.length === 0 && allMonths.length === 0) {
        message.info('لا توجد فواتير أو أشهر عقود غير مدفوعة لهذا العميل');
      }
    } catch (e) {
      console.error('Error:', e);
      setInvoices([]);
      setContractMonths([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        // 👈 تعديل
        await transactionAPI.update(id, values);
        message.success('تم تحديث المعاملة بنجاح');
      } else {
        // 👈 إضافة جديدة
        if (values.type === 'تحويل' && values.fromWallet && values.toWallet) {
          const fromW = fromWallets.find(w => w._id === values.fromWallet);
          const toW = toWallets.find(w => w._id === values.toWallet);
          if (fromW && toW && fromW.currency !== toW.currency) {
            values.originalAmount = values.amount;
          }
        }
        await transactionAPI.create(values);
        message.success('تمت إضافة المعاملة بنجاح');
      }
      navigate('/transactions');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في حفظ المعاملة');
    } finally {
      setSubmitting(false);
    }
  };

  const onTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({
      fromAccount: undefined, toAccount: undefined,
      fromWallet: undefined, toWallet: undefined,
      invoice: undefined, client: undefined
    });
    setToWallets([]);
    setFromWallets([]);
    setInvoices([]);
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/transactions')}>العودة</Button>
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? 'تعديل معاملة مالية' : 'إضافة معاملة مالية جديدة'}
        </Title>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ type: 'دخل', currency: 'USD', paymentMethod: 'تحويل بنكي', status: 'مكتمل' }}>

          {/* الصف الأول: النوع + المبلغ + العملة */}
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="type" label="نوع المعاملة" rules={[{ required: true }]}>
                <Select onChange={onTypeChange} options={[
                  { value: 'دخل', label: '💰 دخل' },
                  { value: 'مصروف', label: '💸 مصروف' },
                  { value: 'تحويل', label: '🔄 تحويل' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="amount" label="المبلغ" rules={[{ required: true, message: 'المبلغ مطلوب' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="العملة">
                <Select options={[
                  { value: 'USD', label: 'دولار $' },
                  { value: 'ILS', label: 'شيكل ₪' },
                  { value: 'SAR', label: 'ريال ﷼' },
                  { value: 'JOD', label: 'دينار د.أ' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* الصف الثاني: الحسابات والمحافظ */}
          <Row gutter={24}>
            {type === 'تحويل' ? (
              <>
                <Col xs={24} md={6}>
                  <Form.Item name="fromAccount" label="من حساب" rules={[{ required: true, message: 'مطلوب' }]}>
                    <Select placeholder="اختر الحساب" onChange={handleFromAccountChange}
                      options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="fromWallet" label="من محفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}>
                    <Select placeholder={loadingFromWallets ? 'جاري...' : 'اختر المحفظة'}
                      loading={loadingFromWallets} disabled={fromWallets.length === 0}
                      options={fromWallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="toAccount" label="إلى حساب" rules={[{ required: true, message: 'مطلوب' }]}>
                    <Select placeholder="اختر الحساب" onChange={handleToAccountChange}
                      options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="toWallet" label="إلى محفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}>
                    <Select placeholder={loadingToWallets ? 'جاري...' : 'اختر المحفظة'}
                      loading={loadingToWallets} disabled={toWallets.length === 0}
                      options={toWallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))} />
                  </Form.Item>
                </Col>
              </>
            ) : type === 'دخل' ? (
              <>
                <Col xs={24} md={8}>
                  <Form.Item name="toAccount" label="إلى حساب" rules={[{ required: true, message: 'مطلوب' }]}>
                    <Select placeholder="اختر الحساب" onChange={handleToAccountChange}
                      options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="toWallet" label="إلى محفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}>
                    <Select placeholder={loadingToWallets ? 'جاري...' : 'اختر المحفظة'}
                      loading={loadingToWallets} disabled={toWallets.length === 0}
                      options={toWallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))} />
                  </Form.Item>
                </Col>
              </>
            ) : (
              <>
                <Col xs={24} md={8}>
                  <Form.Item name="fromAccount" label="من حساب" rules={[{ required: true, message: 'مطلوب' }]}>
                    <Select placeholder="اختر الحساب" onChange={handleFromAccountChange}
                      options={accounts.map(a => ({ value: a._id, label: a.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="fromWallet" label="من محفظة" rules={[{ required: true, message: 'اختر المحفظة' }]}>
                    <Select placeholder={loadingFromWallets ? 'جاري...' : 'اختر المحفظة'}
                      loading={loadingFromWallets} disabled={fromWallets.length === 0}
                      options={fromWallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))} />
                  </Form.Item>
                </Col>
              </>
            )}
            <Col xs={24} md={4}>
              <Form.Item name="transactionDate" label="التاريخ" rules={[{ required: true }]}>
                <input type="date" style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="status" label="الحالة">
                <Select options={[
                  { value: 'مكتمل', label: 'مكتمل' },
                  { value: 'معلق', label: 'معلق' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* الصف الثالث: العميل + الفاتورة + شهر العقد (للدخل فقط) */}
          {type === 'دخل' && (
            <>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="client" label="العميل">
                    <Select placeholder="اختر العميل" allowClear showSearch optionFilterProp="label"
                      onChange={handleClientChange}
                      options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="invoice" label="ربط بفاتورة">
                    <Select placeholder={loadingInvoices ? 'جاري...' : 'اختر الفاتورة'} allowClear
                      loading={loadingInvoices}
                      notFoundContent="لا توجد فواتير"
                      options={invoices.map(inv => ({
                        value: inv._id,
                        label: `${inv.invoiceNumber || '—'} | متبقي: ${formatCurrency(inv.totalAmount - inv.paidAmount, inv.currency)}`
                      }))} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 👈 صف جديد: ربط بشهر عقد */}
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="contractMonth" label="ربط بشهر عقد (اختياري)">
                    <Select placeholder={loadingInvoices ? 'جاري...' : 'اختر شهر العقد'} allowClear
                      loading={loadingInvoices}
                      notFoundContent="لا توجد أشهر عقود غير مدفوعة"
                      options={contractMonths.map(m => ({
                        value: m._id,
                        label: `${m.contractTitle || 'عقد'} | ${m.month} | ${formatCurrency(m.value - (m.paidAmount || 0), m.currency)} متبقي`
                      }))} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* وسيلة الدفع + الوصف */}
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="paymentMethod" label="وسيلة الدفع">
                <Select options={[
                  { value: 'تحويل بنكي', label: 'تحويل بنكي' },
                  { value: 'نقد', label: 'نقد' },
                  { value: 'ريم', label: 'ريم' },
                  { value: 'أخرى', label: 'أخرى' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="description" label="الوصف">
                <input placeholder="وصف المعاملة..." style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/transactions')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {isEdit ? 'تحديث المعاملة' : 'حفظ المعاملة'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default TransactionForm;