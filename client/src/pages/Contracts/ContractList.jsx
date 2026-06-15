import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import contractAPI from '../../api/contracts';
import { formatCurrency } from '../../utils/formatters';
const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await contractAPI.getAll(params);
      setContracts(response.data.data.contracts);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب بيانات العقود');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await contractAPI.delete(deleteTarget._id);
      message.success('تم حذف العقد بنجاح');
      setDeleteTarget(null);
      fetchContracts();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حذف العقد');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'رقم العقد',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 140,
      render: (text) => (
        <Tag color="blue" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {text || '—'}
        </Tag>
      ),
    },
    {
      title: 'العنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.serviceType}</div>
        </div>
      ),
    },
    {
      title: 'العميل',
      key: 'client',
      width: 160,
      render: (_, record) =>
        record.client ? (
          <span>{record.client.name}{record.client.company ? ` - ${record.client.company}` : ''}</span>
        ) : '—',
    },
    {
      title: 'القيمة الشهرية',
      dataIndex: 'defaultMonthlyValue',
      key: 'value',
      width: 130,
      render: (value, record) => formatCurrency(value, record.currency),
    },
    {
      title: 'تاريخ البداية',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString('ar-SA') : '—'),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusBadge status={status} mapping={statusColors.contract} />,
    },
    {
      title: 'الأشهر',
      key: 'months',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const stats = record.computedStats || {};
        return (
          <Space size={4}>
            <Tag color="green">{stats.paidMonths || 0} مدفوع</Tag>
            <Tag color="orange">{stats.pendingMonths || 0} معلق</Tag>
          </Space>
        );
      },
    },
  ];

  const filterBar = (
    <Select
      placeholder="فلترة حسب الحالة"
      allowClear
      style={{ width: 160, fontFamily: 'Cairo, sans-serif' }}
      value={statusFilter || undefined}
      onChange={(value) => {
        setStatusFilter(value || '');
        setPage(1);
      }}
      options={[
        { value: 'نشط', label: 'نشط' },
        { value: 'متوقف', label: 'متوقف' },
        { value: 'منتهي', label: 'منتهي' },
        { value: 'ملغي', label: 'ملغي' },
      ]}
    />
  );

  return (
    <>
      <DataTable
        title="العقود الشهرية"
        columns={columns}
        dataSource={contracts}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => {
          setPage(p);
          if (ps !== pageSize) {
            setPageSize(ps);
            setPage(1);
          }
        }}
        searchPlaceholder="بحث عن عقد..."
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        addPath="/contracts/new"
        editPath="/contracts/edit"
        detailPath="/contracts"
        onDelete={(record) => setDeleteTarget(record)}
        onRefresh={fetchContracts}
        filters={filterBar}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف العقد"
        message={`هل أنت متأكد من حذف العقد "${deleteTarget?.title}"؟`}
        description="سيتم حذف جميع أشهر العقد المرتبطة. لا يمكن التراجع عن هذا الإجراء."
        type="danger"
      />
    </>
  );
};

export default ContractList;