import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, message, Typography, Tag, Button, Space, Popconfirm, Tooltip, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined, WalletOutlined } from '@ant-design/icons';
import StatCard from '../../components/ui/StatCard';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import WalletForm from './WalletForm';

const { Title, Text } = Typography;

const AccountsOverview = () => {
  const [accounts, setAccounts] = useState([]);
  const [walletsMap, setWalletsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { currencies } = useCurrencies();

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
        <Space size="middle">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <WalletOutlined />
          </div>
          <div>
            <div className="font-medium text-slate-900">{text}</div>
            <div className="flex gap-2 mt-1">
              {record.isDefault && <Tag color="gold" className="rounded-md border-0 bg-amber-50 text-amber-600 m-0 px-1.5 text-[10px]">افتراضية</Tag>}
              {!record.isActive && <Tag color="default" className="rounded-md border-0 bg-slate-100 text-slate-500 m-0 px-1.5 text-[10px]">غير نشطة</Tag>}
            </div>
          </div>
        </Space>
      )
    },
    { 
      title: 'العملة',
      dataIndex: 'currency',
      key: 'currency',
      render: (c) => <Tag className="rounded-full px-3 border-slate-200 text-slate-600">{c}</Tag>
    },
    {
      title: 'الرصيد',
      dataIndex: 'balance',
      key: 'balance',
      render: (v, r) => (
        <span className={`font-bold text-base ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space>
          <Tooltip title="تعديل">
            <Button
              type="text"
              size="small"
              className="text-blue-600 hover:bg-blue-50 flex items-center justify-center"
              icon={<EditOutlined />}
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
                size="small"
                className="flex items-center justify-center"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && accounts.length === 0) return (
    <div className="flex justify-center items-center h-64">
      <Spin size="large" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3} className="!mb-1">الحسابات والمحافظ</Title>
          <Text type="secondary">إدارة الحسابات البنكية والمحافظ المالية والعملات المتعددة</Text>
        </div>
      </div>

      {/* أرصدة حسب العملة */}
      <Row gutter={[24, 24]}>
        {Object.entries(balanceByCurrency).map(([currency, balance]) => (
          <Col xs={24} sm={12} md={6} key={currency}>
            <StatCard 
              title={`إجمالي ${currency}`}
              value={balance} 
              prefix={currency}
              trend={{ value: 0, isUp: true }} // placeholder
              icon={<BankOutlined className="text-xl" />}
              variant="primary"
            />
          </Col>
        ))}
        <Col xs={24} sm={12} md={6}>
          <StatCard title="إجمالي الحسابات" value={accounts.length} icon="🏦" variant="secondary" />
        </Col>
      </Row>

      {/* تفاصيل كل حساب */}
      <div className="grid grid-cols-1 gap-6">
        {accounts.map(acc => {
          const wallets = walletsMap[acc._id] || [];

          const byCurrency = {};
          wallets.forEach(w => {
            if (!byCurrency[w.currency]) byCurrency[w.currency] = 0;
            byCurrency[w.currency] += (w.balance || 0);
          });

          return (
            <Card
              key={acc._id}
              className="border-0 shadow-sm overflow-hidden"
              bodyStyle={{ padding: 0 }}
              title={
                <div className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <BankOutlined className="text-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{acc.name}</span>
                      <Tag className="rounded-md border-0 bg-slate-100 text-slate-600 text-[11px] m-0">{acc.accountType}</Tag>
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {Object.entries(byCurrency).map(([cur, bal]) => (
                        <span key={cur} className="text-xs text-slate-500">
                          {cur}: <span className={bal >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{formatCurrency(bal, cur)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              }
              extra={
                <Button
                  type="primary"
                  className="rounded-lg h-9"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddWallet(acc._id)}
                >
                  إضافة محفظة
                </Button>
              }
            >
              <Table
                columns={walletColumns}
                dataSource={wallets}
                rowKey="_id"
                pagination={false}
                locale={{ emptyText: 'لا توجد محافظ' }}
                size="middle"
                className="modern-table"
              />
            </Card>
          );
        })}
      </div>

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
