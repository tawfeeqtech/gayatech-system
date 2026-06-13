import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Space, Select, message } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import clientAPI from '../../api/clients';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // جلب البيانات
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await clientAPI.getAll(params);
      setClients(response.data.data.clients);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب بيانات العملاء');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // حذف عميل
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await clientAPI.delete(deleteTarget._id);
      message.success('تم حذف العميل بنجاح');
      setDeleteTarget(null);
      fetchClients();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حذف العميل');
    } finally {
      setDeleteLoading(false);
    }
  };

  // تصدير
  const handleExport = () => {
    message.info('سيتم تصدير البيانات قريباً');
  };

  // تعريف الأعمدة
  const columns = [
    {
      title: 'الاسم',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            {text?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>
              {text}
            </div>
            {record.company && (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {record.company}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'النوع',
      dataIndex: 'clientType',
      key: 'clientType',
      width: 100,
      render: (text) => text || '—',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <StatusBadge status={status} mapping={statusColors.client} />
      ),
    },
    {
      title: 'العقود',
      key: 'contracts',
      width: 80,
      align: 'center',
      render: (_, record) => record.computedStats?.activeContracts || 0,
    },
    {
      title: 'المشاريع',
      key: 'projects',
      width: 80,
      align: 'center',
      render: (_, record) => record.computedStats?.activeProjects || 0,
    },
    {
      title: 'الرصيد',
      key: 'balance',
      width: 200,
      render: (_, record) => {
        const balances = record.computedStats?.balances || {};
        const currencies = Object.keys(balances);
        
        if (currencies.length === 0) {
          return <span style={{ color: '#94a3b8' }}>—</span>;
        }
        
        return (
          <Space wrap size={[4, 2]}>
            {currencies.map(currency => {
              const balance = balances[currency] || 0;
              const symbols = { USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' };
              const symbol = symbols[currency] || currency;
              const color = balance > 0 ? '#10b981' : balance < 0 ? '#ef4444' : '#94a3b8';
              
              return (
                <span key={currency} style={{ color, fontWeight: 600, fontSize: 13 }}>
                  {balance > 0 ? '+' : ''}{balance.toFixed(2)} {symbol}
                </span>
              );
            })}
          </Space>
        );
      },
    },
  ];

  // أزرار الفلترة
  const filterBar = (
    <Select
      placeholder="فلترة حسب الحالة"
      allowClear
      style={{ width: 180, fontFamily: 'Cairo, sans-serif' }}
      value={statusFilter || undefined}
      onChange={(value) => {
        setStatusFilter(value || '');
        setPage(1);
      }}
      options={[
        { value: 'نشط', label: 'نشط' },
        { value: 'غير نشط', label: 'غير نشط' },
        { value: 'متوقف مؤقتاً', label: 'متوقف مؤقتاً' },
        { value: 'محظور', label: 'محظور' },
      ]}
    />
  );

  return (
    <>
      <DataTable
        title="العملاء"
        columns={columns}
        dataSource={clients}
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
        searchPlaceholder="بحث عن عميل..."
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        addPath="/clients/new"
        editPath="/clients/edit"
        detailPath="/clients"
        onDelete={(record) => setDeleteTarget(record)}
        onExport={handleExport}
        onRefresh={fetchClients}
        filters={filterBar}
      />

      {/* تأكيد الحذف */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="تأكيد حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${deleteTarget?.name}"؟`}
        description={
          deleteTarget?.computedStats?.activeContracts > 0 ||
          deleteTarget?.computedStats?.activeProjects > 0
            ? 'تنبيه: هذا العميل لديه عقود أو مشاريع نشطة. لن تتمكن من حذفه حتى تنتهي.'
            : 'لا يمكن التراجع عن هذا الإجراء.'
        }
        type="danger"
      />
    </>
  );
};

export default ClientList;