import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Descriptions, Button, Spin, Table, Tag, Space, message } from 'antd';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import contractAPI from '../../api/contracts';
import contractMonthAPI from '../../api/contractMonths';
import { formatCurrency, formatMonth } from '../../utils/formatters';

const ContractDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractRes, monthsRes] = await Promise.all([
        contractAPI.getById(id),
        contractAPI.getMonths(id),
      ]);
      setContract(contractRes.data.data.contract);
      setMonths(monthsRes.data.data.months || []);
    } catch (error) {
      message.error('فشل في جلب بيانات العقد');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMonth = async (monthId) => {
    try {
      await contractMonthAPI.confirm(monthId);
      message.success('تم تأكيد الفاتورة');
      fetchData();
    } catch (error) {
      message.error('فشل في تأكيد الفاتورة');
    }
  };

  const handleDeleteMonth = async () => {
    if (!deleteTarget) return;
    try {
      await contractMonthAPI.delete(deleteTarget);
      message.success('تم حذف الشهر');
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في الحذف');
    }
  };

  const monthColumns = [
    { title: 'الشهر', dataIndex: 'month', key: 'month', render: (m) => formatMonth(m) },
    { title: 'القيمة', dataIndex: 'value', key: 'value', render: (v, r) => formatCurrency(v, r.currency) },
    { title: 'المدفوع', dataIndex: 'paidAmount', key: 'paidAmount', render: (v, r) => formatCurrency(v, r.currency) },
    {
      title: 'المتبقي', key: 'remaining', render: (_, r) => (
        <span style={{ color: r.remainingAmount > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
          {formatCurrency(r.remainingAmount, r.currency)}
        </span>
      ),
    },
    { title: 'الاستحقاق', dataIndex: 'dueDate', key: 'dueDate', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status',
      render: (s) => <StatusBadge status={s} mapping={statusColors.monthStatus} />,
    },
    {
      title: 'إجراءات', key: 'actions', width: 140,
      render: (_, record) => (
        <Space size="small">
          {(record.status === 'pending_review' || record.status === 'confirmed') && (
            <Button size="small" type="primary" onClick={() => handleConfirmMonth(record._id)}>تأكيد</Button>
          )}
          <Button size="small" danger onClick={() => setDeleteTarget(record._id)}>حذف</Button>
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!contract) return null;

  const stats = contract.computedStats || {};

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/contracts')}>العودة</Button>
          <div>
            <h2 style={{ margin: 0 }}>{contract.title}</h2>
            <Tag color="blue">{contract.contractNumber}</Tag>
          </div>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/contracts/edit/${id}`)}>تعديل</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><StatCard title="إجمالي الأشهر" value={stats.totalMonths || 0} color="#3b82f6" icon="📅" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="الأشهر المدفوعة" value={stats.paidMonths || 0} color="#10b981" icon="✅" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="إجمالي القيمة" value={stats.totalValue || 0} prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[contract.currency] || contract.currency} color="#f59e0b" /></Col>
        <Col xs={24} sm={12} md={6}><StatCard title="المتبقي" value={stats.totalRemaining || 0} prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[contract.currency] || contract.currency} color="#ef4444" /></Col>
      </Row>

      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات العقد" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="العميل">{contract.client?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="نوع الخدمة">{contract.serviceType}</Descriptions.Item>
          <Descriptions.Item label="الحالة"><StatusBadge status={contract.status} mapping={statusColors.contract} /></Descriptions.Item>
          <Descriptions.Item label="القيمة الشهرية">{formatCurrency(contract.defaultMonthlyValue, contract.currency)}</Descriptions.Item>
          <Descriptions.Item label="تاريخ البداية">{contract.startDate ? new Date(contract.startDate).toLocaleDateString('ar-SA') : '—'}</Descriptions.Item>
          <Descriptions.Item label="تاريخ النهاية">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('ar-SA') : 'مفتوح'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="أشهر العقد (الفواتير الشهرية)" style={{ borderRadius: 8 }}>
        <Table columns={monthColumns} dataSource={months} rowKey="_id" locale={{ emptyText: 'لا توجد فواتير' }} />
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMonth}
        title="تأكيد حذف الشهر"
        message="هل أنت متأكد من حذف هذا الشهر؟"
        type="danger"
      />
    </div>
  );
};

export default ContractDetail;