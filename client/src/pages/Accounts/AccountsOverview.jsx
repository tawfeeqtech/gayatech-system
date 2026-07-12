import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, message, Typography, Tag, Button, Space, Popconfirm, Tooltip, Select, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined } from '@ant-design/icons';
import StatCard from '../../components/ui/StatCard';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';
import { ACCOUNT_TYPES } from '../../utils/constants';
import WalletForm from './WalletForm';

const { Title } = Typography;

const AccountsOverview = () => {
  const [accounts, setAccounts] = useState([]);
  const [walletsMap, setWalletsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { currencies } = useCurrencies();

  // Wallet Modal state
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState(null);

  // Account Modal state
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm] = Form.useForm();
  const [accountSaving, setAccountSaving] = useState(false);

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

  // ===== Wallet handlers =====
  const handleAddWallet = (accountId) => {
    setCurrentAccountId(accountId);
    setEditingWallet(null);
    setWalletModalVisible(true);
  };

  const handleEditWallet = (accountId, wallet) => {
    setCurrentAccountId(accountId);
    setEditingWallet(wallet);
    setWalletModalVisible(true);
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

  const handleWalletModalSuccess = async (values) => {
    try {
      if (editingWallet) {
        await walletAPI.update(currentAccountId, editingWallet._id, values);
        message.success('تم تحديث المحفظة بنجاح');
      } else {
        await walletAPI.create(currentAccountId, values);
        message.success('تم إضافة المحفظة بنجاح');
      }
      setWalletModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حفظ المحفظة');
    }
  };

  // ===== Account handlers =====
  const handleAddAccount = () => {
    setEditingAccount(null);
    accountForm.resetFields();
    accountForm.setFieldsValue({ accountType: 'بنك', currency: 'JOD', isActive: true });
    setAccountModalVisible(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    accountForm.setFieldsValue({
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      iban: account.iban,
      description: account.description,
      notes: account.notes,
      isActive: account.isActive,
    });
    setAccountModalVisible(true);
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      await accountAPI.delete(accountId);
      message.success('تم حذف الحساب بنجاح');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'فشل في حذف الحساب');
    }
  };

  const handleAccountSubmit = async () => {
    try {
      const values = await accountForm.validateFields();
      setAccountSaving(true);
      if (editingAccount) {
        await accountAPI.update(editingAccount._id, values);
        message.success('تم تحديث الحساب بنجاح');
      } else {
        await accountAPI.create(values);
        message.success('تم إضافة الحساب بنجاح');
      }
      setAccountModalVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return; // validation error
      message.error(error.response?.data?.message || 'فشل في حفظ الحساب');
    } finally {
      setAccountSaving(false);
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
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading && accounts.length === 0) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>الحسابات والمحافظ</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAccount}>
          إضافة حساب جديد
        </Button>
      </div>

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
                <span>
                  {acc.name} <Tag>{acc.accountType}</Tag>
                  {!acc.isActive && <Tag color="default">غير نشط</Tag>}
                </span>
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
              <Space>
                <Tooltip title="تعديل الحساب">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditAccount(acc)}
                  >
                    تعديل
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="هل أنت متأكد من حذف هذا الحساب؟"
                  description="لا يمكن حذف حساب يحتوي على محافظ. احذف المحافظ أولاً."
                  onConfirm={() => handleDeleteAccount(acc._id)}
                  okText="نعم"
                  cancelText="لا"
                >
                  <Tooltip title="حذف الحساب">
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      حذف
                    </Button>
                  </Tooltip>
                </Popconfirm>
                <Select
                  placeholder="اختر المحفظة"
                  style={{ width: 200 }}
                  options={wallets.map(w => ({
                    value: w._id,
                    label: `${w.name} (${formatCurrency(w.balance, w.currency)})`
                  }))}
                  onChange={(val) => {
                    const wallet = wallets.find(w => w._id === val);
                    if (wallet) handleEditWallet(acc._id, wallet);
                  }}
                  value={undefined}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddWallet(acc._id)}
                >
                  إضافة محفظة
                </Button>
              </Space>
            }
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            {/* معلومات الحساب */}
            <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap', color: '#6b7280', fontSize: 13 }}>
              {acc.bankName && <span>🏦 {acc.bankName}</span>}
              {acc.accountNumber && <span>🔢 {acc.accountNumber}</span>}
              {acc.iban && <span>📋 {acc.iban}</span>}
              {acc.description && <span>📝 {acc.description}</span>}
            </div>

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

      {accounts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <BankOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
          لا توجد حسابات. اضغط على "إضافة حساب جديد" للبدء.
        </div>
      )}

      {/* Wallet Modal */}
      <WalletForm
        visible={walletModalVisible}
        onCancel={() => setWalletModalVisible(false)}
        onSuccess={handleWalletModalSuccess}
        initialValues={editingWallet}
        accountId={currentAccountId}
      />

      {/* Account Modal */}
      <Modal
        title={editingAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}
        open={accountModalVisible}
        onCancel={() => setAccountModalVisible(false)}
        onOk={handleAccountSubmit}
        okText={editingAccount ? 'تحديث' : 'إضافة'}
        cancelText="إلغاء"
        confirmLoading={accountSaving}
        destroyOnClose
      >
        <Form form={accountForm} layout="vertical">
          <Form.Item
            name="name"
            label="اسم الحساب"
            rules={[{ required: true, message: 'يرجى إدخال اسم الحساب' }]}
          >
            <Input placeholder="مثال: حساب الشركة، صندوق ريم" />
          </Form.Item>

          <Form.Item
            name="accountType"
            label="نوع الحساب"
            rules={[{ required: true, message: 'يرجى اختيار نوع الحساب' }]}
          >
            <Select options={ACCOUNT_TYPES} placeholder="اختر نوع الحساب" />
          </Form.Item>

          <Form.Item
            name="currency"
            label="العملة الافتراضية"
            rules={[{ required: true, message: 'يرجى اختيار العملة' }]}
          >
            <Select options={currencies} placeholder="اختر العملة" />
          </Form.Item>

          <Form.Item name="bankName" label="اسم البنك">
            <Input placeholder="مثال: البنك العربي" />
          </Form.Item>

          <Form.Item name="accountNumber" label="رقم الحساب">
            <Input placeholder="رقم الحساب البنكي" />
          </Form.Item>

          <Form.Item name="iban" label="IBAN">
            <Input placeholder="رقم IBAN" />
          </Form.Item>

          <Form.Item name="description" label="وصف">
            <Input.TextArea rows={2} placeholder="وصف مختصر للحساب" />
          </Form.Item>

          <Form.Item name="notes" label="ملاحظات">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountsOverview;
