import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Spin, Typography, Row, Col, Tag } from 'antd';
import { WalletOutlined, BankOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import accountAPI from '../../api/accounts';
import { formatCurrency } from '../../utils/formatters';

const { Text } = Typography;

/**
 * WalletSelector - مكون موحد لاختيار حساب + محفظة مع عرض الرصيد
 *
 * @param {object} form - كائن الـ Form من Ant Design
 * @param {string} walletField - اسم حقل المحفظة في الفورم (افتراضي 'wallet')
 * @param {string} accountField - اسم حقل الحساب في الفورم (افتراضي 'account')
 * @param {string} direction - 'from' أو 'to' (لتوليد أسماء الحقول تلقائياً)
 * @param {string} labelFrom - تسمية "من حساب" (افتراضي 'من حساب')
 * @param {string} labelTo - تسمية "إلى حساب" (افتراضي 'إلى حساب')
 * @param {boolean} requiredFrom - هل حقل من حساب إلزامي
 * @param {boolean} requiredTo - هل حقل إلى حساب إلزامي
 * @param {function} onWalletChange - callback عند تغيير المحفظة
 * @param {function} onAccountChange - callback عند تغيير الحساب
 * @param {boolean} showBalance - عرض الرصيد في خيارات المحفظة (افتراضي true)
 */
const WalletSelector = ({
  form,
  direction = 'from',
  walletField = `${direction}Wallet`,
  accountField = `${direction}Account`,
  label = direction === 'from' ? 'من حساب' : 'إلى حساب',
  placeholder = direction === 'from' ? 'اختر الحساب' : 'اختر الحساب',
  walletPlaceholder,
  required = true,
  onWalletChange,
  onAccountChange,
  showBalance = true,
  colAccount = 12,
  colWallet = 12,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    accountAPI.getAll()
      .then(r => { if (mountedRef.current) setAccounts(r.data.data.accounts || []); })
      .catch(() => {});
    return () => { mountedRef.current = false; };
  }, []);

  const handleAccountChange = async (accountId) => {
    form?.setFieldsValue({ [walletField]: undefined });
    if (onAccountChange) onAccountChange(accountId);

    if (!accountId) { setWallets([]); return; }

    setLoadingWallets(true);
    try {
      const res = await api.get(`/accounts/${accountId}/wallets`);
      if (mountedRef.current) setWallets(res.data.data.wallets || []);
    } catch {
      if (mountedRef.current) setWallets([]);
    } finally {
      if (mountedRef.current) setLoadingWallets(false);
    }
  };

  const handleWalletChange = (walletId) => {
    if (onWalletChange) onWalletChange(walletId);
    const wallet = wallets.find(w => w._id === walletId);
    if (wallet && form) {
      form.setFieldsValue({ [`${direction}Currency`]: wallet.currency });
    }
  };

  // خيارات المحفظة مع عرض الرصيد
  const walletOptions = wallets.map(w => ({
    value: w._id,
    label: showBalance
      ? `${w.name} | ${formatCurrency(w.balance || 0, w.currency)}`
      : w.name,
    currency: w.currency,
    balance: w.balance || 0,
  }));

  const wp = walletPlaceholder || (direction === 'from' ? 'اختر المحفظة' : 'اختر المحفظة');

  return (
    <Row gutter={16}>
      <Col xs={24} md={colAccount}>
        <Form.Item
          name={accountField}
          label={<><BankOutlined style={{ marginLeft: 4 }} />{label}</>}
          rules={required ? [{ required: true, message: 'مطلوب' }] : []}
        >
          <Select
            showSearch
            placeholder={placeholder}
            onChange={handleAccountChange}
            optionFilterProp="label"
            options={accounts.map(a => ({
              value: a._id,
              label: a.name,
            }))}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={colWallet}>
        <Form.Item
          name={walletField}
          label={<><WalletOutlined style={{ marginLeft: 4 }} />محفظة</>}
          rules={required ? [{ required: true, message: 'اختر المحفظة' }] : []}
        >
          <Select
            showSearch
            placeholder={loadingWallets ? 'جاري التحميل...' : wp}
            loading={loadingWallets}
            disabled={wallets.length === 0}
            onChange={handleWalletChange}
            optionFilterProp="label"
            notFoundContent={loadingWallets ? <Spin size="small" /> : 'لا توجد محافظ متاحة'}
            options={walletOptions}
            optionRender={(option) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'ltr' }}>
                <span>{option.data.label.split('|')[0].trim()}</span>
                {showBalance && (
                  <Tag color={option.data.balance > 0 ? 'blue' : 'default'} style={{ marginInline: 0, fontSize: 12 }}>
                    {formatCurrency(option.data.balance, option.data.currency)}
                  </Tag>
                )}
              </div>
            )}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default WalletSelector;
