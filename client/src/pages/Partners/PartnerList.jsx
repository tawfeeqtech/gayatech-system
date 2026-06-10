import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import partnerAPI from '../../api/partners';
import { formatCurrency } from '../../utils/formatters';

const PartnerList = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      const response = await partnerAPI.getAll(params);
      setPartners(response.data.data.partners);
      setTotal(response.data.total);
    } catch (error) { message.error('فشل في جلب الشركاء'); }
    finally { setLoading(false); }
  }, [page, pageSize, search]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await partnerAPI.delete(deleteTarget._id);
      message.success('تم حذف الشريك');
      setDeleteTarget(null);
      fetchPartners();
    } catch (e) { message.error(e.response?.data?.message || 'فشل'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    { title: 'الاسم', dataIndex: 'name', key: 'name', width: 160 },
    { title: 'النوع', dataIndex: 'partnerType', key: 'type', width: 120, render: (t) => <Tag>{t}</Tag> },
    { title: 'البريد', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: 'الرصيد', key: 'balance', width: 130,
      render: (_, r) => {
        const b = r.computedStats?.balance || 0;
        return <span style={{ color: b < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(Math.abs(b))} {b < 0 ? 'مستحق' : ''}</span>;
      },
    },
  ];

  return (
    <>
      <DataTable title="الشركاء" columns={columns} dataSource={partners}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن شريك..." onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/partners/new" detailPath="/partners" onDelete={(r) => setDeleteTarget(r)} onRefresh={fetchPartners} editPath={undefined}
      />
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="تأكيد حذف الشريك" message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`} type="danger" />
    </>
  );
};

export default PartnerList;