import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Switch, Typography, Divider, InputNumber, Alert, Tabs } from 'antd';
import { SaveOutlined, GlobalOutlined, BellOutlined, CloudUploadOutlined, InfoCircleOutlined, DollarOutlined } from '@ant-design/icons';
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

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Space direction="vertical" align="center">
        <GlobalOutlined className="text-4xl text-blue-500 animate-pulse" />
        <Text type="secondary">جاري تحميل إعدادات النظام...</Text>
      </Space>
    </div>
  );

  const tabItems = [
    {
      key: 'general',
      label: <Space><GlobalOutlined /> الإعدادات العامة</Space>,
      children: (
        <div className="space-y-6 pt-4">
          <Alert
            message="المحفظة الافتراضية"
            description="يتم استخدام الحساب والمحفظة الافتراضية للمصاريف عند دفع الرواتب والمصاريف التشغيلية لتسهيل عملية الإدخال."
            type="info"
            showIcon
            className="rounded-xl border-blue-100 bg-blue-50"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item name="defaultExpenseAccount" label="حساب المصاريف الافتراضي">
              <Select
                allowClear
                onChange={handleAccountChange}
                options={accounts.map(a => ({ value: a._id, label: a.name }))}
                className="h-10"
              />
            </Form.Item>
            <Form.Item name="defaultExpenseWallet" label="محفظة المصاريف الافتراضية">
              <Select
                allowClear
                options={wallets.map(w => ({ value: w._id, label: `${w.name} (${w.currency})` }))}
                className="h-10"
              />
            </Form.Item>
          </div>
          <Divider className="my-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item name="language" label="لغة واجهة النظام">
              <Select options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} className="h-10" />
            </Form.Item>
            <Form.Item name="defaultCurrency" label="العملة الأساسية (للتقارير)">
              <Select options={currencies} className="h-10" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item name="dateFormat" label="تنسيق عرض التاريخ">
              <Select options={[
                { value: 'hijri', label: 'هجري' }, { value: 'gregorian', label: 'ميلادي' },
              ]} className="h-10" />
            </Form.Item>
            <Form.Item name="pageSize" label="عدد الصفوف الافتراضي في الجداول">
              <InputNumber min={5} max={100} className="w-full h-10 flex items-center" />
            </Form.Item>
          </div>
        </div>
      )
    },
    {
      key: 'notifications',
      label: <Space><BellOutlined /> الإشعارات والتنبيهات</Space>,
      children: (
        <div className="space-y-6 pt-4">
          <Card className="bg-slate-50 border-0 rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">تفعيل نظام الإشعارات</div>
                <div className="text-xs text-slate-500">إرسال تنبيهات للنظام عند حدوث عمليات هامة أو اقتراب مواعيد الاستحقاق</div>
              </div>
              <Form.Item name="enableNotifications" valuePropName="checked" noStyle>
                <Switch size="large" />
              </Form.Item>
            </div>
          </Card>
          <Form.Item name="notifyBeforeDays" label="تنبيه قبل انتهاء العقود والاشتراكات (بالأيام)">
            <InputNumber min={1} max={90} className="w-full md:w-1/2 h-10 flex items-center" />
          </Form.Item>
        </div>
      )
    },
    {
      key: 'backup',
      label: <Space><CloudUploadOutlined /> النسخ الاحتياطي</Space>,
      children: (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item name="enableAutoBackup" label="تفعيل النسخ الاحتياطي التلقائي" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="backupFrequency" label="وتيرة النسخ التلقائي">
              <Select options={[
                { value: 'daily', label: 'يومي' }, { value: 'weekly', label: 'أسبوعي' },
                { value: 'monthly', label: 'شهري' },
              ]} className="h-10" />
            </Form.Item>
          </div>
          <Divider />
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4">
            <div className="text-amber-500 text-xl"><InfoCircleOutlined /></div>
            <div>
              <div className="font-bold text-amber-800 mb-1 text-sm">التحكم اليدوي في البيانات</div>
              <div className="text-xs text-amber-700 mb-3 leading-relaxed">
                يمكنك تصدير قاعدة البيانات بالكامل لاستخدامها كنسخة احتياطية خارج النظام، أو استيراد نسخة سابقة.
              </div>
              <Space>
                <Button className="rounded-lg border-amber-200 text-amber-700" onClick={() => message.info('جاري التحضير...')}>تصدير الآن</Button>
                <Button className="rounded-lg border-amber-200 text-amber-700" onClick={() => message.info('يرجى اختيار الملف...')}>استيراد ملف</Button>
              </Space>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'about',
      label: <Space><InfoCircleOutlined /> حول النظام</Space>,
      children: (
        <div className="pt-4">
          <Card className="border-slate-100 rounded-2xl overflow-hidden shadow-sm" bodyStyle={{ padding: 0 }}>
            <div className="bg-blue-600 p-8 text-white">
              <div className="text-2xl font-bold mb-1">نظام غايتك المالي</div>
              <div className="opacity-80 text-sm">Gayatech Financial ERP System</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500">إصدار النظام</div>
                <div className="text-right font-mono font-bold">v1.0.0-modern</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500">نوع الترخيص</div>
                <div className="text-right font-medium">Enterprise License</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500">آخر تحديث أمني</div>
                <div className="text-right font-medium">يونيو 2026</div>
              </div>
              <div className="pt-4 text-center">
                <Text type="secondary" className="text-[10px]">تطوير فريق غايتك التقني © 2026 جميع الحقوق محفوظة</Text>
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3} className="!mb-1">تكوين النظام</Title>
          <Text type="secondary">تخصيص الخيارات العامة والمالية وإعدادات الأمان</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          className="rounded-xl h-11 px-8 shadow-blue-200 shadow-lg"
        >
          حفظ التغييرات
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="modern-form"
      >
        <Card className="border-0 shadow-sm rounded-2xl" bodyStyle={{ padding: '8px 24px 24px' }}>
          <Tabs
            defaultActiveKey="general"
            items={tabItems}
            className="custom-tabs"
            tabBarGutter={32}
          />
        </Card>
      </Form>
    </div>
  );
};

export default SystemSettings;
