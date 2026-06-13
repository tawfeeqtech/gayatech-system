import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, message, Typography, Tag } from 'antd';
import StatCard from '../../components/ui/StatCard';
import accountAPI from '../../api/accounts';
import api from '../../api/axios';

const { Title } = Typography;

const CURRENCY_SYMBOLS = { USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' };

const formatCurrency = (amount, currency = 'USD') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '';
  try {
    return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch { return `${symbol}${amount}`; }
};

const AccountsOverview = () => {
  const [accounts, setAccounts] = useState([]);
  const [walletsMap, setWalletsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await accountAPI.getAll();
      const accountsData = res.data.data.accounts || [];
      setAccounts(accountsData);

      const walletsData = {};
      for (const acc of accountsData) {
        try {
          const wRes = await api.get(`/accounts/${acc._id}/wallets`);
          walletsData[acc._id] = wRes.data.data.wallets || [];
        } catch { walletsData[acc._id] = []; }
      }
      setWalletsMap(walletsData);
    } catch { message.error('فشل في جلب الحسابات'); }
    finally { setLoading(false); }
  };

  // تجميع الأرصدة حسب العملة
  const balanceByCurrency = {};
  Object.values(walletsMap).forEach(wallets => {
    wallets.forEach(w => {
      if (!balanceByCurrency[w.currency]) balanceByCurrency[w.currency] = 0;
      balanceByCurrency[w.currency] += (w.balance || 0);
    });
  });

  const walletColumns = [
    { title: 'المحفظة', dataIndex: 'name', key: 'name' },
    { title: 'العملة', dataIndex: 'currency', key: 'currency', render: (c) => <Tag color="blue">{c}</Tag> },
    { 
      title: 'الرصيد', dataIndex: 'balance', key: 'balance',
      render: (v, r) => (
        <span style={{ color: v >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
          {formatCurrency(v, r.currency)}
        </span>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <Title level={4} style={{ marginBottom: 16 }}>الحسابات والمحافظ</Title>

      {/* أرصدة حسب العملة */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Object.entries(balanceByCurrency).map(([currency, balance]) => (
          <Col xs={24} sm={12} md={6} key={currency}>
            <StatCard 
              title={`رصيد ${currency}`} 
              value={balance} 
              prefix={CURRENCY_SYMBOLS[currency]} 
              color="#3b82f6" 
              icon="💰" 
            />
          </Col>
        ))}
        <Col xs={24} sm={12} md={6}>
          <StatCard title="عدد الحسابات" value={accounts.length} color="#8b5cf6" icon="🏦" />
        </Col>
      </Row>

      {/* تفاصيل كل حساب */}
      {accounts.map(acc => {
        const wallets = walletsMap[acc._id] || [];
        
        // مجموع المحافظ لكل عملة
        const byCurrency = {};
        wallets.forEach(w => {
          if (!byCurrency[w.currency]) byCurrency[w.currency] = 0;
          byCurrency[w.currency] += (w.balance || 0);
        });
        
        return (
          <Card 
            key={acc._id}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span>{acc.name} <Tag>{acc.accountType}</Tag></span>
                <span style={{ fontSize: 13 }}>
                  {Object.entries(byCurrency).map(([cur, bal]) => (
                    <Tag key={cur} color={bal >= 0 ? 'green' : 'red'} style={{ margin: '0 4px' }}>
                      {cur}: {formatCurrency(bal, cur)}
                    </Tag>
                  ))}
                </span>
              </div>
            }
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            <Table columns={walletColumns} dataSource={wallets} rowKey="_id" pagination={false}
              locale={{ emptyText: 'لا توجد محافظ' }} size="small" />
          </Card>
        );
      })}
    </div>
  );
};

export default AccountsOverview;