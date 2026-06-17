import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, message, Typography, Tag, Button, Space, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatCard from '../../components/ui/StatCard';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import { formatCurrency } from '../../utils/formatters';
import WalletForm from './WalletForm';

const { Title } = Typography;

const AccountsOverview = () => {
  const [accounts, setAccounts] = useState([]);
  const [walletsMap, setWalletsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // State for Wallet Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await accountAPI.getAll();
      const accountsData = res.data.data.accounts || [];
      setAccounts(accountsData);

      const walletsData = {};
      await Promise.all(accountsData.map(async (acc) => {
        try {
          const wRes = await walletAPI.getByAccount(acc._id);
          walletsData[acc._id] = wRes.data.data.wallets || [];
        } catch { walletsData[acc._id] = []; }
      }));
      setWalletsMap(walletsData);
    } catch { message.error('فشل في جلب الحسابات'); }
    finally { setLoading(false); }
  };

  const handleAddWallet = (accountId) => {
    setCurrentAccountId(accountId);
    setEditingWallet(null);
    setModalVisible(true);
  };

  const handleEditWallet = (accountId, wallet) => {
    setCurrentAccountId(accountId);
    setEditingWallet(wallet);
    setModalVisible(true);
  };

  const handleDeleteWallet = async (accountId, walletId) => {
    try {
      await walletAPI.remove(accountId, walletId);
      message.success('تم حذف المحفظة بنجاح');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حذف المحفظة');
    }
  };

  const handleModalSuccess = async (values) => {
    try {
      if (editingWallet) {
        await walletAPI.update(currentAccountId, editingWallet._id, values);
        message.success('تم تحديث المحفظة بنجاح');
      } else {
        await walletAPI.create(currentAccountId, values);
        message.success('تم إضافة المحفظة بنجاح');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حفظ المحفظة');
    }
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
    {
      title: 'المحفظة',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.isDefault && <Tag color="gold">افتراضية</Tag>}
          {!record.isActive && <Tag color="default">غير نشطة</Tag>}
        </Space>
      )
    },
    { title: 'العملة', dataIndex: 'currency', key: 'currency', render: (c) => <Tag color="blue">{c}</Tag> },
    { 
      title: 'الرصيد', dataIndex: 'balance', key: 'balance',
      render: (v, r) => (
        <span style={{ color: v >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
          {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#3b82f6' }} />}
              onClick={() => handleEditWallet(record.account, record)}
            />
          </Tooltip>
          <Popconfirm
            title="هل أنت متأكد من حذف هذه المحفظة؟"
            onConfirm={() => handleDeleteWallet(record.account, record._id)}
            okText="نعم"
            cancelText="لا"
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && accounts.length === 0) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

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
              prefix={currency}
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
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddWallet(acc._id)}
              >
                إضافة محفظة
              </Button>
            }
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            <Table
              columns={walletColumns}
              dataSource={wallets}
              rowKey="_id"
              pagination={false}
              locale={{ emptyText: 'لا توجد محافظ' }}
              size="small"
              loading={loading && wallets.length === 0}
            />
          </Card>
        );
      })}

      <WalletForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        initialValues={editingWallet}
        accountId={currentAccountId}
      />
    </div>
  );
};

export default AccountsOverview;
