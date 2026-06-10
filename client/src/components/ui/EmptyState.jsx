import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const EmptyState = ({
  icon = '📭',
  title = 'لا توجد بيانات',
  description = 'لم يتم إضافة أي عنصر بعد',
  actionText,
  onAction,
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#94a3b8',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, fontFamily: 'Cairo, sans-serif', marginBottom: 24 }}>
        {description}
      </div>
      {actionText && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction} style={{ fontFamily: 'Cairo, sans-serif' }}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;