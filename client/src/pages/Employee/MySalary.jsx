import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Spin, Button, Row, Col, Statistic, Tag, Table, Select,
  Empty, Divider, Modal, Form, InputNumber, Input, DatePicker, message
} from 'antd';
import {
  DollarOutlined, ReloadOutlined, CalendarOutlined, BankOutlined,
  ArrowUpOutlined, ArrowDownOutlined, FilePdfOutlined, PrinterOutlined,
  WalletOutlined, PlusOutlined, CloseOutlined, CheckOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// ======================== HELPERS ========================

const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const formatMonth = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return monthsAr[parseInt(mo)-1] + ' ' + y;
};
const fmt = (v, c) => (v ?? 0).toLocaleString('en-US') + ' ' + (c || '$');
const fmtNum = (v) => (v ?? 0).toLocaleString('en-US');

const statusTag = (s) => {
  const map = { 'مدفوع':'green','مدفوع جزئياً':'orange','مستحق':'blue','معلق':'default' };
  return <Tag color={map[s] || 'default'}>{s}</Tag>;
};

const advanceStatusTag = (s) => {
  const map = { 'مسددة':'green','مسددة جزئياً':'orange','موافق عليها':'blue','معلقة':'gold','مرفوضة':'red' };
  return <Tag color={map[s] || 'default'}>{s}</Tag>;
};

// ======================== HEATMAP ========================

const SalaryHeatmap = ({ salaries }) => {
  if (!salaries?.length) return <Empty description="لا توجد بيانات" />;
  
  const year = new Date().getFullYear();
  const monthsData = Array(12).fill(null).map((_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const key = year + '-' + m;
    const s = salaries.find(s => s.month === key);
    return { month: monthsAr[i], value: s?.totalAmount || 0, status: s?.status || 'none' };
  });

  const maxVal = Math.max(...monthsData.map(d => d.value), 1);
  const getColor = (v, status) => {
    if (status === 'none') return '#f1f5f9';
    if (status === 'مدفوع') {
      const pct = v / maxVal;
      if (pct > 0.8) return '#166534';
      if (pct > 0.5) return '#16a34a';
      return '#4ade80';
    }
    return '#f59e0b';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
      {monthsData.map((d, i) => (
        <div key={i} style={{
          background: getColor(d.value, d.status),
          borderRadius: 6, padding: '8px 6px', textAlign: 'center',
          color: d.status === 'none' ? '#94a3b8' : '#fff', fontSize: 11,
          fontFamily: 'Cairo, sans-serif'
        }}>
          <div style={{ fontWeight: 600 }}>{d.month}</div>
          <div>{d.status === 'none' ? '—' : '$' + fmtNum(d.value)}</div>
        </div>
      ))}
    </div>
  );
};

// ======================== MAIN COMPONENT ========================

