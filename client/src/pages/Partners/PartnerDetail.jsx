import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Descriptions, Button, Spin, Table, Tag, message, Form, InputNumber, Select, Space, Typography } from 'antd';
import { ArrowRightOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import partnerAPI from '../../api/partners';
import accountAPI from '../../api/accounts';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const PartnerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [fundings, setFundings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [fundingForm] = Form.useForm();
  const [fundingSubmitting, setFundingSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      partnerAPI.getById(id),
      accountAPI.getAll().catch(() => ({ data: { data: { accounts: [] } } })),
    ]).then(([pRes, aRes]) => {
      setPartner(pRes.data.data.partner);
      setFundings(pRes.data.data.fundings || []);
      setAccounts(aRes.data.data.accounts || []);
    }).catch(() => message.error('فشل في جلب البيانات'))
    .finally(() => setLoading(false));
  }, [id]);

  const handleAddFunding = async (values) => {
    setFundingSubmitting(true);
    try {
      await partnerAPI.createFunding(id, values);
      message.success('تمت إضافة التمويل');
      setShowFundingForm(false);
      fundingForm.resetFields();
      // إعادة تحميل
      const res = await partnerAPI.getById(id);
      setPartner(res.data.data.partner);
      setFundings(res.data.data.fundings || []);
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الإضافة');
    } finally {
      setFundingSubmitting(false);
    }
  };

  const fundingColumns = [
    {
      title: 'التاريخ', dataIndex: 'fundingDate', key: 'date', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'النوع', dataIndex: 'direction', key: 'direction', width: 110,
      render: (d) => (
        <Tag color={d === 'تمويل وارد' ? 'green' : 'orange'}>
          {d === 'تمويل وارد' ? '⬇ تمويل' : '⬆ سداد'}
        </Tag>
      ),
    },
    {
      title: 'المبلغ', dataIndex: 'amount', key: 'amount', width: 130,
      render: (v, r) => (
        <span style={{ color: r.direction === 'تمويل وارد' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {r.direction === 'تمويل وارد' ? '+' : '-'} {formatCurrency(v, r.currency)}
        </span>
      ),
    },
    {
      title: 'الحساب', key: 'account', width: 130,
      render: (_, r) => r.toAccount?.name || r.fromAccount?.name || '—',
    },
    { title: 'السبب', dataIndex: 'reason', key: 'reason', width: 200, ellipsis: true },
    {
      title: 'تاريخ السداد المتوقع', dataIndex: 'expectedRepaymentDate', key: 'expected', width: 130,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => <Tag color={s === 'مكتمل' ? 'green' : 'orange'}>{s}</Tag>,
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!partner) return null;

  const stats = partner.computedStats || {};
  const balance = stats.balance || 0; // سالب يعني مستحق على الشركة للشريك

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/partners')}>العودة</Button>
          <div>
            <h2 style={{ margin: 0 }}>{partner.name}</h2>
            <Tag color="purple">{partner.partnerType}</Tag>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="إجمالي التمويل" value={stats.totalFunded || 0} prefix="$" color="#10b981" icon="💰" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="إجمالي المسدد" value={stats.totalRepaid || 0} prefix="$" color="#3b82f6" icon="💵" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="المستحق"
            value={Math.abs(balance)}
            prefix="$"
            color={balance < 0 ? '#ef4444' : '#10b981'}
            icon={balance < 0 ? '⚠️' : '✅'}
          />
        </Col>
      </Row>

      {balance < 0 && (
        <Card 
          title="💰 تسديد المبلغ المستحق" 
          style={{ borderRadius: 8, marginBottom: 24, border: '1px solid #f59e0b' }}
          extra={<Tag color="orange">مستحق للشريك</Tag>}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>المبلغ المستحق:</span>
              <div style={{ fontSize: 20, color: '#ef4444', fontWeight: 700 }}>
                {formatCurrency(Math.abs(balance))}
              </div>
            </Col>
            <Col xs={24} md={6}>
              <span style={{ display: 'block', marginBottom: 4 }}>إجمالي التمويل:</span>
              <div style={{ fontWeight: 600 }}>{formatCurrency(stats.totalFunded || 0)}</div>
            </Col>
            <Col xs={24} md={6}>
              <span style={{ display: 'block', marginBottom: 4 }}>إجمالي المسدد:</span>
              <div style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(stats.totalRepaid || 0)}</div>
            </Col>
            <Col xs={24} md={6}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setShowFundingForm(true);
                  fundingForm.setFieldsValue({
                    direction: 'سداد للشريك',
                    amount: Math.abs(balance),
                    reason: 'سداد كامل',
                  });
                }}
              >
                تسجيل سداد
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Descriptions title="معلومات الشريك" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="البريد">{partner.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="الهاتف">{partner.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="عدد المعاملات">{stats.totalTransactions || 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="التمويلات والمعاملات"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowFundingForm(!showFundingForm)}>
            إضافة معاملة
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        {showFundingForm && (
          <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
            <Form form={fundingForm} layout="inline" onFinish={handleAddFunding}
              initialValues={{ currency: 'USD', direction: 'تمويل وارد', status: 'مكتمل' }}>
              <Form.Item name="direction" rules={[{ required: true }]}>
                <Select style={{ width: 130 }} options={[
                  { value: 'تمويل وارد', label: 'تمويل وارد' },
                  { value: 'سداد للشريك', label: 'سداد للشريك' },
                ]} />
              </Form.Item>
              <Form.Item name="amount" rules={[{ required: true }]}>
                <InputNumber placeholder="المبلغ" min={0} style={{ width: 120 }} />
              </Form.Item>

              <Form.Item name="currency">
                <Select style={{ width: 80 }} options={[
                  { value: 'USD', label: '$' },
                  { value: 'ILS', label: '₪' },
                  { value: 'SAR', label: '﷼' },
                  { value: 'JOD', label: 'د.أ' },
                ]} />
              </Form.Item>

              <Form.Item name="fundingDate" rules={[{ required: true }]}>
                <input type="date" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db' }} />
              </Form.Item>
              <Form.Item name={fundingForm.getFieldValue('direction') === 'تمويل وارد' ? 'toAccount' : 'fromAccount'}>
                <Select placeholder="الحساب" style={{ width: 140 }} allowClear
                  options={accounts.map(a => ({ value: a._id, label: a.name }))} />
              </Form.Item>

              {fundingForm.getFieldValue('direction') === 'تمويل وارد' && (
                <Form.Item name="expectedRepaymentDate" label="تاريخ السداد المتوقع">
                  <input type="date" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db' }} />
                </Form.Item>
              )}

              <Form.Item name="reason" rules={[{ required: true }]}>
                <Select placeholder="السبب" style={{ width: 180 }} options={[
                  { value: 'تمويل تشغيلي', label: 'تمويل تشغيلي' },
                  { value: 'تمويل طارئ', label: 'تمويل طارئ' },
                  { value: 'سداد جزئي', label: 'سداد جزئي' },
                  { value: 'سداد كامل', label: 'سداد كامل' },
                  { value: 'أخرى', label: 'أخرى' },
                ]} />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={fundingSubmitting}>حفظ</Button>
                <Button onClick={() => setShowFundingForm(false)}>إلغاء</Button>
              </Space>
            </Form>
          </Card>
        )}
        <Table columns={fundingColumns} dataSource={fundings} rowKey="_id"
          locale={{ emptyText: 'لا توجد معاملات' }}
          summary={() => {
            const totalIn = fundings.filter(f => f.direction === 'تمويل وارد').reduce((s, f) => s + f.amount, 0);
            const totalOut = fundings.filter(f => f.direction === 'سداد للشريك').reduce((s, f) => s + f.amount, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}><strong>الإجمالي</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{ color: '#10b981' }}>+{formatCurrency(totalIn)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={4}>
                  <span style={{ color: '#ef4444' }}>-{formatCurrency(totalOut)}</span>
                  <span style={{ marginLeft: 16, fontWeight: 700 }}>
                    الصافي: {formatCurrency(totalIn - totalOut)}
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default PartnerDetail;