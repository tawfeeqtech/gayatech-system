import React, { useState } from 'react';
import { Modal, Select, Input, Form, Space, Button, message, InputNumber, DatePicker } from 'antd';
import dayjs from 'dayjs';

/**
 * مودال التعديل الجماعي
 * يسمح باختيار حقل من الجدول وتعيين قيمة جديدة له في جميع الصفوف المحددة
 */
const BulkEditModal = ({
  visible,
  onCancel,
  onConfirm,
  selectedCount = 0,
  columns = [],
  loading = false,
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [fieldValue, setFieldValue] = useState(null);

  // تصفية الأعمدة القابلة للتعديل (نستبعد أعمدة الإجراءات والمرئية فقط)
  const editableColumns = columns.filter((col) => {
    const dataField = col.dataIndex || col.key;
    if (!dataField || dataField === 'actions') return false;
    // نستبعد الأعمدة المحسوبة
    if (col.render && !col.dataIndex) return false;
    return true;
  });

  const handleConfirm = () => {
    if (!selectedField) {
      message.warning('يرجى اختيار حقل للتعديل');
      return;
    }
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      message.warning('يرجى إدخال قيمة جديدة');
      return;
    }
    onConfirm({ field: selectedField, value: fieldValue });
  };

  // تحديد نوع الإدخال بناءً على اسم الحقل وقيمته
  const renderFieldInput = () => {
    if (!selectedField) return null;

    const fieldName = typeof selectedField === 'string' ? selectedField : selectedField.value || selectedField;
    const colConfig = columns.find((c) => (c.dataIndex || c.key) === fieldName);

    const commonProps = {
      style: { width: '100%', fontFamily: 'Cairo, sans-serif' },
      placeholder: `أدخل قيمة جديدة لـ ${colConfig?.title || fieldName}`,
    };

    // للحقول المالية (amount, salary, price, total, balance)
    if (/amount|salary|price|total|balance|paid/i.test(fieldName)) {
      return <InputNumber {...commonProps} min={0} value={fieldValue} onChange={(v) => setFieldValue(v)} prefix="$" />;
    }

    // للحقول النصية الطويلة
    if (/notes|description|address|reason/i.test(fieldName)) {
      return <Input.TextArea {...commonProps} rows={3} value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} />;
    }

    // للحقول الرقمية (عدد سنوات، عدد أيام، percent)
    if (/rate|percent|count|year/i.test(fieldName)) {
      return <InputNumber {...commonProps} value={fieldValue} onChange={(v) => setFieldValue(v)} />;
    }

    // للتاريخ
    if (/date/i.test(fieldName)) {
      return (
        <DatePicker
          style={{ width: '100%' }}
          value={fieldValue ? dayjs(fieldValue) : null}
          onChange={(d) => setFieldValue(d ? d.toISOString() : null)}
        />
      );
    }

    // للحالة (status)
    if (/status/i.test(fieldName)) {
      return (
        <Select
          {...commonProps}
          value={fieldValue}
          onChange={(v) => setFieldValue(v)}
          options={[
            { value: 'نشط', label: 'نشط' },
            { value: 'غير نشط', label: 'غير نشط' },
            { value: 'معلق', label: 'معلق' },
          ]}
        />
      );
    }

    // افتراضي: إدخال نصي
    return <Input {...commonProps} value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} />;
  };

  return (
    <Modal
      title="تعديل جماعي"
      open={visible}
      onCancel={() => { setSelectedField(null); setFieldValue(null); onCancel(); }}
      onOk={handleConfirm}
      confirmLoading={loading}
      okText="تطبيق التعديل"
      cancelText="إلغاء"
      width={500}
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 6, border: '1px solid #d6e4ff' }}>
        تم تحديد <strong>{selectedCount}</strong> عنصر للتعديل
      </div>

      <Form layout="vertical">
        <Form.Item label="اختر الحقل المراد تعديله">
          <Select
            showSearch
            placeholder="اختر حقل..."
            style={{ width: '100%', fontFamily: 'Cairo, sans-serif' }}
            value={selectedField}
            onChange={(v) => { setSelectedField(v); setFieldValue(null); }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={editableColumns.map((col) => ({
              value: col.dataIndex || col.key,
              label: col.title || col.dataIndex || col.key,
            }))}
          />
        </Form.Item>

        {selectedField && (
          <Form.Item label="القيمة الجديدة">
            {renderFieldInput()}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default BulkEditModal;
