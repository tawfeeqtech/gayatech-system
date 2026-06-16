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

  // بناء مصدر بيانات الجدول: التوزيعات إن وُجدت، وإلا الدفع المباشر على الفاتورة/شهر العقد
  let tableData = [];
  if (allocations.length > 0) {
    tableData = allocations;
  } else if (transaction.invoice || transaction.contractMonth) {
    tableData = [{
      invoice: transaction.invoice,
      contractMonth: transaction.contractMonth,
      amount: transaction.amount,
      description: transaction.description,
    }];
  }

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

      {transaction.invoice && (
        <Card
          style={{ borderRadius: 8, marginBottom: 24 }}
          title={<span>تفاصيل الفاتورة المرتبطة <Tag color="blue">{transaction.invoice.invoiceNumber || '—'}</Tag></span>}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>مبلغ الفاتورة</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {formatCurrency(transaction.invoice.totalAmount, transaction.invoice.currency || transaction.currency)}
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>المدفوع</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: (transaction.invoice.paidAmount || 0) > 0 ? '#10b981' : '#94a3b8' }}>
                {formatCurrency(transaction.invoice.paidAmount || 0, transaction.invoice.currency || transaction.currency)}
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>المتبقي</div>
              {(() => {
                const rem = (transaction.invoice.totalAmount || 0) - (transaction.invoice.paidAmount || 0);
                return (
                  <div style={{ fontSize: 22, fontWeight: 700, color: rem > 0 ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(rem, transaction.invoice.currency || transaction.currency)}
                  </div>
                );
              })()}
            </Col>
          </Row>
        </Card>
      )}

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

      {tableData.length > 0 && (
        <Card title="التوزيعات" style={{ borderRadius: 8, marginBottom: 24 }}>
          <Table
            dataSource={tableData}
            rowKey={(record) => record.invoice?._id || record.invoice || record.contractMonth?._id || record.contractMonth || Math.random()}
            pagination={false}
            columns={[
              { title: 'نوع التوزيع', key: 'type', render: (_, record) => record.invoice ? 'فاتورة' : 'شهر عقد' },
              { title: 'المرجع', key: 'reference', render: (_, record) => record.invoice ? record.invoice?.invoiceNumber || record.invoice : record.contractMonth?.month || '—' },
              { title: 'المبلغ', key: 'amount', render: (value, record) => formatCurrency(record.amount, transaction.currency) },
              {
                title: 'مبلغ الفاتورة', key: 'total', render: (_, record) => {
                  const inv = record.invoice;
                  if (!inv) return '—';
                  return formatCurrency(inv.totalAmount, inv.currency || transaction.currency);
                },
              },
              {
                title: 'المدفوع', key: 'paid', render: (_, record) => {
                  if (record.invoice) {
                    const paid = record.invoice.paidAmount || 0;
                    return <span style={{ color: paid > 0 ? '#10b981' : '#94a3b8' }}>{formatCurrency(paid, record.invoice.currency || transaction.currency)}</span>;
                  }
                  return '—';
                },
              },
              {
                title: 'المتبقي', key: 'remaining', render: (_, record) => {
                  if (record.invoice) {
                    const rem = (record.invoice.totalAmount || 0) - (record.invoice.paidAmount || 0);
                    return <span style={{ color: rem > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(rem, record.invoice.currency || transaction.currency)}</span>;
                  }
                  return '—';
                },
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default TransactionDetail;
