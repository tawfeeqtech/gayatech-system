import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Descriptions, Tag, Button, Spin, Table, message } from 'antd';
import {
  ArrowRightOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import clientAPI from '../../api/clients';

const ClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const [clientRes, statsRes, contractsRes, projectsRes, txRes] = await Promise.all([
        clientAPI.getById(id),
        clientAPI.getStats(id),
        clientAPI.getContracts(id).catch(() => ({ data: { data: { contracts: [] } } })),
        clientAPI.getProjects(id).catch(() => ({ data: { data: { projects: [] } } })),
        clientAPI.getTransactions(id, { limit: 20 }).catch(() => ({ data: { data: { transactions: [] } } })),
      ]);
      setClient({
        ...clientRes.data.data.client,
        stats: statsRes.data.data.stats,
      });
      setContracts(contractsRes.data?.data?.contracts || []);
      setProjects(projectsRes.data?.data?.projects || []);
      setTransactions(txRes.data?.data?.transactions || []);
    } catch (error) {
      message.error('فشل في جلب بيانات العميل');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) return null;

  const stats = client.stats || client.computedStats || {};

  // أعمدة العقود
  const contractColumns = [
    { title: 'العقد', dataIndex: 'title', key: 'title' },
    { title: 'الخدمة', dataIndex: 'serviceType', key: 'serviceType' },
    {
      title: 'القيمة الشهرية',
      dataIndex: 'defaultMonthlyValue',
      key: 'value',
      render: (v) => `${v} $`,
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <StatusBadge status={s} mapping={statusColors.contract} />,
    },
  ];

  // أعمدة المشاريع
  const projectColumns = [
    { title: 'المشروع', dataIndex: 'title', key: 'title' },
    { title: 'الخدمة', dataIndex: 'serviceType', key: 'serviceType' },
    {
      title: 'القيمة',
      dataIndex: 'totalValue',
      key: 'value',
      render: (v) => `${v} $`,
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <StatusBadge status={s} mapping={statusColors.project} />,
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* رأس الصفحة */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/clients')}
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            العودة للقائمة
          </Button>
          <div>
            <h2 style={{ margin: 0 }}>{client.name}</h2>
            {client.company && (
              <span style={{ color: '#64748b' }}>{client.company}</span>
            )}
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/clients/edit/${id}`)}
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          تعديل العميل
        </Button>
      </div>

      {/* بطاقات المؤشرات */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12}>
          <StatCard title="العقود النشطة" value={stats.activeContracts || 0} color="#3b82f6" icon="📋" />
        </Col>
        <Col xs={24} sm={12} md={12}>
          <StatCard title="المشاريع النشطة" value={stats.activeProjects || 0} color="#8b5cf6" icon="🚀" />
        </Col>
        {stats.details && Object.entries(stats.details).map(([currency, data]) => (
          <Col xs={24} sm={12} md={6} key={currency}>
            <StatCard 
              title={`الفواتير (${currency})`} 
              value={data.invoiced || 0} 
              prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[currency] || currency}
              color="#f59e0b" 
            />
          </Col>
        ))}
        
        {stats.balances && Object.entries(stats.balances).map(([currency, balance]) => (
          <Col xs={24} sm={12} md={6} key={`bal-${currency}`}>
            <StatCard
              title={`الرصيد (${currency})`}
              value={balance || 0}
              prefix={{ USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' }[currency] || currency}
              color={balance > 0 ? '#10b981' : '#ef4444'}
            />
          </Col>
        ))}
      </Row>

      {/* معلومات العميل */}
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات العميل" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="النوع">
            <Tag>{client.clientType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="الحالة">
            <StatusBadge status={client.status} mapping={statusColors.client} />
          </Descriptions.Item>
          <Descriptions.Item label="العملة المفضلة">{client.preferredCurrency}</Descriptions.Item>
          <Descriptions.Item label="البريد">
            {client.email ? <><MailOutlined /> {client.email}</> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="الهاتف">
            {client.phone ? <><PhoneOutlined /> {client.phone}</> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="المدينة">
            {client.address?.city ? <><EnvironmentOutlined /> {client.address.city}</> : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* التبويبات */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs
          defaultActiveKey="contracts"
          items={[
            {
              key: 'contracts',
              label: `العقود (${contracts.length})`,
              children: (
                <Table
                  columns={contractColumns}
                  dataSource={contracts}
                  rowKey="_id"
                  locale={{ emptyText: 'لا توجد عقود مرتبطة' }}
                  pagination={false}
                />
              ),
            },
            {
              key: 'projects',
              label: `المشاريع (${projects.length})`,
              children: (
                <Table
                  columns={projectColumns}
                  dataSource={projects}
                  rowKey="_id"
                  locale={{ emptyText: 'لا توجد مشاريع مرتبطة' }}
                  pagination={false}
                />
              ),
            },
            {
              key: 'transactions',
              label: 'المعاملات المالية',
              children: (
                <Table
                  columns={[
                    { title: 'التاريخ', dataIndex: 'transactionDate', key: 'date', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
                    { title: 'النوع', dataIndex: 'type', key: 'type' },
                    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v, r) => formatCurrency(v, r.currency) },
                    { title: 'الوصف', dataIndex: 'description', key: 'desc' },
                  ]}
                  dataSource={transactions}
                  rowKey="_id"
                  locale={{ emptyText: 'لا توجد معاملات' }}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ClientDetail;