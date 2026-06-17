import React, { useState, useEffect, useCallback } from 'react';
import { Space, message, Tag, Button, Modal, Form, Select, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import currencyAPI from '../../api/currencyExchange';
import { formatCurrency } from '../../utils/formatters';
import { useCurrencies } from '../../hooks/useCurrencies';

const CurrencyExchangeList = () => {
  const { currencies } = useCurrencies();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromCurrencyFilter, setFromCurrencyFilter] = useState('');
  const [toCurrencyFilter, setToCurrencyFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (fromCurrencyFilter) params.fromCurrency = fromCurrencyFilter;
      if (toCurrencyFilter) params.toCurrency = toCurrencyFilter;
      const response = await currencyAPI.getAll(params);
      setExchanges(response.data.data.exchanges);
      setTotal(response.data.total);
    } catch (error) {
      message.error('فشل في جلب التحويلات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchExchanges(); }, [fetchExchanges]);

  const filterBar = (
    <Space wrap>
      <Select placeholder="من عملة" allowClear style={{ width: 120 }}
        value={fromCurrencyFilter || undefined}
        onChange={(v) => { setFromCurrencyFilter(v || ''); setPage(1); }}
        options={currencies} />
      <Select placeholder="إلى عملة" allowClear style={{ width: 120 }}
        value={toCurrencyFilter || undefined}
        onChange={(v) => { setToCurrencyFilter(v || ''); setPage(1); }}
        options={currencies} />
    </Space>
  );

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await currencyAPI.create(values);
      message.success('تمت إضافة التحويل');
      setShowModal(false);
      form.resetFields();
      fetchExchanges();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'التاريخ', dataIndex: 'exchangeDate', key: 'date', width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—',
    },
    {
      title: 'من', key: 'from', width: 140,
      render: (_, r) => (
        <span>{formatCurrency(r.fromAmount, r.fromCurrency)}</span>
      ),
    },
    {
      title: 'إلى', key: 'to', width: 140,
      render: (_, r) => (
        <span>{formatCurrency(r.toAmount, r.toCurrency)}</span>
      ),
    },
    {
      title: 'سعر الصرف', dataIndex: 'exchangeRate', key: 'rate', width: 100,
      render: (v) => v?.toFixed(4),
    },
    {
      title: 'عبر', dataIndex: 'via', key: 'via', width: 90,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'ملاحظات', dataIndex: 'notes', key: 'notes', width: 180, ellipsis: true,
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>تحويلات العملات</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
          إضافة تحويل
        </Button>
      </div>

      <DataTable
        columns={columns}
        dataSource={exchanges}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1); } }}
        onRefresh={fetchExchanges}
        showActions={false}
        filters={filterBar}
      />

      <Modal
        title="إضافة تحويل عملات"
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="حفظ"
        cancelText="إلغاء"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ fromCurrency: 'ILS', toCurrency: 'USD', via: 'بنك', exchangeDate: new Date().toISOString().split('T')[0] }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Form.Item name="fromCurrency" label="من عملة" rules={[{ required: true }]}>
                <Select style={{ width: 120 }} options={currencies} />
              </Form.Item>
              <Form.Item name="toCurrency" label="إلى عملة" rules={[{ required: true }]}>
                <Select style={{ width: 120 }} options={currencies} />
              </Form.Item>
            </Space>
            <Form.Item name="fromAmount" label="المبلغ الأصلي" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="toAmount" label="المبلغ المحول" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="exchangeRate" label="سعر الصرف" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="exchangeDate" label="التاريخ">
              <input type="date" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
            </Form.Item>
            <Form.Item name="via" label="عبر">
              <Select options={[
                { value: 'ريم', label: 'ريم' }, { value: 'بنك', label: 'بنك' },
                { value: 'نقد', label: 'نقد' }, { value: 'صرافة', label: 'صرافة' },
              ]} />
            </Form.Item>
            <Form.Item name="notes" label="ملاحظات">
              <input type="text" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CurrencyExchangeList;