import React, { useState } from 'react';
import { Card, Form, Button, Space, Row, Col, Select, message, Switch, Typography, Divider, InputNumber } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useCurrencies } from '../../hooks/useCurrencies';

const { Title, Text } = Typography;

const SystemSettings = () => {
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();

  const handleSave = (values) => {
    message.success('تم حفظ الإعدادات (محلياً)');
    console.log('Settings:', values);
  };

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
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="language" label="لغة النظام">
                <Select options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="defaultCurrency" label="العملة الافتراضية">
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