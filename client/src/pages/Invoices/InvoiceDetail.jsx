import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Spin, message, Typography, Tag, Row, Col, Table } from 'antd';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge, { statusColors } from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import invoiceAPI from '../../api/invoices';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { Title } = Typography;

const InvoiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceAPI.getById(id)
      .then(res => setInvoice(res.data.data.invoice))
      .catch(() => {
        message.error('فشل في جلب بيانات الفاتورة');
        navigate('/invoices');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!invoice) return null;

  const remaining = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* رأس الصفحة */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/invoices')}>العودة للقائمة</Button>
          <div>
            <h2 style={{ margin: 0 }}>تفاصيل الفاتورة</h2>
            <Tag color="blue" style={{ marginTop: 4 }}>{invoice.invoiceNumber || '—'}</Tag>
          </div>
        </div>
      </div>

      {/* المؤشرات */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <StatCard title="إجمالي الفاتورة" value={invoice.totalAmount || 0} prefix="$" color="#3b82f6" icon="📄" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard title="المدفوع" value={invoice.paidAmount || 0} prefix="$" color="#10b981" icon="✅" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard title="المتبقي" value={remaining} prefix="$" color={remaining > 0 ? '#ef4444' : '#10b981'} icon="⚠️" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard title="الحالة" value={invoice.status || '—'} color={
            invoice.status === 'مدفوعة' ? '#10b981' :
              invoice.status === 'متأخرة' ? '#ef4444' :
                invoice.status === 'مدفوعة جزئياً' ? '#f59e0b' : '#3b82f6'
          } icon="📌" />
        </Col>
      </Row>

      {/* معلومات الفاتورة */}
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات الفاتورة" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="العميل">{invoice.client?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="نوع الفاتورة">{invoice.invoiceType}</Descriptions.Item>
          <Descriptions.Item label="الحالة">
            <StatusBadge status={invoice.status} mapping={statusColors.invoice} />
          </Descriptions.Item>
          <Descriptions.Item label="تاريخ الإصدار">
            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('ar-SA') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="تاريخ الاستحقاق">
            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="العملة">{invoice.currency}</Descriptions.Item>
        </Descriptions>
        {invoice.notes && (
          <Descriptions.Item label="ملاحظات">{invoice.notes}</Descriptions.Item>
        )}
      </Card>

      {/* المعاملات المرتبطة */}
      {invoice.transactions && invoice.transactions.length > 0 && (
        <Card title="المعاملات المرتبطة" style={{ borderRadius: 8 }}>
          <Table
            dataSource={invoice.transactions}
            rowKey="_id"
            pagination={false}
            columns={[
              { title: 'التاريخ', dataIndex: 'transactionDate', key: 'date', render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—' },
              { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v, r) => formatCurrency(v, r.currency) },
              { title: 'وسيلة الدفع', dataIndex: 'paymentMethod', key: 'method' },
            ]}
            locale={{ emptyText: 'لا توجد معاملات مرتبطة' }}
          />
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetail;