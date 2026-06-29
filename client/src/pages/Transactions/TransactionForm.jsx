import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, Typography, InputNumber, message } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import transactionAPI from '../../api/transactions';
import toast from 'react-hot-toast';
import clientAPI from '../../api/clients';
import accountAPI from '../../api/accounts';
import invoiceAPI from '../../api/invoices';
import employeeAPI from '../../api/employees';
import vendorAPI from '../../api/vendors';
import api from '../../api/axios';
import { useParams } from 'react-router-dom';
import contractAPI from '../../api/contracts';
import projectAPI from '../../api/projects';
import FormField from '../../components/ui/FormField';
import { useCurrencies } from '../../hooks/useCurrencies';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const TransactionForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [otherInvoices, setOtherInvoices] = useState([]); // فواتير الرواتب والمصاريف الخ
  const [contractMonths, setContractMonths] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [type, setType] = useState('دخل');
  const { currencies } = useCurrencies();

  // المحافظ
  const [toWallets, setToWallets] = useState([]);
  const [fromWallets, setFromWallets] = useState([]);
  const [loadingToWallets, setLoadingToWallets] = useState(false);
  const [loadingFromWallets, setLoadingFromWallets] = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [allocationMode, setAllocationMode] = useState(false);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => { 
    clientAPI.getAll({ limit: 100 }).then(r => setClients(r.data.data.clients || [])).catch(() => {});
    accountAPI.getAll().then(r => setAccounts(r.data.data.accounts || [])).catch(() => {});
    projectAPI.getAll({ limit: 100 }).then(r => setProjects(r.data.data.projects || [])).catch(() => {});
    employeeAPI.getAll({ limit: 200 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
    vendorAPI.getAll({ limit: 200 }).then(r => setVendors(r.data.data.vendors || [])).catch(() => {});

    // قراءة البيانات من الرابط (Query Params)
    const params = new URLSearchParams(window.location.search);
    if (params.get('type')) {
      setType(params.get('type'));
      form.setFieldsValue({ type: params.get('type') });
    }
    if (params.get('invoice')) {
      form.setFieldsValue({ invoice: params.get('invoice') });
    }
    if (params.get('amount')) {
      form.setFieldsValue({ amount: parseFloat(params.get('amount')) });
    }
    if (params.get('client')) {
      form.setFieldsValue({ client: params.get('client') });
      handleClientChange(params.get('client'));
    }
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
      toast.error('فشل في جلب بيانات المعاملة');
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

  // عند اختيار العميل/الموظف/المورد - جلب الفواتير
  const handleClientChange = async (clientId) => {
    form.setFieldsValue({ invoice: undefined, contractMonth: undefined, employee: undefined, vendor: undefined });
    if (!clientId) { 
      setInvoices([]); 
      setContractMonths([]); 
      return; 
    }

    setLoadingInvoices(true);
    try {
      // جلب الفواتير
      const invRes = await invoiceAPI.getAll({ limit: 500 });
      const allInvoices = invRes.data.data.invoices || [];

      const clientInvoices = allInvoices
        .filter(inv => {
          const invClientId = typeof inv.client === 'object' ? inv.client?._id : inv.client;
          const invEmpId = typeof inv.employee === 'object' ? inv.employee?._id : inv.employee;
          const invVendorId = typeof inv.vendor === 'object' ? inv.vendor?._id : inv.vendor;

          return (invClientId === clientId || invEmpId === clientId || invVendorId === clientId) &&
                 inv.status !== 'مدفوعة' && inv.status !== 'ملغاة';
        })
        .map(inv => ({ ...inv, contractMonthId: inv.contractMonth || null }));

      setInvoices(clientInvoices);

      // فواتير أخرى تظهر عندما لا يكون هناك عميل محدد (للمصاريف العامة)
      const others = allInvoices.filter(inv =>
        ['راتب', 'سلفة', 'مصروف', 'اشتراك'].includes(inv.invoiceType) &&
        inv.status !== 'مدفوعة' && inv.status !== 'ملغاة' &&
        !inv.client && !inv.employee && !inv.vendor
      );
      setOtherInvoices(others);

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
        // اسم العميل من العقد
        const contractClientName = typeof contract.client === 'object' 
          ? (contract.client?.name || '') 
          : '';
        
        unpaidMonths.forEach(m => {
          allMonths.push({ 
            ...m, 
            contractTitle: contract.title,
            contractId: contract._id,
            clientName: contractClientName,
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

  const handleEmployeeChange = async (employeeId) => {
    form.setFieldsValue({ invoice: undefined, contractMonth: undefined, client: undefined, vendor: undefined });
    if (!employeeId) { setInvoices([]); setContractMonths([]); return; }

    setLoadingInvoices(true);
    try {
      const invRes = await invoiceAPI.getAll({ limit: 500 });
      const allInvoices = invRes.data.data.invoices || [];

      const empInvoices = allInvoices
        .filter(inv => {
          const invEmpId = typeof inv.employee === 'object' ? inv.employee?._id : inv.employee;
          return invEmpId === employeeId && inv.status !== 'مدفوعة' && inv.status !== 'ملغاة';
        })
        .map(inv => ({ ...inv, contractMonthId: inv.contractMonth || null }));

      setInvoices(empInvoices);
      setOtherInvoices([]);
      setContractMonths([]);

      if (empInvoices.length === 0) {
        message.info('لا توجد فواتير غير مدفوعة مرتبطة بهذا الموظف');
      }
    } catch (e) {
      console.error('Error loading employee invoices:', e);
      setInvoices([]);
      setOtherInvoices([]);
      setContractMonths([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleVendorChange = async (vendorId) => {
    form.setFieldsValue({ invoice: undefined, contractMonth: undefined, client: undefined, employee: undefined });
    if (!vendorId) { setInvoices([]); setContractMonths([]); return; }

    setLoadingInvoices(true);
    try {
      const invRes = await invoiceAPI.getAll({ limit: 500 });
      const allInvoices = invRes.data.data.invoices || [];

      const vendorInvoices = allInvoices
        .filter(inv => {
          const invVendorId = typeof inv.vendor === 'object' ? inv.vendor?._id : inv.vendor;
          return invVendorId === vendorId && inv.status !== 'مدفوعة' && inv.status !== 'ملغاة';
        })
        .map(inv => ({ ...inv, contractMonthId: inv.contractMonth || null }));

      setInvoices(vendorInvoices);
      setOtherInvoices([]);
      setContractMonths([]);

      if (vendorInvoices.length === 0) {
        message.info('لا توجد فواتير غير مدفوعة مرتبطة بهذا المورد');
      }
    } catch (e) {
      console.error('Error loading vendor invoices:', e);
      setInvoices([]);
      setOtherInvoices([]);
      setContractMonths([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (allocationMode && selectedInvoices.length > 0) {
        // 👈 وضع التوزيع: إنشاء معاملة واحدة مع توزيعات
        const totalAllocated = selectedInvoices.reduce((sum, inv) => sum + (inv.allocatedAmount || 0), 0);
        
        // التحقق من تطابق المجموع
        if (Math.abs(totalAllocated - values.amount) > 0.01) {
          toast.error(`مجموع التوزيعات (${totalAllocated}) لا يساوي مبلغ المعاملة (${values.amount})`);
          setSubmitting(false);
          return;
        }
        
        // إنشاء allocations
        const allocations = selectedInvoices.map(inv => ({
          invoice: inv._id,
          amount: inv.allocatedAmount,
          contractMonth: inv.contractMonthId || undefined,
        }));
        
        const data = {
          ...values,
          allocations,
          client: values.client,
          project: values.project || undefined,
          type: 'دخل',
          invoice: undefined,
          contractMonth: undefined,
        };
        
        await transactionAPI.create(data);
        message.success('تمت إضافة المعاملة وتوزيعها بنجاح');
      } else if (isEdit) {
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
      toast.error(e.response?.data?.message || 'فشل في حفظ المعاملة');
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
  // إضافة فاتورة لقائمة التوزيع
  const addInvoiceToAllocation = (invoiceId) => {
    if (!invoiceId) return;
    
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (!invoice) return;
    
    // التحقق من عدم وجودها مسبقاً
    if (selectedInvoices.find(i => i._id === invoiceId)) {
      message.warning('هذه الفاتورة مضافة بالفعل');
      return;
    }
    
    const remaining = invoice.totalAmount - (invoice.paidAmount || 0);
    
    setSelectedInvoices([...selectedInvoices, {
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount || 0,
      remaining: remaining,
      allocatedAmount: remaining, // افتراضياً: المبلغ المتبقي كامل
      currency: invoice.currency,
      invoiceType: invoice.invoiceType,
      contractMonthId: invoice.contractMonthId, // إذا كانت مرتبطة بشهر عقد
    }]);
    
    // مسح الاختيار من القائمة المنسدلة
    form.setFieldsValue({ invoice: undefined });
  };

  // إزالة فاتورة من التوزيع
  const removeInvoiceFromAllocation = (invoiceId) => {
    setSelectedInvoices(selectedInvoices.filter(i => i._id !== invoiceId));
  };

  // تحديث المبلغ المخصص لفاتورة
  const updateAllocatedAmount = (invoiceId, amount) => {
    setSelectedInvoices(selectedInvoices.map(i => 
      i._id === invoiceId ? { ...i, allocatedAmount: amount || 0 } : i
    ));
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
                <Select options={currencies} />
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
                      options={fromWallets.map(w => ({ value: w._id, label: `${w.name} (${formatCurrency(w.balance, w.currency)})` }))} />
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
                      options={toWallets.map(w => ({ value: w._id, label: `${w.name} (${formatCurrency(w.balance, w.currency)})` }))} />
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
                      options={toWallets.map(w => ({ value: w._id, label: `${w.name} (${formatCurrency(w.balance, w.currency)})` }))} />
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
                      options={fromWallets.map(w => ({ value: w._id, label: `${w.name} (${formatCurrency(w.balance, w.currency)})` }))} />
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
          {(type === 'دخل' || type === 'مصروف') && !allocationMode && (
            <>
              <Row gutter={24}>
                <Col xs={24} md={type === 'دخل' ? 12 : 8}>
                  <Form.Item name="client" label={type === 'دخل' ? "العميل" : "العميل (اختياري)"}>
                    <Select placeholder="اختر العميل" allowClear showSearch optionFilterProp="label"
                      onChange={handleClientChange}
                      options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
                  </Form.Item>
                </Col>

                {type === 'دخل' && (
                  <Col xs={24} md={12}>
                    <Form.Item name="project" label="المشروع (اختياري)">
                      <Select placeholder="اختر المشروع" allowClear showSearch optionFilterProp="label"
                        options={projects
                          .filter(p => {
                            const clientId = form.getFieldValue('client');
                            const pClientId = typeof p.client === 'object' ? p.client?._id : p.client;
                            return clientId && pClientId === clientId;
                          })
                          .map(p => ({ value: p._id, label: `${p.title} | ${p.totalValue} ${p.currency}` }))} />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={type === 'دخل' ? 12 : 16}>
                  <Form.Item name="invoice" label="ربط بفاتورة">
                    <Select placeholder={loadingInvoices ? 'جاري...' : 'اختر الفاتورة'} allowClear
                      loading={loadingInvoices}
                      notFoundContent="لا توجد فواتير"
                      options={[
                        ...(type === 'دخل' ? invoices : otherInvoices).map(inv => {
                          // استخراج اسم العميل (السلسلة الأولى حتى أول مسافة لتوفير المساحة)
                          const clientName = typeof inv.client === 'object' ? (inv.client?.name || '') : '';
                          const clientCompany = typeof inv.client === 'object' ? (inv.client?.company || '') : '';
                          const clientLabel = clientName ? `${clientName}${clientCompany ? ` - ${clientCompany}` : ''}` : '';
                          
                          // معلومات الشهر إذا كانت فاتورة مرتبطة بشهر عقد
                          const monthInfo = inv.contractMonth?.month ? ` | شهر ${inv.contractMonth.month}` : '';
                          
                          const remaining = inv.totalAmount - (inv.paidAmount || 0);
                          
                          return {
                            value: inv._id,
                            label: `${inv.invoiceNumber || '—'} [${inv.invoiceType || ''}]${clientLabel ? ` | ${clientLabel}` : ''}${monthInfo} | ${formatCurrency(remaining, inv.currency)} متبقي`
                          };
                        })
                      ]} />
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
                        label: `${m.clientName ? m.clientName + ' | ' : ''}${m.contractTitle || 'عقد'} | شهر ${m.month} | ${formatCurrency(m.value - (m.paidAmount || 0), m.currency)} متبقي`
                      }))} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
          {type === 'دخل' && allocationMode && (
            <>
              <Row gutter={24} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', color: '#334155' }}>
                    <strong>توزيع الدفعة نشط.</strong> اختر العميل والمشروع ثم حدد الفواتير في قسم التوزيع.
                  </div>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="client" label="العميل" rules={[{ required: true, message: 'اختر العميل' }]}>
                    <Select placeholder="اختر العميل" allowClear showSearch optionFilterProp="label"
                      onChange={handleClientChange}
                      options={clients.map(c => ({ value: c._id, label: c.company ? `${c.name} - ${c.company}` : c.name }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="project" label="المشروع (اختياري)">
                    <Select placeholder="اختر المشروع" allowClear showSearch optionFilterProp="label"
                      options={projects
                        .filter(p => {
                          const clientId = form.getFieldValue('client');
                          const pClientId = typeof p.client === 'object' ? p.client?._id : p.client;
                          return clientId && pClientId === clientId;
                        })
                        .map(p => ({ value: p._id, label: `${p.title} | ${p.totalValue} ${p.currency}` }))} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* قسم توزيع الدفعة على عدة فواتير */}
          {type === 'دخل' && (
            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <span>توزيع الدفعة على الفواتير</span>
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => setAllocationMode(!allocationMode)}
                      >
                        {allocationMode ? 'إلغاء التوزيع' : 'تفعيل التوزيع المتعدد'}
                      </Button>
                    </Space>
                  }
                  style={{ background: allocationMode ? '#f0f9ff' : '#f8fafc', borderRadius: 8 }}
                >
                  {allocationMode ? (
                    <>
                      {/* إضافة فاتورة */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col flex="auto">
                          <Select
                            placeholder="اختر فاتورة لإضافتها للتوزيع"
                            allowClear
                            showSearch
                            style={{ width: '20%' }}
                            optionFilterProp="label"
                            value={undefined}
                            onChange={addInvoiceToAllocation}
                            options={invoices
                              .filter(inv => !selectedInvoices.find(si => si._id === inv._id))
                              .map(inv => ({
                                value: inv._id,
                                label: `${inv.invoiceNumber || '—'} | ${formatCurrency(inv.totalAmount - (inv.paidAmount || 0), inv.currency)} متبقي | ${inv.invoiceType || ''}`
                              }))}
                          />
                        </Col>
                      </Row>

                      {/* قائمة الفواتير المحددة */}
                      {selectedInvoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>
                          لم تتم إضافة فواتير بعد - اختر من القائمة أعلاه
                        </div>
                      ) : (
                        <>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#e2e8f0' }}>
                                <th style={{ padding: 8, textAlign: 'right' }}>الفاتورة</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>المبلغ الكلي</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>المدفوع سابقاً</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>المتبقي</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>المبلغ المدفوع الآن</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>✕</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedInvoices.map(inv => (
                                <tr key={inv._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: 8 }}>{inv.invoiceNumber || '—'}</td>
                                  <td style={{ padding: 8, textAlign: 'center' }}>{formatCurrency(inv.totalAmount, inv.currency)}</td>
                                  <td style={{ padding: 8, textAlign: 'center' }}>{formatCurrency(inv.paidAmount, inv.currency)}</td>
                                  <td style={{ padding: 8, textAlign: 'center', color: '#ef4444' }}>{formatCurrency(inv.remaining, inv.currency)}</td>
                                  <td style={{ padding: 8, textAlign: 'center' }}>
                                    <InputNumber
                                      min={0}
                                      max={inv.remaining}
                                      value={inv.allocatedAmount}
                                      onChange={(val) => updateAllocatedAmount(inv._id, val)}
                                      style={{ width: 100 }}
                                    />
                                  </td>
                                  <td style={{ padding: 8, textAlign: 'center' }}>
                                    <Button type="text" danger size="small" onClick={() => removeInvoiceFromAllocation(inv._id)}>✕</Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                                <td style={{ padding: 8 }}>المجموع</td>
                                <td style={{ padding: 8, textAlign: 'center' }}></td>
                                <td style={{ padding: 8, textAlign: 'center' }}></td>
                                <td style={{ padding: 8, textAlign: 'center' }}></td>
                                <td style={{ padding: 8, textAlign: 'center', fontSize: 16, color: selectedInvoices.reduce((s, i) => s + (i.allocatedAmount || 0), 0) === form.getFieldValue('amount') ? '#10b981' : '#ef4444' }}>
                                  {formatCurrency(selectedInvoices.reduce((s, i) => s + (i.allocatedAmount || 0), 0))}
                                </td>
                                <td style={{ padding: 8, textAlign: 'center' }}></td>
                              </tr>
                            </tfoot>
                          </table>
                          
                          {selectedInvoices.reduce((s, i) => s + (i.allocatedAmount || 0), 0) !== (form.getFieldValue('amount') || 0) && (
                            <div style={{ marginTop: 8, color: '#ef4444', fontSize: 13 }}>
                              ⚠️ مجموع التوزيعات يجب أن يساوي مبلغ المعاملة
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8' }}>
                      فعّل التوزيع المتعدد لتتمكن من توزيع دفعة واحدة على عدة فواتير
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* وسيلة الدفع + الوصف */}
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField type="smartselect" name="paymentMethod" label="وسيلة الدفع" options={[
                  { value: 'تحويل بنكي', label: 'تحويل بنكي' },
                  { value: 'نقد', label: 'نقد' },
                  { value: 'ريم', label: 'ريم' },
                  { value: 'أخرى', label: 'أخرى' },
                ]} allowCreate />
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