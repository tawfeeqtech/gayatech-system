import React, { useState, useEffect, useCallback } from 'react';
import { Space, message, Tag, Select, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/ui/StatCard';
import subscriptionAPI from '../../api/subscriptions';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SubscriptionList = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await subscriptionAPI.getAll(params);
      const subs = res.data.data.subscriptions || [];
      
      // تحديث الحالة تلقائياً لكل اشتراك
      const updatedSubs = subs.map(sub => ({
        ...sub,
        status: calculateStatus(sub.endDate, sub.status),
      }));
      
      setSubscriptions(updatedSubs);
      setTotal(res.data.total);
    } catch (error) {
      message.error('فشل في جلب الاشتراكات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calculateStatus = (endDate, currentStatus) => {
    if (currentStatus === 'ملغي' || currentStatus === 'بانتظار التجديد') return currentStatus;
    if (!endDate) return 'نشط';
    
    const now = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'منتهي';
    if (diffDays <= 30) return 'قريب';
    return 'نشط';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subscriptionAPI.delete(deleteTarget._id);
      message.success('تم حذف الاشتراك');
      setDeleteTarget(null);
      fetchData();
    } catch {
      message.error('فشل في الحذف');
    }
  };

  const statusColors = {
    'نشط': 'green',
    'قريب': 'orange',
    'منتهي': 'red',
    'ملغي': 'default',
    'بانتظار التجديد': 'blue',
  };

  const columns = [
    { title: 'المزود', dataIndex: 'provider', key: 'provider', width: 120 },
    { title: 'الخدمة', dataIndex: 'serviceName', key: 'service', width: 150 },
    {
      title: 'التصنيف', dataIndex: 'category', key: 'category', width: 110,
      render: (c) => <Tag>{c}</Tag>,
    },
    {
      title: 'القيمة', dataIndex: 'amount', key: 'amount', width: 100,
      render: (v, r) => formatCurrency(v, r.currency),
    },
    { title: 'نوع التجديد', dataIndex: 'renewalType', key: 'renewal', width: 100 },
    {
      title: 'تاريخ الانتهاء', dataIndex: 'endDate', key: 'end', width: 120,
      render: (d) => {
        if (!d) return '—';
        const date = new Date(d);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        return (
          <span style={{ color: diffDays < 0 ? '#ef4444' : diffDays <= 30 ? '#f59e0b' : '#10b981' }}>
            {date.toLocaleDateString('ar-SA')}
            {diffDays > 0 && diffDays <= 30 && <ExclamationCircleOutlined style={{ color: '#f59e0b', marginLeft: 4 }} />}
          </span>
        );
      },
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 120,
      render: (s) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
  ];

  // إحصائيات
  const activeCount = subscriptions.filter(s => s.status === 'نشط').length;
  const expiringCount = subscriptions.filter(s => s.status === 'قريب').length;
  const expiredCount = subscriptions.filter(s => s.status === 'منتهي').length;

  const filterBar = (
    <Space wrap>
      <Select
        placeholder="التصنيف"
        allowClear
        style={{ width: 140 }}
        value={categoryFilter || undefined}
        onChange={(v) => { setCategoryFilter(v || ''); setPage(1); }}
        options={[
          { value: 'استضافة', label: 'استضافة' },
          { value: 'خدمات سحابية', label: 'خدمات سحابية' },
          { value: 'برمجيات', label: 'برمجيات' },
          { value: 'أدوات', label: 'أدوات' },
          { value: 'تسويق', label: 'تسويق' },
          { value: 'تعليم', label: 'تعليم' },
          { value: 'أمان', label: 'أمان' },
          { value: 'نطاقات', label: 'نطاقات' },
          { value: 'أخرى', label: 'أخرى' },
        ]}
      />
      <Select
        placeholder="الحالة"
        allowClear
        style={{ width: 140 }}
        value={statusFilter || undefined}
        onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
        options={[
          { value: 'نشط', label: '🟢 نشط' },
          { value: 'قريب', label: '🟡 قريب' },
          { value: 'منتهي', label: '🔴 منتهي' },
          { value: 'ملغي', label: '⚫ ملغي' },
        ]}
      />
    </Space>
  );

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>الاشتراكات</h2>

      {/* بطاقات إحصائية */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <StatCard title="النشطة" value={activeCount} color="#10b981" icon="✅" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="تنتهي قريباً" value={expiringCount} color="#f59e0b" icon="⚠️" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="منتهية" value={expiredCount} color="#ef4444" icon="❌" />
        </Col>
      </Row>

      <DataTable
        title=""
        columns={columns}
        dataSource={subscriptions}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        addPath="/subscriptions/new"
        editPath="/subscriptions/edit"
        onDelete={(r) => setDeleteTarget(r)}
        onRefresh={fetchData}
        filters={filterBar}
        showActions={true}
        detailPath={undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الاشتراك"
        message={`هل أنت متأكد من حذف "${deleteTarget?.serviceName}"؟`}
        type="danger"
      />
    </div>
  );
};

export default SubscriptionList;