const MySalary = () => {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
  const [advanceForm] = Form.useForm();

  // ======================== DATA FETCHING ========================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salRes, advRes, empRes] = await Promise.all([
        api.get('/salaries/me'),
        api.get('/advances/me'),
        api.get('/employees/me').catch(() => null),
      ]);

      // Fix: response.data.data.salaries is the correct path
      const sals = salRes.data.data?.salaries || [];
      setSalaries(sals);
      setAdvances(advRes.data.data?.advances || []);
      if (empRes) setEmployee(empRes.data.data?.employee || null);
      // No error on empty — page shows KPIs + info without salary records
    } catch (err) {
      if (err.response?.status === 404) {
        setError('لم يتم العثور على بيانات راتب لك بعد.');
      } else {
        setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ======================== COMPUTED VALUES ========================

  const latestSalary = selectedMonth
    ? salaries.find(s => s.month === selectedMonth) || salaries[0] || null
    : salaries[0] || null;

  const monthOptions = salaries.map(s => ({ value: s.month, label: formatMonth(s.month) }));

  // Annual summary
  const currentYear = String(new Date().getFullYear());
  const yearSalaries = salaries.filter(s => s.month?.startsWith(currentYear));
  const yearTotal = yearSalaries.reduce((s, r) => s + (r.totalAmount || 0), 0);
  const yearDeductions = yearSalaries.reduce((s, r) => s + (r.deductions || 0), 0);

  // Pending advances
  const pendingAdvances = advances
    .filter(a => a.status === 'موافق عليها' || a.status === 'مسددة جزئياً')
    .reduce((s, a) => s + (a.remainingAmount || a.amount - (a.repaidAmount || 0)), 0);

  // Monthly chart data (last 12 months)
  const chartData = salaries
    .slice()
    .reverse()
    .slice(-12)
    .map(s => ({
      month: s.month?.split('-')[1] ? monthsAr[parseInt(s.month.split('-')[1])-1] : s.month,
      صافي: s.totalAmount || 0,
      خصومات: s.deductions || 0,
      أساسي: s.baseAmount || 0,
    }));

  // Deduction items for latest salary
  const deductionItems = latestSalary?.deductionItems || [];

  // ======================== REQUEST ADVANCE ========================

  const handleAdvanceSubmit = async (values) => {
    setAdvanceSubmitting(true);
    try {
      await api.post('/advances', {
        employee: user?.employee,
        amount: values.amount,
        currency: employee?.salaryCurrency || 'USD',
        reason: values.reason,
        requestDate: values.requestDate?.toISOString() || new Date().toISOString(),
        repaymentMethod: 'خصم من الراتب',
      });
      message.success('تم تقديم طلب السلفة بنجاح');
      setAdvanceModal(false);
      advanceForm.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || 'فشل في تقديم الطلب');
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  // ======================== PRINT / PDF ========================

  const handlePrint = () => window.print();

  // ======================== LOADING STATE ========================

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="جاري تحميل البيانات..." />
      </div>
    );
  }

  // ======================== RENDER ========================

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1e3a8a' }}>
            <DollarOutlined style={{ marginLeft: 8 }} />راتبي — نظرة شاملة
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            placeholder="اختر الشهر"
            style={{ width: 160 }}
            value={selectedMonth}
            onChange={setSelectedMonth}
            allowClear
            options={monthOptions}
            onClear={() => setSelectedMonth(null)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>تحديث</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdvanceModal(true)}>طلب سلفة</Button>
        </div>
      </div>

      {error ? (
        <Empty description={error} style={{ marginTop: 60 }}>
          <Button type="primary" onClick={fetchData}>إعادة المحاولة</Button>
        </Empty>
      ) : (
        <>
          {/* ==================== KPI CARDS ==================== */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', color:'#fff', boxShadow:'0 4px 15px rgba(30,58,138,0.3)' }}>
                <Statistic title={<span style={{color:'rgba(255,255,255,0.85)'}}>💰 الراتب الأساسي</span>}
                  value={employee?.baseSalary || 0} prefix="$"
                  valueStyle={{color:'#fff',fontSize:28}} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border:'1px solid #e2e8f0' }}>
                <Statistic title="📈 صافي الراتب (آخر شهر)"
                  value={latestSalary?.totalAmount || 0} prefix="$"
                  valueStyle={{color:'#16a34a'}} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ borderRadius: 12, border:'1px solid #e2e8f0' }}>
                <Statistic title="💰 المتبقي من السلف"
                  value={pendingAdvances} prefix="$"
                  valueStyle={{color: pendingAdvances > 0 ? '#dc2626' : '#16a34a'}} />
              </Card>
            </Col>
          </Row>

          {/* ==================== SALARY DETAILS ==================== */}
          {latestSalary && (
            <Card title={`📋 تفاصيل الراتب — ${formatMonth(latestSalary.month)}`}
              bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                {[
                  ['الأساسي', latestSalary.baseAmount],
                  ['البدلات', latestSalary.bonuses],
                  ['الخصومات', latestSalary.deductions],
                  ['الصافي', latestSalary.totalAmount],
                ].map(([label, val], i) => (
                  <Col xs={12} sm={6} key={i}>
                    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 8, background: '#f8fafc' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                      <div style={{ fontSize: 20, fontWeight: 700, color: label === 'الخصومات' ? '#dc2626' : '#1e293b', marginTop: 4 }}>
                        {fmt(val, latestSalary.currency)}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <Divider style={{ margin: '16px 0' }} />
              <Row gutter={16}>
                <Col span={12}><Text type="secondary">الحالة:</Text> {statusTag(latestSalary.status)}</Col>
                <Col span={12}><Text type="secondary">العملة:</Text> {latestSalary.currency}</Col>
                {latestSalary.paymentDate && <Col span={12} style={{marginTop:8}}><Text type="secondary">تاريخ الدفع:</Text> {dayjs(latestSalary.paymentDate).format('DD/MM/YYYY')}</Col>}
              </Row>
            </Card>
          )}

          {/* ==================== DEDUCTION DETAILS ==================== */}
          {deductionItems.length > 0 && (
            <Card title="📊 تفاصيل الخصومات" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
              {deductionItems.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < deductionItems.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span>
                    {d.advance ? '🏦 ' : '📋 '}
                    {d.reason || (d.advance ? `سلفة #${d.advance}` : 'خصم')}
                    {d.date && <Text type="secondary" style={{ fontSize: 11, marginRight: 8 }}>{dayjs(d.date).format('DD/MM/YYYY')}</Text>}
                  </span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-{fmt(d.amount, latestSalary?.currency)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 4, borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                <span>مجموع الخصومات</span>
                <span style={{ color: '#dc2626' }}>-{fmt(latestSalary?.deductions, latestSalary?.currency)}</span>
              </div>
            </Card>
          )}

          {/* ==================== MONTHLY CHART + HEATMAP ==================== */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card title="📈 الراتب الشهري" bordered={false} style={{ borderRadius: 12 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip formatter={(v) => '$' + v.toLocaleString()} />
                    <Line type="monotone" dataKey="صافي" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="خصومات" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="🗓 خريطة الرواتب الحرارية" bordered={false} style={{ borderRadius: 12 }}>
                <SalaryHeatmap salaries={salaries} />
              </Card>
            </Col>
          </Row>

          {/* ==================== HISTORY TABLE ==================== */}
          <Card title="📅 سجل الرواتب السابقة" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Table
              dataSource={salaries}
              rowKey="_id"
              pagination={{ pageSize: 6, size: 'small' }}
              size="small"
              columns={[
                { title: 'الشهر', dataIndex: 'month', key: 'month', render: (m) => formatMonth(m), width: 130 },
                { title: 'الأساسي', dataIndex: 'baseAmount', key: 'base', render: (v, r) => fmt(v, r.currency), width: 100 },
                { title: 'البدلات', dataIndex: 'bonuses', key: 'bonus', render: (v, r) => fmt(v, r.currency), width: 90 },
                { title: 'الخصومات', dataIndex: 'deductions', key: 'ded', render: (v, r) => <span style={{color:'#dc2626'}}>-{fmt(v, r.currency)}</span>, width: 100 },
                { title: 'الصافي', dataIndex: 'totalAmount', key: 'net', render: (v, r) => <strong>{fmt(v, r.currency)}</strong>, width: 110 },
                { title: 'الحالة', dataIndex: 'status', key: 'status', render: (s) => statusTag(s), width: 110 },
                { title: 'تاريخ الدفع', dataIndex: 'paymentDate', key: 'paid', render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—', width: 110 },
              ]}
              locale={{ emptyText: 'لا توجد رواتب مسجلة' }}
            />
          </Card>

          {/* ==================== ADVANCES TABLE ==================== */}
          <Card title="💳 السلف الشخصية" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}
            extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAdvanceModal(true)}>طلب سلفة</Button>}>
            {advances.length === 0 ? (
              <Empty description="لا توجد سلف" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={advances}
                rowKey="_id"
                pagination={{ pageSize: 5, size: 'small' }}
                size="small"
                columns={[
                  { title: 'التاريخ', dataIndex: 'requestDate', key: 'date', render: (d) => dayjs(d).format('DD/MM/YYYY'), width: 100 },
                  { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v, r) => fmt(v, r.currency), width: 90 },
                  { title: 'المسدد', dataIndex: 'repaidAmount', key: 'repaid', render: (v, r) => fmt(v || 0, r.currency), width: 90 },
                  { title: 'المتبقي', key: 'remaining', render: (_, r) => <span style={{color:'#dc2626'}}>{fmt(r.remainingAmount || r.amount - (r.repaidAmount || 0), r.currency)}</span>, width: 100 },
                  { title: 'الحالة', dataIndex: 'status', key: 'status', render: (s) => advanceStatusTag(s), width: 100 },
                  { title: 'السبب', dataIndex: 'reason', key: 'reason', ellipsis: true },
                ]}
              />
            )}
          </Card>

          {/* ==================== ANNUAL SUMMARY ==================== */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Statistic title={<span style={{color:'#16a34a'}}>📊 إجمالي الرواتب المستلمة ({currentYear})</span>}
                  value={yearTotal} prefix="$" valueStyle={{color:'#16a34a',fontSize:28}} />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <Statistic title={<span style={{color:'#dc2626'}}>📉 إجمالي الخصومات ({currentYear})</span>}
                  value={yearDeductions} prefix="$" valueStyle={{color:'#dc2626',fontSize:28}} />
              </Card>
            </Col>
          </Row>

          {/* ==================== EMPLOYEE INFO ==================== */}
          {employee && (
            <Card title="👤 معلوماتي الوظيفية" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                {[
                  ['الاسم', employee.name],
                  ['المسمى الوظيفي', employee.jobTitle],
                  ['القسم', employee.department],
                  ['تاريخ الالتحاق', employee.joiningDate ? dayjs(employee.joiningDate).format('DD/MM/YYYY') : '—'],
                  ['الراتب الأساسي', fmt(employee.baseSalary, employee.salaryCurrency)],
                  ['الحالة', employee.status],
                ].map(([label, val], i) => (
                  <Col xs={12} sm={8} md={4} key={i}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{typeof val === 'string' && ['نشط','إجازة','متوقف','مستقيل','مفصول'].includes(val) ? <Tag color="green">{val}</Tag> : val}</div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* ==================== ACTIONS ==================== */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>طباعة</Button>
          </div>
        </>
      )}

      {/* ==================== ADVANCE MODAL ==================== */}
      <Modal
        title="طلب سلفة جديدة"
        open={advanceModal}
        onCancel={() => { setAdvanceModal(false); advanceForm.resetFields(); }}
        onOk={() => advanceForm.submit()}
        confirmLoading={advanceSubmitting}
        okText="تقديم الطلب"
        cancelText="إلغاء"
      >
        <Form form={advanceForm} layout="vertical" onFinish={handleAdvanceSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="المبلغ" rules={[{ required: true, message: 'المبلغ مطلوب' }]}>
                <InputNumber min={1} style={{ width: '100%' }} prefix="$" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requestDate" label="تاريخ الطلب" initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="سبب السلفة" rules={[{ required: true, message: 'السبب مطلوب' }]}>
            <Input.TextArea rows={3} placeholder="اذكر سبب طلب السلفة..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MySalary;
