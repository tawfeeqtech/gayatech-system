import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const Login = () => {
  const { login, error, loading } = useAuth();
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setFormError('');
    const result = await login(values.username, values.password);
    if (result.success) {
      navigate('/');
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-900 via-indigo-950 to-slate-900 p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-none bg-white/95"
        style={{ borderRadius: '12px' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
            🏢
          </div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', fontFamily: 'Cairo, sans-serif' }}>
            نظام غايتك المالي
          </Title>
          <Text type="secondary" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الرجاء تسجيل الدخول للوصول إلى لوحة التحكم
          </Text>
        </div>

        {formError && (
          <Alert
            message={formError}
            type="error"
            showIcon
            className="mb-4"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          />
        )}

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'يرجى إدخال اسم المستخدم!' }]}
          >
            <Input 
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="اسم المستخدم" 
              size="large"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'يرجى إدخال كلمة المرور!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="كلمة المرور"
              size="large"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large" 
              loading={loading}
              style={{ 
                height: '48px', 
                backgroundColor: '#2563eb',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: '600'
              }}
            >
              تسجيل الدخول
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center mt-6">
          <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'Cairo, sans-serif' }}>
            فريق غايتك التقني © 2026
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
