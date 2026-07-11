import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Switch, Typography, Divider, InputNumber, Alert, Popconfirm, Tag, Statistic } from 'antd';
import {
  SaveOutlined,
  WarningOutlined,
  ReloadOutlined,
  SettingOutlined,
  BellOutlined,
  CloudOutlined,
  SafetyOutlined,
  GlobalOutlined,
  WalletOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useCurrencies } from '../../hooks/useCurrencies';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import settingsAPI from '../../api/settings';
import systemAPI from '../../api/system';

const { Title, Text, Paragraph } = Typography;

// ==================== Helper: Section Card ====================
const SectionCard = ({ icon, title, subtitle, children, color = '#1677ff', style }) => (
  <Card
    style={{ borderRadius: 12, height: '100%', ...style }}
    title={
      <Space>
        <span style={{ fontSize: 20, color }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        {subtitle && <Tag color="default" style={{ fontWeight: 400 }}>{subtitle}</Tag>}
      </Space>
    }
  >
    {children}
  </Card>
);

// ==================== Danger Zone Card ====================
const DangerZone = ({ resetting, onReset }) => (
  <Card
    style={{
      borderRadius: 12,
      borderColor: '#ff4d4f',
      borderWidth: 2,
      background: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)',
    }}
    title={
      <Space>
        <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#cf1322' }}>منطقة خطيرة</span>
      </Space>
    }
  >
    <Alert
      message="تحذير: سيتم حذف جميع البيانات التشغيلية"
      description="سيتم مسح: المعاملات، الفواتير، العقود، المشاريع، العملاء، الموظفين، الرواتب، الحسابات، الموردين، الاشتراكات، وغيرها. سيتم تصفير أرصدة المحافظ فقط."
      type="error"
      showIcon
      style={{ marginBottom: 20, borderRadius: 8 }}
    />
    <Row gutter={[16, 12]}>
      <Col xs={24} sm={12}>
        <Statistic
          title="المحتفظ به"
          value="المستخدمين • العملات • المحافظ (برصيد 0)"
          valueStyle={{ fontSize: 14, color: '#52c41a' }}
          prefix={<SafetyOutlined />}
        />
      </Col>
      <Col xs={24} sm={12}>
        <Statistic
          title="المحذوف"
          value="جميع البيانات التشغيلية والمالية"
          valueStyle={{ fontSize: 14, color: '#ff4d4f' }}
          prefix={<WarningOutlined />}
        />
      </Col>
    </Row>
    <Divider />
    <Popconfirm
      title="هل أنت متأكد من تهيئة النظام؟"
      description="سيتم حذف جميع البيانات بشكل نهائي ولا يمكن التراجع!"
      onConfirm={onReset}
      okText="نعم، هيّئ النظام"
      cancelText="إلغاء"
      okButtonProps={{ danger: true }}
    >
      <Button
        danger
        type="primary"
        icon={<ReloadOutlined spin={resetting} />}
        loading={resetting}
        size="large"
        block
      >
        تهيئة النظام
      </Button>
    </Popconfirm>
  </Card>
);

