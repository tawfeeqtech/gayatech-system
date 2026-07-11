import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Switch, Typography, Divider, InputNumber, Alert, Modal, Popconfirm } from 'antd';
import { SaveOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { useCurrencies } from '../../hooks/useCurrencies';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import settingsAPI from '../../api/settings';
import systemAPI from '../../api/system';

const { Title, Text } = Typography;

const SystemSettings = () => {
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [accounts, setAccounts] = React.useState([]);
  const [wallets, setWallets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [resetting, setResetting] = useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, setRes] = await Promise.all([
        accountAPI.getAll(),
        settingsAPI.get()
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
    try {
      await settingsAPI.update(values);
      message.success('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      message.error('فشل حفظ الإعدادات');
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await systemAPI.reset();
      message.success(res.data.message);
      // إعادة تحميل الصفحة بعد ثانيتين
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في تهيئة النظام');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>جاري التحميل...</div>;

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', maxWidth: 800 }}>
      <Title level={4} style={{ marginBottom: 24 }}>إعدادات النظام</Title>

      <Form form={form} layout="vertical" onFinish={handleSave}
        initialValues={{
          defaultCurrency: 'USD',
          language: 'ar',
          dateFormat: 'hijri',
          pageSize: 10,
          enableNotifications: true,
          enableAutoBackup: false,
        }}>
        
        <Card title="الإعدادات العامة" style={{ borderRadius: 8, marginBottom: 16 }}>
          <Alert message="يتم استخدام المحفظة الافتراضية للمصاريف عند دفع الرواتب والمصاريف التشغيلية" type="info" showIcon style={{ marginBottom: 16 }} />
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="defaultExpenseAccount" label="حساب المصاريف الافتراضي">
                <Select allowClear onChange={handleAccountChange} options={accounts.map(a => ({ value: a._id, label: a.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="defaultExpenseWallet" label="محفظة المصاريف الافتراضية">
                <Select allowClear options={wallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="language" label="لغة النظام">
                <Select options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="defaultCurrency" label="العملة الافتراضية (للتقارير والعرض)">
                <Select options={currencies} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="dateFormat" label="تنسيق التاريخ">
                <Select options={[
                  { value: 'hijri', label: 'هجري' }, { value: 'gregorian', label: 'ميلادي' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="pageSize" label="عدد العناصر في الصفحة">
                <InputNumber min={5} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="الإشعارات" style={{ borderRadius: 8, marginBottom: 16 }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="enableNotifications" label="تفعيل الإشعارات" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="notifyBeforeDays" label="تنبيه قبل انتهاء الاشتراكات (أيام)">
                <InputNumber min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="النسخ الاحتياطي" style={{ borderRadius: 8, marginBottom: 16 }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="enableAutoBackup" label="نسخ احتياطي تلقائي" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="backupFrequency" label="تكرار النسخ">
                <Select options={[
                  { value: 'daily', label: 'يومي' }, { value: 'weekly', label: 'أسبوعي' },
                  { value: 'monthly', label: 'شهري' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Space>
            <Button onClick={() => message.info('جاري تصدير النسخة الاحتياطية...')}>تصدير نسخة الآن</Button>
            <Button onClick={() => message.info('جاري استيراد النسخة...')}>استيراد نسخة</Button>
          </Space>
        </Card>

        <div style={{ textAlign: 'left' }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
            حفظ الإعدادات
          </Button>
        </div>
      </Form>

      <Card 
        title={<span><WarningOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} /> منطقة خطيرة</span>}
        style={{ borderRadius: 8, marginTop: 16, borderColor: '#ff4d4f' }}
      >
        <Alert
          message="تحذير: تهيئة النظام"
          description="سيتم حذف جميع البيانات (المعاملات، الفواتير، العقود، المشاريع، العملاء، الموظفين، الرواتب، الحسابات، الموردين، الاشتراكات، وغيرها). سيتم تصفير أرصدة المحافظ فقط. سيتم الاحتفاظ بـ: المستخدمين، المحافظ (برصيد 0)، العملات."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Popconfirm
          title="هل أنت متأكد من تهيئة النظام؟"
          description="سيتم حذف جميع البيانات بشكل نهائي ولا يمكن التراجع!"
          onConfirm={handleReset}
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
          >
            تهيئة النظام
          </Button>
        </Popconfirm>
      </Card>
    </div>
  );
};

export default SystemSettings;