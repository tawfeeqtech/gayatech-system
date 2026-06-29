import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, DatePicker, Tag, Button, Modal, Form, InputNumber, Table, Typography, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import advanceAPI from '../../api/advances';
import employeeAPI from '../../api/employees';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import toast from 'react-hot-toast';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const AdvanceList = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Approval modal state
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [employeeAdvances, setEmployeeAdvances] = useState([]);
  const [employeeAdvancesLoading, setEmployeeAdvancesLoading] = useState(false);
  const [installmentAmount, setInstallmentAmount] = useState(null);
  const [approving, setApproving] = useState(false);

  // Detail modal state
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data.employees || [])).catch(() => {});
  }, []);

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employee = employeeFilter;
      if (currencyFilter) params.currency = currencyFilter;
      const response = await advanceAPI.getAll(params);
      setAdvances(response.data.data.advances);
      setTotal(response.data.total);
    } catch (error) { toast.error('فشل في جلب السلف'); }
    finally { setLoading(false); }
  }, [page, pageSize, statusFilter, employeeFilter]);

  useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

  const openApprovalModal = async (advance) => {
    setApprovalTarget(advance);
    setInstallmentAmount(null);
    setEmployeeAdvancesLoading(true);
    try {
      const res = await advanceAPI.getAll({
        employee: advance.employee?._id || advance.employee,
        limit: 50,
      });
      const allAdvances = res.data.data.advances || [];
      const active = allAdvances.filter(a => a.status !== 'مسددة' && a.status !== 'مرفوضة');
      setEmployeeAdvances(active);
    } catch (e) {
      setEmployeeAdvances([]);
    } finally {
      setEmployeeAdvancesLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalTarget) return;
    setApproving(true);
    try {
      await advanceAPI.approve(approvalTarget._id, {
        installmentAmount: installmentAmount ? parseFloat(installmentAmount) : undefined,
      });
      toast.success('تمت الموافقة على السلفة');
      setApprovalTarget(null);
      fetchAdvances();
    } catch (e) {
      toast.error('فشل في الموافقة');
    } finally {
      setApproving(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'reject') {
        await advanceAPI.reject(id);
        toast.success('تم الرفض');
        fetchAdvances();
      }
    } catch (e) { toast.error('فشل'); }
  };

  const handleEdit = async (values) => {
    setEditSubmitting(true);
    try {
      await advanceAPI.update(editingAdvance._id, values);
      toast.success('تم التحديث');
      setEditingAdvance(null);
      fetchAdvances();
    } catch (e) { toast.error('فشل في التحديث'); }
    finally { setEditSubmitting(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await advanceAPI.delete(deleteTarget._id);
      toast.success('تم الحذف');
      setDeleteTarget(null);
      fetchAdvances();
    } catch (e) { toast.error('فشل'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    { title: 'الموظف', key: 'employee', width: 140, render: (_, r) => r.employee?.name || '—' },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v, r) => formatCurrency(v, r.currency || 'USD'),
    },
    {
      title: 'المسدد', dataIndex: 'repaidAmount', key: 'repaid', width: 110,
      render: (v, r) => <span style={{ color: '#10b981' }}>{formatCurrency(v, r.currency || 'USD')}</span>,
    },
    {
      title: 'المتبقي', dataIndex: 'remainingAmount', key: 'rem', width: 110,
      render: (v, r) => <span style={{ color: v > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(v, r.currency || 'USD')}</span>,
    },
    { title: 'التاريخ', dataIndex: 'requestDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    { title: 'السبب', dataIndex: 'reason', key: 'reason', width: 150, ellipsis: true },
    {
      title: 'الاتفاق', key: 'agreement', width: 180,
      render: (_, r) => {
        if (r.status === 'معلقة') return <Tag>بانتظار الموافقة</Tag>;
        if (r.status === 'مرفوضة') return <Tag color="red">مرفوضة</Tag>;
        return (
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <span>{r.repaymentMethod || '—'}</span>
            {r.installmentAmount ? (
              <span style={{ color: '#8b5cf6' }}>
                📅 قسط: {formatCurrency(r.installmentAmount, r.currency)}
              </span>
            ) : (
              r.status !== 'معلقة' && r.status !== 'مرفوضة' ? (
                <span style={{ color: '#f59e0b' }}>خصم كامل من أول راتب</span>
              ) : null
            )}
            {r.expectedRepaymentDate && (
              <span style={{ color: '#64748b' }}>
                📆 {new Date(r.expectedRepaymentDate).toLocaleDateString('ar-SA')}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 120,
      render: (s, r) => {
        const colors = { 'مسددة': 'green', 'موافق عليها': 'blue', 'مرفوضة': 'red', 'معلقة': 'orange', 'مسددة جزئياً': 'purple' };
        return (
          <Space direction="vertical" size={0}>
            <Tag color={colors[s] || 'default'}>{s}</Tag>
            {r.invoice && <small style={{ fontSize: 10 }}>{r.invoice.invoiceNumber}</small>}
          </Space>
        );
      },
    },
    {
      title: 'إجراءات', key: 'actions', width: 200,
      render: (_, r) => (
        <Space size="small">
          {r.status === 'معلقة' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openApprovalModal(r)}>موافقة</Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleAction(r._id, 'reject')}>رفض</Button>
            </>
          )}
          <Button size="small" type="link" onClick={() => setDetailTarget(r)}>تفاصيل</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditingAdvance(r);
            editForm.setFieldsValue(r);
          }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(r)} />
        </Space>
      ),
    },
  ];

  const filterBar = (
    <Space wrap>
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
          { value: 'معلقة', label: 'معلقة' }, { value: 'موافق عليها', label: 'موافق عليها' },
          { value: 'مسددة', label: 'مسددة' }, { value: 'مسددة جزئياً', label: 'مسددة جزئياً' },
          { value: 'مرفوضة', label: 'مرفوضة' },
        ]} />
    </Space>
  );

  // حساب إجمالي المبالغ المتبقية
  const totalRemaining = employeeAdvances
    .filter(a => a._id !== approvalTarget?._id)
    .reduce((sum, a) => sum + (a.remainingAmount || a.amount || 0), 0);

  return (
    <>
      <DataTable
        title="السلف" columns={columns} dataSource={advances}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/advances/new" onRefresh={fetchAdvances}
        showActions={false} filters={filterBar}
        rowSelection={true}
        onBulkDelete={(ids) => advanceAPI.bulkDelete(ids)}
        onBulkEdit={(ids, field, value) => advanceAPI.bulkUpdate(ids, field, value)}
      />

      {/* مودال الموافقة مع عرض سلف الموظف السابقة */}
      <Modal
        title={`الموافقة على سلفة - ${approvalTarget?.employee?.name || ''}`}
        open={!!approvalTarget}
        onCancel={() => setApprovalTarget(null)}
        onOk={handleApprove}
        confirmLoading={approving}
        okText="موافقة"
        cancelText="إلغاء"
        width={700}
      >
        {approvalTarget && (
          <div dir="rtl">
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="المبلغ">{formatCurrency(approvalTarget.amount, approvalTarget.currency)}</Descriptions.Item>
              <Descriptions.Item label="العملة">{approvalTarget.currency}</Descriptions.Item>
              <Descriptions.Item label="طريقة السداد">{approvalTarget.repaymentMethod}</Descriptions.Item>
              <Descriptions.Item label="السبب">{approvalTarget.reason || '—'}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 0 }}>
              السلف الغير مسددة لهذا الموظف
              {totalRemaining > 0 && (
                <Text style={{ fontSize: 14, fontWeight: 'normal', marginRight: 12 }}>
                  (المتبقي الإجمالي: <Text type="danger" strong>{formatCurrency(totalRemaining, 'USD')}</Text>)
                </Text>
              )}
            </Title>

            {employeeAdvancesLoading ? (
              <Text type="secondary">جاري تحميل السلف السابقة...</Text>
            ) : employeeAdvances.filter(a => a._id !== approvalTarget._id).length === 0 ? (
              <Text type="secondary">لا توجد سلف سابقة غير مسددة لهذا الموظف</Text>
            ) : (
              <Table
                dataSource={employeeAdvances.filter(a => a._id !== approvalTarget._id)}
                columns={[
                  { title: 'المبلغ', dataIndex: 'amount', width: 100, render: (v, r) => formatCurrency(v, r.currency) },
                  { title: 'المسدد', dataIndex: 'repaidAmount', width: 100, render: (v, r) => formatCurrency(v, r.currency) },
                  { title: 'المتبقي', dataIndex: 'remainingAmount', width: 100, render: (v, r) => <Text type={v > 0 ? 'danger' : 'success'}>{formatCurrency(v, r.currency)}</Text> },
                  { title: 'القسط الشهري', dataIndex: 'installmentAmount', width: 100, render: (v, r) => v ? formatCurrency(v, r.currency) : <Text type="secondary">—</Text> },
                  { title: 'الحالة', dataIndex: 'status', width: 100, render: (s) => <Tag>{s}</Tag> },
                ]}
                rowKey="_id"
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
              />
            )}

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
              <Text strong>مبلغ القسط الشهري (اختياري):</Text>
              <div style={{ marginTop: 8 }}>
                <InputNumber
                  value={installmentAmount}
                  onChange={(v) => setInstallmentAmount(v)}
                  min={0}
                  placeholder="اتركه فارغاً للخصم الكامل من أول راتب"
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                إذا تركت الحقل فارغاً، سيتم خصم كامل المبلغ من أول راتب
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* مودال تفاصيل السلفة */}
      <Modal
        title={`تفاصيل السلفة - ${detailTarget?.employee?.name || ''}`}
        open={!!detailTarget}
        onCancel={() => setDetailTarget(null)}
        footer={<Button onClick={() => setDetailTarget(null)} type="primary">إغلاق</Button>}
        width={600}
      >
        {detailTarget && (
          <div dir="rtl">
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="الموظف">{detailTarget.employee?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="المبلغ">{formatCurrency(detailTarget.amount, detailTarget.currency)}</Descriptions.Item>
              <Descriptions.Item label="العملة">{detailTarget.currency}</Descriptions.Item>
              <Descriptions.Item label="المسدد">{formatCurrency(detailTarget.repaidAmount, detailTarget.currency)}</Descriptions.Item>
              <Descriptions.Item label="المتبقي">
                <Text type={detailTarget.remainingAmount > 0 ? 'danger' : 'success'}>
                  {formatCurrency(detailTarget.remainingAmount, detailTarget.currency)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="طريقة السداد">{detailTarget.repaymentMethod || '—'}</Descriptions.Item>
              <Descriptions.Item label="القسط الشهري">
                {detailTarget.installmentAmount
                  ? formatCurrency(detailTarget.installmentAmount, detailTarget.currency)
                  : <Text type="secondary">خصم كامل</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ الطلب">
                {detailTarget.requestDate ? new Date(detailTarget.requestDate).toLocaleDateString('ar-SA') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ السداد المتوقع">
                {detailTarget.expectedRepaymentDate ? new Date(detailTarget.expectedRepaymentDate).toLocaleDateString('ar-SA') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="السبب" span={2}>{detailTarget.reason || '—'}</Descriptions.Item>
              <Descriptions.Item label="الحالة" span={2}>
                <Tag color={
                  detailTarget.status === 'مسددة' ? 'green' :
                  detailTarget.status === 'موافق عليها' ? 'blue' :
                  detailTarget.status === 'مرفوضة' ? 'red' :
                  detailTarget.status === 'معلقة' ? 'orange' : 'purple'
                }>{detailTarget.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {detailTarget.deductions && detailTarget.deductions.length > 0 && (
              <>
                <Title level={5}>سجل الخصومات</Title>
                <Table
                  dataSource={detailTarget.deductions}
                  columns={[
                    { title: 'المبلغ', dataIndex: 'amount', width: 100, render: (v) => formatCurrency(v, detailTarget.currency) },
                    { title: 'التاريخ', dataIndex: 'date', width: 120, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
                  ]}
                  rowKey={(_, i) => i}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal تعديل */}
      <Modal
        title="تعديل السلفة"
        open={!!editingAdvance}
        onCancel={() => setEditingAdvance(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="حفظ" cancelText="إلغاء"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="amount" label="المبلغ">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="repaidAmount" label="المبلغ المسدد">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="العملة">
            <Select options={currencies} />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف السلفة"
        message={`هل أنت متأكد من حذف سلفة "${deleteTarget?.employee?.name}"؟`} type="danger" />
    </>
  );
};

export default AdvanceList;