import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Spin, message, Row, Col, Table, Tag, Space } from 'antd';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import transactionAPI from '../../api/transactions';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../utils/formatters';

const TransactionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await transactionAPI.getById(id);
        setTransaction(res.data.data.transaction);
      } catch (error) {
        message.error('فشل في جلب بيانات المعاملة');
        navigate('/transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!transaction) return null;

  const allocations = transaction.allocations || [];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/transactions')}>
            العودة
          </Button>
          <div>
            <h2 style={{ margin: 0 }}>تفاصيل المعاملة</h2>
            <Tag color="blue" style={{ marginTop: 4 }}>{transaction.transactionNumber || '—'}</Tag>
          </div>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/transactions/edit/${id}`)}>
          تعديل
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>المبلغ</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {transaction.type === 'دخل' ? '+' : transaction.type === 'مصروف' ? '-' : '↔'} {formatCurrency(transaction.amount, transaction.currency)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>النوع</div>
            <Tag color={transaction.type === 'دخل' ? '#10b981' : transaction.type === 'مصروف' ? '#ef4444' : '#3b82f6'}>
              {transaction.type}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>الحالة</div>
            <StatusBadge status={transaction.status} mapping={statusColors.transaction || statusColors.default} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>التاريخ</div>
            <div>{transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString('ar-SA') : '—'}</div>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات المعاملة" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="العميل">{transaction.client?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="من حساب">{transaction.fromAccount?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="إلى حساب">{transaction.toAccount?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="من محفظة">{transaction.fromWallet?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="إلى محفظة">{transaction.toWallet?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="وسيلة الدفع">{transaction.paymentMethod || '—'}</Descriptions.Item>
          <Descriptions.Item label="الفاتورة المرتبطة">{transaction.invoice?.invoiceNumber || '—'}</Descriptions.Item>
          <Descriptions.Item label="شهر العقد المرتبط">{transaction.contractMonth?.month || '—'}</Descriptions.Item>
          <Descriptions.Item label="المشروع">{transaction.project?.title || '—'}</Descriptions.Item>
          <Descriptions.Item label="الوصف" span={3}>{transaction.description || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {allocations.length > 0 && (
        <Card title="التوزيعات" style={{ borderRadius: 8, marginBottom: 24 }}>
          <Table
            dataSource={allocations}
            rowKey={(record) => record.invoice || record.contractMonth || Math.random()}
            pagination={false}
            columns={[
              { title: 'نوع التوزيع', key: 'type', render: (_, record) => record.invoice ? 'فاتورة' : 'شهر عقد' },
              { title: 'المرجع', key: 'reference', render: (_, record) => record.invoice ? record.invoice?.invoiceNumber || record.invoice : record.contractMonth?.month || '—' },
              { title: 'المبلغ', key: 'amount', render: (value, record) => formatCurrency(record.amount, transaction.currency) },
              { title: 'الفاتورة / الشهر', key: 'details', render: (_, record) => record.invoice ? record.invoice?.invoiceNumber || record.invoice : record.contractMonth?.month || '—' }
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default TransactionDetail;
