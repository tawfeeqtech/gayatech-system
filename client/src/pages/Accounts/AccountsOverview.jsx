import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, message, Typography } from 'antd';
import StatCard from '../../components/ui/StatCard';
import accountAPI from '../../api/accounts';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const AccountsOverview = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountAPI.getAll()
      .then(r => setAccounts(r.data.data.accounts || []))
      .catch(() => message.error('فشل في جلب الحسابات'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const columns = [
    { title: 'الحساب', dataIndex: 'name', key: 'name' },
    { title: 'النوع', dataIndex: 'accountType', key: 'type' },
    { title: 'العملة', dataIndex: 'currency', key: 'currency' },
    { title: 'الوارد', key: 'in', render: (_, r) => <span style={{ color: '#10b981' }}>{formatCurrency(r.totalIncoming || 0)}</span> },
    { title: 'الصادر', key: 'out', render: (_, r) => <span style={{ color: '#ef4444' }}>{formatCurrency(r.totalOutgoing || 0)}</span> },
    { title: 'الرصيد', key: 'balance', render: (_, r) => {
      const balance = (r.totalIncoming || 0) - (r.totalOutgoing || 0);
      return <span style={{ color: balance >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 16 }}>{formatCurrency(balance)}</span>;
    }},
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <Title level={4} style={{ marginBottom: 24 }}>الحسابات والمحافظ</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {accounts.map(acc => {
          const balance = (acc.totalIncoming || 0) - (acc.totalOutgoing || 0);
          return (
            <Col xs={24} sm={12} md={8} key={acc._id}>
              <StatCard
                title={acc.name}
                value={balance}
                prefix="$"
                color={balance >= 0 ? '#10b981' : '#ef4444'}
                icon={acc.accountType === 'بنك' ? '🏦' : acc.accountType === 'وسيط' ? '🔄' : '💵'}
              />
            </Col>
          );
        })}
      </Row>

      <Card title="تفاصيل الحسابات" style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={accounts} rowKey="_id" pagination={false} />
      </Card>
    </div>
  );
};

export default AccountsOverview;