// ==================== Main Component ====================
const SystemSettings = () => {
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [accounts, setAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, setRes] = await Promise.all([
        accountAPI.getAll(),
        settingsAPI.get(),
      ]);
      setAccounts(accRes.data.data.accounts || []);
      const settings = setRes.data.data.settings;
      if (settings) {
        if (settings.defaultExpenseAccount) {
          await handleAccountChange(settings.defaultExpenseAccount._id || settings.defaultExpenseAccount, false);
        }
        form.setFieldsValue({
          ...settings,
          defaultExpenseAccount: settings.defaultExpenseAccount?._id || settings.defaultExpenseAccount,
          defaultExpenseWallet: settings.defaultExpenseWallet?._id || settings.defaultExpenseWallet,
        });
      }
    } catch (e) {
      message.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = async (accountId, clearWallet = true) => {
    if (clearWallet) form.setFieldsValue({ defaultExpenseWallet: undefined });
    if (!accountId) { setWallets([]); return; }
    try {
      const res = await walletAPI.getByAccount(accountId);
      setWallets(res.data.data.wallets || []);
    } catch (e) { setWallets([]); }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await settingsAPI.update(values);
      message.success('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      message.error('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await systemAPI.reset();
      message.success(res.data.message);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في تهيئة النظام');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <SettingOutlined spin style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
        <Paragraph type="secondary">جاري تحميل إعدادات النظام...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', padding: '0 0 40px 0' }}>
      {/* ===== Page Header ===== */}
      <div style={{ marginBottom: 28 }}>
        <Space align="center" size={12}>
          <SettingOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>إعدادات النظام</Title>
            <Text type="secondary">تخصيص إعدادات النظام العامة والنسخ الاحتياطي والعمليات المتقدمة</Text>
          </div>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          defaultCurrency: 'USD',
          language: 'ar',
          dateFormat: 'hijri',
          pageSize: 10,
          enableNotifications: true,
          enableAutoBackup: false,
        }}
      >
        {/* ===== Row 1: General Settings ===== */}
        <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
          {/* Financial Defaults */}
          <Col xs={24} lg={12}>
            <SectionCard
              icon={<WalletOutlined />}
              title="الإعدادات المالية"
              subtitle="افتراضيات"
              color="#1677ff"
            >
              <Alert
                message="تُستخدم المحفظة الافتراضية للمصاريف عند دفع الرواتب والمصاريف التشغيلية"
                type="info"
                showIcon
                style={{ marginBottom: 20, borderRadius: 8 }}
              />
              <Form.Item name="defaultExpenseAccount" label="حساب المصاريف الافتراضي">
                <Select
                  allowClear
                  placeholder="اختر الحساب..."
                  onChange={handleAccountChange}
                  options={accounts.map(a => ({ value: a._id, label: a.name }))}
                  size="large"
                />
              </Form.Item>
              <Form.Item name="defaultExpenseWallet" label="محفظة المصاريف الافتراضية">
                <Select
                  allowClear
                  placeholder="اختر المحفظة..."
                  options={wallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))}
                  size="large"
                />
              </Form.Item>
            </SectionCard>
          </Col>

          {/* Localization */}
          <Col xs={24} lg={12}>
            <SectionCard
              icon={<GlobalOutlined />}
              title="اللغة والتنسيق"
              subtitle="محلي"
              color="#722ed1"
            >
              <Form.Item name="language" label="لغة النظام">
                <Select
                  size="large"
                  options={[
                    { value: 'ar', label: '🇸🇦 العربية' },
                    { value: 'en', label: '🇬🇧 English' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="defaultCurrency" label="العملة الافتراضية (للتقارير والعرض)">
                <Select size="large" options={currencies} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="dateFormat" label="تنسيق التاريخ">
                    <Select
                      size="large"
                      options={[
                        { value: 'hijri', label: 'هجري' },
                        { value: 'gregorian', label: 'ميلادي' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="pageSize" label="عدد العناصر بالصفحة">
                    <InputNumber min={5} max={100} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>
          </Col>
        </Row>

        {/* ===== Row 2: Notifications & Backup ===== */}
        <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
          {/* Notifications */}
          <Col xs={24} lg={12}>
            <SectionCard
              icon={<BellOutlined />}
              title="الإشعارات والتنبيهات"
              subtitle="تكوين"
              color="#fa8c16"
            >
              <Form.Item name="enableNotifications" label="تفعيل الإشعارات" valuePropName="checked">
                <Switch size="default" />
              </Form.Item>
              <Form.Item name="notifyBeforeDays" label="تنبيه قبل انتهاء الاشتراكات (أيام)">
                <InputNumber min={1} max={90} style={{ width: '100%' }} size="large" placeholder="مثال: 7" />
              </Form.Item>
            </SectionCard>
          </Col>

          {/* Backup */}
          <Col xs={24} lg={12}>
            <SectionCard
              icon={<CloudOutlined />}
              title="النسخ الاحتياطي"
              subtitle="أتمتة"
              color="#13c2c2"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="enableAutoBackup" label="نسخ احتياطي تلقائي" valuePropName="checked">
                    <Switch size="default" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="backupFrequency" label="تكرار النسخ">
                    <Select
                      size="large"
                      options={[
                        { value: 'daily', label: 'يومي' },
                        { value: 'weekly', label: 'أسبوعي' },
                        { value: 'monthly', label: 'شهري' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0 16px' }} />
              <Space wrap>
                <Button icon={<CloudOutlined />} onClick={() => message.info('جاري تصدير النسخة الاحتياطية...')}>
                  تصدير نسخة الآن
                </Button>
                <Button onClick={() => message.info('جاري استيراد النسخة...')}>
                  استيراد نسخة
                </Button>
              </Space>
            </SectionCard>
          </Col>
        </Row>

        {/* ===== Save Button ===== */}
        <div style={{ textAlign: 'left', marginBottom: 28 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            loading={saving}
            style={{ minWidth: 180, height: 44, borderRadius: 10, fontSize: 15 }}
          >
            حفظ جميع الإعدادات
          </Button>
        </div>
      </Form>

      {/* ===== Row 3: System Info & Danger Zone ===== */}
      <Row gutter={[20, 20]}>
        {/* System Info */}
        <Col xs={24} lg={12}>
          <SectionCard
            icon={<DatabaseOutlined />}
            title="معلومات النظام"
            subtitle="حالة"
            color="#52c41a"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="الإصدار" value="1.0.0" valueStyle={{ fontSize: 18 }} />
              </Col>
              <Col span={12}>
                <Statistic title="الترخيص" value="MIT" valueStyle={{ fontSize: 18 }} />
              </Col>
              <Col span={12}>
                <Statistic title="آخر تحديث" value="2026-07-11" valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="قاعدة البيانات"
                  value="MongoDB 7"
                  valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  prefix={<span style={{ fontSize: 10 }}>🟢</span>}
                />
              </Col>
            </Row>
          </SectionCard>
        </Col>

        {/* Danger Zone */}
        <Col xs={24} lg={12}>
          <DangerZone resetting={resetting} onReset={handleReset} />
        </Col>
      </Row>
    </div>
  );
};

export default SystemSettings;
