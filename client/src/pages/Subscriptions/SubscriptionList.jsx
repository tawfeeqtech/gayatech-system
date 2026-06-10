import React, { useState, useEffect, useCallback } from 'react';
import { Space, message, Tag } from 'antd';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import subscriptionAPI from '../../api/subscriptions';
import { formatCurrency } from '../../utils/formatters';

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionAPI.getAll({ page, limit: pageSize });
      setSubscriptions(res.data.data.subscriptions);
      setTotal(res.data.total);
    } catch (error) { message.error('فشل في جلب الاشتراكات'); }
    finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await subscriptionAPI.delete(deleteTarget._id); message.success('تم الحذف'); setDeleteTarget(null); fetchData(); }
    catch { message.error('فشل'); }
  };

  const columns = [
    { title: 'المزود', dataIndex: 'provider', key: 'provider' },
    { title: 'الخدمة', dataIndex: 'serviceName', key: 'service' },
    { title: 'التصنيف', dataIndex: 'category', key: 'cat', render: (c) => <Tag>{c}</Tag> },
    { title: 'القيمة', dataIndex: 'amount', key: 'amount', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'تاريخ الانتهاء', dataIndex: 'endDate', key: 'end', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'نشط' ? 'green' : s === 'منتهي' ? 'red' : 'orange'}>{s}</Tag>,
    },
  ];

  return (
    <>
      <DataTable title="الاشتراكات" columns={columns} dataSource={subscriptions}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/subscriptions/new" onDelete={(r) => setDeleteTarget(r)} onRefresh={fetchData} showActions={true} editPath={undefined} detailPath={undefined}
      />
      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="تأكيد حذف الاشتراك" message={`هل أنت متأكد من حذف "${deleteTarget?.serviceName}"؟`} type="danger" />
    </>
  );
};

export default SubscriptionList;