import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, message, Tag, Button, Modal, Form, InputNumber, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import salaryAPI from '../../api/salaries';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import dayjs from 'dayjs';

const { MonthPicker } = DatePicker;
const { Text, Title } = Typography;

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
    navigate(`/transactions/new?type=مصروف&invoice=${record.invoice._id}&amount=${record.remainingAmount}&employee=${record.employee?._id}`);
  };

  const handleEdit = async (values) => {
    setEditSubmitting(true);
    try {
      const data = {
        ...values,
        month: values.month ? values.month.format('YYYY-MM') : values.month,
      };
      await salaryAPI.update(editingSalary._id, data);
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
    {
      title: 'الموظف',
      key: 'employee',
      width: 180,
      render: (_, r) => (
        <Space>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <CreditCardOutlined />
          </div>
          <Text strong className="text-slate-900">{r.employee?.name || '—'}</Text>
        </Space>
      )
    },
    {
      title: 'فترة الراتب',
      dataIndex: 'month',
      key: 'month',
      width: 130,
      render: (m) => {
        if (!m) return '—';
        const [y, mn] = m.split('-');
        const names = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return <span className="text-slate-600 font-medium">{names[parseInt(mn) - 1]} {y}</span>;
      },
    },
    {
      title: 'المستحقات',
      key: 'financials',
      width: 200,
      render: (_, r) => (
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">الأساسي:</span>
            <span className="font-medium">{formatCurrency(r.baseAmount, r.currency)}</span>
          </div>
          {r.deductions > 0 && (
            <div className="flex justify-between text-xs text-rose-500">
              <span>الخصومات:</span>
              <span>-{formatCurrency(r.deductions, r.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>الصافي:</span>
            <span>{formatCurrency(r.totalAmount, r.currency)}</span>
          </div>
        </div>
      )
    },
    {
      title: 'حالة الدفع',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s, r) => (
        <div className="space-y-1">
          <Tag className={`m-0 rounded-full border-0 px-3 py-0.5 ${
            s === 'مدفوع' ? 'bg-emerald-50 text-emerald-600' :
            s === 'مدفوع جزئياً' ? 'bg-blue-50 text-blue-600' :
            'bg-amber-50 text-amber-600'
          }`}>
            {s}
          </Tag>
          {r.invoice && <div className="text-[10px] text-slate-400 font-mono">{r.invoice.invoiceNumber}</div>}
        </div>
      ),
    },
    {
      title: 'آخر دفعة',
      dataIndex: 'paymentDate',
      key: 'payDate',
      width: 120,
      render: (d) => <span className="text-xs text-slate-500">{d ? new Date(d).toLocaleDateString('ar-SA') : '—'}</span>,
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space>
          {r.status !== 'مدفوع' && (
            <Button size="small" type="primary" className="rounded-md h-7 text-xs" onClick={() => handlePay(r)}>دفع</Button>
          )}
          <Button
            size="small"
            type="text"
            className="text-slate-400 hover:text-blue-600 flex items-center justify-center"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingSalary(r);
              editForm.setFieldsValue({
                ...r,
                month: r.month ? dayjs(r.month) : undefined,
              });
            }}
          />
          <Button
            size="small"
            type="text"
            danger
            className="flex items-center justify-center"
            icon={<DeleteOutlined />}
            onClick={() => setDeleteTarget(r)}
          />
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

  useEffect(() => { fetchSalaries(); }, [fetchSalaries]);

  const filterBar = (
    <Space wrap>
      <Button
        type="default"
        className="rounded-lg border-blue-200 text-blue-600 flex items-center gap-2"
        icon={<SyncOutlined />}
        loading={generating}
        onClick={handleGenerate}
      >
        توليد الرواتب
      </Button>
      <Select
        placeholder="الموظف"
        allowClear
        className="w-48"
        value={employeeFilter || undefined}
        onChange={(v) => { setEmployeeFilter(v || ''); setPage(1); }}
        options={employees.map(e => ({ value: e._id, label: e.name }))}
      />
      <Select
        placeholder="الحالة"
        allowClear
        className="w-32"
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'مستحق', label: 'مستحق' },
          { value: 'مدفوع', label: 'مدفوع' },
          { value: 'مدفوع جزئياً', label: 'مدفوع جزئياً' },
        ]}
      />
      <MonthPicker
        placeholder="اختر الشهر"
        className="rounded-lg w-40"
        onChange={(date) => {
          if (date) setMonthFilter(date.format('YYYY-MM'));
          else setMonthFilter('');
          setPage(1);
        }}
      />
    </Space>
  );

  return (
    <div className="space-y-4">
      <DataTable
        title="كشوفات الرواتب"
        columns={columns}
        dataSource={salaries}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/salaries/new"
        onRefresh={fetchSalaries}
        showActions={false}
        filters={filterBar}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <EditOutlined />
            </div>
            <span>تعديل بيانات الراتب</span>
          </div>
        }
        open={!!editingSalary}
        onCancel={() => setEditingSalary(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="تحديث البيانات"
        cancelText="إلغاء"
        className="modern-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="month" label="شهر الاستحقاق">
              <MonthPicker className="w-full" format="YYYY-MM" />
            </Form.Item>
            <Form.Item name="currency" label="العملة">
              <Select options={currencies} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="baseAmount" label="الأساسي">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item name="deductions" label="الخصومات">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item name="bonuses" label="المكافآت">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف قيد الراتب"
        message={`هل أنت متأكد من حذف قيد راتب "${deleteTarget?.employee?.name}" لشهر "${deleteTarget?.month}"؟`}
        description="هذا الإجراء سيؤدي إلى حذف القيد المالي المرتبط. يرجى التأكد قبل المتابعة."
        type="danger"
      />
    </div>
  );
};

export default SalaryList;
