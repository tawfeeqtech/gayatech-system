import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber } from 'antd';

const FormField = ({ type = 'text', ...props }) => {
  const renderField = () => {
    switch (type) {
      case 'select':
        return <Select {...props} style={{ width: '100%', ...props.style }} />;
      case 'date':
        return <DatePicker {...props} style={{ width: '100%', ...props.style }} />;
      case 'number':
        return <InputNumber {...props} style={{ width: '100%', ...props.style }} />;
      case 'textarea':
        return <Input.TextArea rows={4} {...props} />;
      case 'password':
        return <Input.Password {...props} />;
      default:
        return <Input {...props} />;
    }
  };

  return (
    <Form.Item
      name={props.name}
      label={props.label && <span style={{ fontFamily: 'Cairo, sans-serif' }}>{props.label}</span>}
      rules={props.rules}
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      {renderField()}
    </Form.Item>
  );
};

export default FormField;