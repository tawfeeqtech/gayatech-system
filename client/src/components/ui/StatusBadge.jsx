import React from 'react';
import { Tag } from 'antd';

const StatusBadge = ({ status, mapping }) => {
  // mapping = { 'نشط': 'green', 'غير نشط': 'red', ... }
  const color = mapping?.[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
};

// إعدادات ألوان جاهزة
export const statusColors = {
  client: { 'نشط': 'green', 'غير نشط': 'red', 'متوقف مؤقتاً': 'orange', 'محظور': 'red' },
  contract: { 'نشط': 'green', 'متوقف': 'orange', 'منتهي': 'default', 'ملغي': 'red' },
  project: {
    'قيد التخطيط': 'blue', 'قيد التنفيذ': 'processing', 'تحت المراجعة': 'warning',
    'مكتمل': 'green', 'تم التسليم': 'success', 'متوقف': 'orange', 'ملغي': 'red'
  },
  transaction: { 'دخل': 'green', 'مصروف': 'red', 'تحويل': 'blue' },
  invoice: {
    'مسودة': 'default', 'مصدرة': 'blue', 'مدفوعة جزئياً': 'orange',
    'مدفوعة': 'green', 'متأخرة': 'red', 'ملغاة': 'red'
  },
  monthStatus: {
    'pending_review': 'default', 'confirmed': 'blue', 'paid': 'green',
    'partially_paid': 'orange', 'overdue': 'red', 'cancelled': 'red', 'paused': 'orange'
  },
};

export default StatusBadge;