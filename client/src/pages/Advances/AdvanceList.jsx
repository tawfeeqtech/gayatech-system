import React, { useState, useEffect, useCallback } from 'react';
import { Space, Select, message, Tag, Button } from 'antd';
import DataTable from '../../components/ui/DataTable';
import advanceAPI from '../../api/advances';
import { formatCurrency } from '../../utils/formatters';

const AdvanceList = () => {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await advanceAPI.getAll({ page, limit: pageSize });
      setAdvances(response.data.data.advances);
      setTotal(response.data.total);
    } catch (error) { message.error('فشل في جلب السلف'); }
    finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await advanceAPI.approve(id);
      else if (action === 'reject') await advanceAPI.reject(id);
      message.success('تم بنجاح');
      fetchAdvances();
    } catch (e) { message.error('فشل'); }
  };

  const columns = [
    { title: 'الموظف', key: 'employee', width: 140, render: (_, r) => r.employee?.name || '—' },
    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 110, render: (v) => formatCurrency(v) },
    { title: 'المسدد', dataIndex: 'repaidAmount', key: 'repaid', width: 100 },
    { title: 'المتبقي', dataIndex: 'remainingAmount', key: 'rem', width: 100 },
    { title: 'التاريخ', dataIndex: 'requestDate', key: 'date', width: 110, render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 110,
      render: (s) => <Tag color={s === 'مسددة' ? 'green' : s === 'موافق عليها' ? 'blue' : s === 'مرفوضة' ? 'red' : 'orange'}>{s}</Tag>,
    },
    {
      title: 'إجراءات', key: 'actions', width: 140,
      render: (_, r) => r.status === 'معلقة' ? (
        <Space><Button size="small" type="primary" onClick={() => handleAction(r._id, 'approve')}>موافقة</Button>
        <Button size="small" danger onClick={() => handleAction(r._id, 'reject')}>رفض</Button></Space>
      ) : null,
    },
  ];

  return (
    <DataTable
      title="السلف" columns={columns} dataSource={advances}
      loading={loading} total={total} page={page} pageSize={pageSize}
      onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
      addPath="/advances/new" onRefresh={fetchAdvances} showActions={false}
    />
  );
};

export default AdvanceList;