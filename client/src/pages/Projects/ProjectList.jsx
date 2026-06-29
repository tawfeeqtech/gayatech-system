import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import projectAPI from '../../api/projects';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await projectAPI.getAll(params);
      setProjects(response.data.data.projects);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('فشل في جلب بيانات المشاريع');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await projectAPI.delete(deleteTarget._id);
      toast.success('تم حذف المشروع بنجاح');
      setDeleteTarget(null);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في حذف المشروع');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'المشروع', dataIndex: 'title', key: 'title', width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.serviceType}</div>
        </div>
      ),
    },
    {
      title: 'العميل', key: 'client', width: 150,
      render: (_, record) => record.client?.name || '—',
    },
    {
      title: 'القيمة', dataIndex: 'totalValue', key: 'value', width: 110,
      render: (v, r) => formatCurrency(v, r.currency),
    },
    {
      title: 'تاريخ التسليم', dataIndex: 'deliveryDate', key: 'delivery', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'التقدم', key: 'progress', width: 130,
      render: (_, record) => {
        const pct = record.computedStats?.progressPercentage || 0;
        return <Progress percent={pct} size="small" style={{ width: 100 }} />;
      },
    },
    {
      title: 'الدفع', key: 'payment', width: 100,
      render: (_, record) => {
        const stats = record.computedStats || {};
        const invoiced = stats.totalInvoiced || 0;
        const paid = stats.totalPaid || 0;
        
        if (invoiced === 0) return <Tag>—</Tag>;
        if (paid === 0) return <Tag color="orange">غير مدفوع</Tag>;
        if (paid >= invoiced) return <Tag color="green">مدفوع</Tag>;
        return <Tag color="blue">مدفوع جزئياً</Tag>;
      },
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => <StatusBadge status={s} mapping={statusColors.project} />,
    },
    {
      title: 'المهام', key: 'tasks', width: 80, align: 'center',
      render: (_, record) => `${record.computedStats?.completedTasks || 0}/${record.computedStats?.totalTasks || 0}`,
    },
  ];

  const filterBar = (
    <Select
      placeholder="فلترة حسب الحالة" allowClear
      style={{ width: 160, fontFamily: 'Cairo, sans-serif' }}
      value={statusFilter || undefined}
      onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
      options={[
        { value: 'قيد التخطيط', label: 'قيد التخطيط' },
        { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
        { value: 'تحت المراجعة', label: 'تحت المراجعة' },
        { value: 'مكتمل', label: 'مكتمل' },
        { value: 'تم التسليم', label: 'تم التسليم' },
      ]}
    />
  );

  return (
    <>
      <DataTable
        title="المشاريع" columns={columns} dataSource={projects}
        loading={loading} total={total} page={page} pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        searchPlaceholder="بحث عن مشروع..."
        onSearch={(v) => { setSearch(v); setPage(1); }}
        addPath="/projects/new" editPath="/projects/edit" detailPath="/projects"
        onDelete={(r) => setDeleteTarget(r)} onRefresh={fetchProjects}
        filters={filterBar}
        rowSelection={true}
        onBulkDelete={(ids) => projectAPI.bulkDelete(ids)}
        onBulkEdit={(ids, field, value) => projectAPI.bulkUpdate(ids, field, value)}
      />
      <ConfirmDialog
        open={!!deleteTarget} onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleteLoading}
        title="تأكيد حذف المشروع"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟`}
        description="سيتم حذف جميع المهام المرتبطة. لا يمكن التراجع."
        type="danger"
      />
    </>
  );
};

export default ProjectList;