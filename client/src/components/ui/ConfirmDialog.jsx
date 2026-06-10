import React from 'react';
import { Modal, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من حذف هذا العنصر؟',
  description,
  loading = false,
  confirmText = 'نعم، احذف',
  cancelText = 'إلغاء',
  type = 'danger', // danger, warning, info
}) => {
  const iconColors = {
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <ExclamationCircleOutlined
          style={{ fontSize: 48, color: iconColors[type], marginBottom: 16 }}
        />
        <Paragraph
          strong
          style={{ fontSize: 16, fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}
        >
          {title}
        </Paragraph>
        <Text type="secondary" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {message}
        </Text>
        {description && (
          <Paragraph
            type="secondary"
            style={{
              fontSize: 13,
              fontFamily: 'Cairo, sans-serif',
              background: '#f8fafc',
              padding: 8,
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            {description}
          </Paragraph>
        )}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 24px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 24px',
              borderRadius: 6,
              border: 'none',
              background: type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'جاري...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;