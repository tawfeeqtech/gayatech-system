import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Switch, Typography, Divider, InputNumber, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useCurrencies } from '../../hooks/useCurrencies';
import accountAPI from '../../api/accounts';
import walletAPI from '../../api/wallets';
import settingsAPI from '../../api/settings';

const { Title, Text } = Typography;

const SystemSettings = () => {
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [accounts, setAccounts] = React.useState([]);
  const [wallets, setWallets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

      <Card title="معلومات النظام" style={{ borderRadius: 8, marginTop: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={8}><Text strong>الإصدار:</Text></Col>
          <Col span={16}><Text>1.0.0</Text></Col>
          <Col span={8}><Text strong>الترخيص:</Text></Col>
          <Col span={16}><Text>MIT</Text></Col>
          <Col span={8}><Text strong>آخر تحديث:</Text></Col>
          <Col span={16}><Text>2026-06-10</Text></Col>
        </Row>
      </Card>
    </div>
  );
};

export default SystemSettings;