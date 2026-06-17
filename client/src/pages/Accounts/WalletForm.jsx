import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useCurrencies } from '../../hooks/useCurrencies';

const WalletForm = ({ visible, onCancel, onSuccess, initialValues, accountId }) => {
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const isEdit = !!initialValues;

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, isDefault: false, balance: 0 });
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSuccess(values);
    } catch (error) {
      // Validation failed
    }
  };

  return (
    <Modal
      title={isEdit ? 'تعديل محفظة' : 'إضافة محفظة جديدة'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={isEdit ? 'تحديث' : 'إضافة'}
      cancelText="إلغاء"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ isActive: true, isDefault: false, balance: 0 }}>
        <Form.Item
          name="name"
          label="اسم المحفظة"
          rules={[{ required: true, message: 'يرجى إدخال اسم المحفظة' }]}
        >
          <Input placeholder="مثال: محفظة الدولار الكاش" />
        </Form.Item>

        <Form.Item
          name="currency"
          label="العملة"
          rules={[{ required: true, message: 'يرجى اختيار العملة' }]}
        >
          <Select
            placeholder="اختر العملة"
            options={currencies}
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          name="balance"
          label="الرصيد"
          rules={[{ required: true, message: 'يرجى إدخال الرصيد' }]}
        >
          <InputNumber style={{ width: '100%' }} precision={2} />
        </Form.Item>

        <Form.Item name="notes" label="ملاحظات">
          <Input.TextArea rows={2} />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="isActive" label="نشطة" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isDefault" label="افتراضية" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default WalletForm;
