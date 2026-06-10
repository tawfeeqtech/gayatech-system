import React from 'react';
import { Modal as AntModal, Typography } from 'antd';

const { Title } = Typography;

/**
 * مكون نافذة منبثقة موحد
 * 
 * @param {Boolean} open - حالة الظهور
 * @param {Function} onCancel - دالة الإغلاق
 * @param {Function} onOk - دالة التأكيد
 * @param {String} title - عنوان النافذة
 * @param {ReactNode} children - المحتوى
 * @param {Boolean} loading - حالة تحميل زر التأكيد
 * @param {String} okText - نص زر التأكيد
 * @param {String} cancelText - نص زر الإلغاء
 * @param {Number} width - عرض النافذة
 * @param {Boolean} showFooter - إظهار أزرار التذييل
 * @param {Boolean} destroyOnClose - تدمير المحتوى عند الإغلاق
 * @param {String} type - نوع النافذة (form, confirm, info)
 */
const Modal = ({
  open = false,
  onCancel,
  onOk,
  title,
  children,
  loading = false,
  okText = 'حفظ',
  cancelText = 'إلغاء',
  width = 600,
  showFooter = true,
  destroyOnClose = true,
  type = 'form',
}) => {
  return (
    <AntModal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      title={
        title && (
          <Title
            level={4}
            style={{
              margin: 0,
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
            }}
          >
            {title}
          </Title>
        )
      }
      centered
      width={width}
      destroyOnClose={destroyOnClose}
      confirmLoading={loading}
      okText={
        <span style={{ fontFamily: 'Cairo, sans-serif' }}>{okText}</span>
      }
      cancelText={
        <span style={{ fontFamily: 'Cairo, sans-serif' }}>{cancelText}</span>
      }
      okButtonProps={{
        style: {
          fontFamily: 'Cairo, sans-serif',
          background: type === 'danger' ? '#ef4444' : '#2563eb',
        },
      }}
      cancelButtonProps={{
        style: { fontFamily: 'Cairo, sans-serif' },
      }}
      footer={showFooter ? undefined : null}
      styles={{
        body: {
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '24px',
        },
      }}
    >
      {children}
    </AntModal>
  );
};

export default Modal;