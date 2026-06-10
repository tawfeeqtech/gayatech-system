import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, List, Typography, message, Tag, Divider } from 'antd';
import contractAPI from '../../api/contracts';
import invoiceAPI from '../../api/invoices';
import { formatCurrency } from '../../utils/formatters';

const { Text, Title } = Typography;

const PaymentAllocation = ({ open, onCancel, onConfirm, transaction }) => {
  const [allocations, setAllocations] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && transaction?.client) {
      fetchAvailableItems();
    }
  }, [open, transaction]);

  const fetchAvailableItems = async () => {
    setLoading(true);
    try {
      // جلب أشهر العقود غير المدفوعة وفواتير العميل
      const [contractsRes, invoicesRes] = await Promise.all([
        contractAPI.getAll({ client: transaction.client?._id || transaction.client, status: 'نشط' }).catch(() => ({ data: { data: { contracts: [] } } })),
        invoiceAPI.getAll({ client: transaction.client?._id || transaction.client, status: 'مصدرة' }).catch(() => ({ data: { data: { invoices: [] } } })),
      ]);

      const items = [];
      // سنبسط هنا - في الواقع تحتاج جلب contract months لكل عقد
      setAvailableItems(items);
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
  const remaining = (transaction?.amount || 0) - totalAllocated;

  const handleConfirm = () => {
    if (totalAllocated > transaction?.amount) {
      message.error('مجموع التوزيعات أكبر من مبلغ المعاملة');
      return;
    }
    onConfirm(allocations.filter(a => a.amount > 0));
  };

  return (
    <Modal
      title={<span style={{ fontFamily: 'Cairo, sans-serif' }}>💰 توزيع دفعة</span>}
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="تأكيد التوزيع"
      cancelText="إلغاء"
      width={600}
      centered
    >
      <div style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>المبلغ:</Text>
            <Text strong style={{ color: '#10b981', fontSize: 18 }}>
              {formatCurrency(transaction?.amount, transaction?.currency)}
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text>المُوزع:</Text>
            <Text style={{ color: '#3b82f6' }}>{formatCurrency(totalAllocated)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Text>المتبقي:</Text>
            <Text style={{ color: remaining < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
              {formatCurrency(remaining)}
            </Text>
          </div>
        </div>

        {remaining < 0 && (
          <Text type="danger">⚠️ مجموع التوزيعات أكبر من مبلغ المعاملة!</Text>
        )}

        <Divider />

        <Text type="secondary">هذا المكون يحتاج للتطوير الكامل مع جلب الاستحقاقات الفعلية.</Text>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          حالياً يمكن توزيع الدفعة من خلال صفحة المعاملة نفسها.
        </Text>
      </div>
    </Modal>
  );
};

export default PaymentAllocation;