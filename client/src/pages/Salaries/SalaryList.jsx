import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, message, Tag, Button, Modal, Form, InputNumber, Row, Col, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import salaryAPI from '../../api/salaries';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import dayjs from 'dayjs';

const { MonthPicker } = DatePicker;

const SalaryList = () => {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [editingSalary, setEditingSalary] = useState(null);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await salaryAPI.generate();
      message.success('تم توليد الرواتب بنجاح');
      fetchSalaries();
    } catch (e) {
      message.error('فشل توليد الرواتب');
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = (record) => {
    if (!record.invoice) {
      message.error('لا توجد فاتورة مرتبطة بهذا الراتب');
      return;
    }
    navigate(`/transactions/new?type=مصروف&invoice=${record.invoice._id}&amount=${record.remainingAmount}&client=${record.employee?._id}`);
  };

  const handleEdit = async (values) => {
    setEditSubmitting(true);
    try {
      const data = {
        ...values,
        month: values.month ? values.month.format('YYYY-MM') : values.month,
      };
      await salaryAPI.update(editingSalary._id, values);
      message.success('تم تحديث الراتب');
      setEditingSalary(null);
      editForm.resetFields();
      fetchSalaries();
    } catch (e) { message.error('فشل في التحديث'); }
    finally { setEditSubmitting(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await salaryAPI.delete(deleteTarget._id);
      message.success('تم حذف الراتب');
      setDeleteTarget(null);
      fetchSalaries();
    } catch (e) { message.error('فشل في الحذف'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    { title: 'الموظف', key: 'employee', width: 150, render: (_, r) => r.employee?.name || '—' },
    {
      title: 'الشهر', dataIndex: 'month', key: 'month', width: 110,
      render: (m) => {
        if (!m) return '—';
        const [y, mn] = m.split('-');
        const names = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return `${names[parseInt(mn) - 1]} ${y}`;
      },
    },
    {
      title: 'الراتب الأساسي', dataIndex: 'baseAmount', key: 'base', width: 110,
      render: (v, r) => formatCurrency(v, r.currency || 'USD'),
    },
    {
      title: 'الخصومات', dataIndex: 'deductions', key: 'ded', width: 100,
      render: (v, r) => v > 0 ? <span style={{ color: '#ef4444' }}>-{formatCurrency(v, r.currency)}</span> : '0',
    },
    {
      title: 'الصافي', dataIndex: 'totalAmount', key: 'amount', width: 120,
      render: (v, r) => <span style={{ fontWeight: 'bold' }}>{formatCurrency(v, r.currency || 'USD')}</span>,
    },
    {
      title: 'المدفوع', dataIndex: 'paidAmount', key: 'paid', width: 120,
      render: (v, r) => formatCurrency(v, r.currency || 'USD'),
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 100,
      render: (s, r) => (
        <Space direction="vertical" size={0}>
          <Tag color={s === 'مدفوع' ? 'green' : s === 'مدفوع جزئياً' ? 'blue' : 'orange'}>{s}</Tag>
          {r.invoice && <small style={{ fontSize: 10 }}>{r.invoice.invoiceNumber}</small>}
        </Space>
      ),
    },
    {
      title: 'تاريخ الدفع', dataIndex: 'paymentDate', key: 'payDate', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'إجراءات', key: 'actions', width: 160,
      render: (_, r) => (
        <Space size="small">
          {r.status !== 'مدفوع' && (
            <Button size="small" type="primary" onClick={() => handlePay(r)}>دفع</Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditingSalary(r);
            editForm.setFieldsValue({
              ...r,
              month: r.month ? dayjs(r.month) : undefined,
            });
          }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(r)} />
        </Space>
      ),
    },
  ];

  const [currencyFilter, setCurrencyFilter] = useState('');

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employee = employeeFilter;
      if (monthFilter) params.month = monthFilter;
      if (currencyFilter) params.currency = currencyFilter;
      const response = await salaryAPI.getAll(params);
      setSalaries(response.data.data.salaries);
      setTotal(response.data.total);
    } catch (error) { message.error('فشل في جلب الرواتب'); }
    finally { setLoading(false); }
  }, [page, pageSize, statusFilter, employeeFilter, monthFilter, currencyFilter]);

  const filterBar = (
    <Space wrap>
      <Button icon={<SyncOutlined />} loading={generating} onClick={handleGenerate}>توليد الرواتب</Button>
      <Select placeholder="الموظف" allowClear style={{ width: 150 }}
        value={employeeFilter || undefined}
        onChange={(v) => { setEmployeeFilter(v || ''); setPage(1); }}
        options={employees.map(e => ({ value: e._id, label: e.name }))} />
      <Select placeholder="العملة" allowClear style={{ width: 120 }}
        value={currencyFilter || undefined}
        onChange={(v) => { setCurrencyFilter(v || ''); setPage(1); }}
        options={currencies} />
      <Select placeholder="الحالة" allowClear style={{ width: 130 }}
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'مستحق', label: 'مستحق' }, { value: 'مدفوع', label: 'مدفوع' },
          { value: 'مدفوع جزئياً', label: 'مدفوع جزئياً' },
        ]} />
      <MonthPicker
        placeholder="اختر الشهر"
        onChange={(date) => {
          if (date) setMonthFilter(date.format('YYYY-MM'));
          else setMonthFilter('');
          setPage(1);
        }}
        style={{ fontFamily: 'Cairo, sans-serif' }}
      />
    </Space>
  );

  return (
    <>
      <DataTable
        title="الرواتب" columns={columns} dataSource={salaries}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/salaries/new" onRefresh={fetchSalaries}
        showActions={false} filters={filterBar}
      />

      {/* Modal تعديل */}
      <Modal
        title="تعديل الراتب"
        open={!!editingSalary}
        onCancel={() => setEditingSalary(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="حفظ" cancelText="إلغاء"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="month" label="الشهر">
            <MonthPicker style={{ width: '100%' }} format="YYYY-MM" />
          </Form.Item>
          <Form.Item name="baseAmount" label="الراتب الأساسي">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deductions" label="الخصومات">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bonuses" label="المكافآت">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="العملة">
            <Select options={currencies} />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف الراتب"
        message={`هل أنت متأكد من حذف راتب "${deleteTarget?.employee?.name}" لشهر "${deleteTarget?.month}"؟`}
        type="danger" />
    </>
  );
};

export default SalaryList;