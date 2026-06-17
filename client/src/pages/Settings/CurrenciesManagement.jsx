import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, InputNumber, Tag, message, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import currencyAPI from '../../api/currencies';

const CurrenciesManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await currencyAPI.getAll();
      setCurrencies(res.data.data.currencies || []);
    } catch {
      message.error('فشل في جلب العملات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true, sortOrder: currencies.length + 1 });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingItem) {
        await currencyAPI.update(editingItem._id, values);
        message.success('تم تحديث العملة');
      } else {
        await currencyAPI.create(values);
        message.success('تم إضافة العملة');
      }

      setModalOpen(false);
      form.resetFields();
      fetchCurrencies();
    } catch (e) {
      if (e.errorFields) return; // خطأ تحقق النموذج
      message.error(e.response?.data?.message || 'فشل في حفظ العملة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await currencyAPI.remove(id);
      message.success('تم حذف العملة');
      fetchCurrencies();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في حذف العملة');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await currencyAPI.update(item._id, { isActive: !item.isActive });
      message.success(item.isActive ? 'تم تعطيل العملة' : 'تم تفعيل العملة');
      fetchCurrencies();
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في تحديث حالة العملة');
    }
  };

  const columns = [
    {
      title: 'الرمز',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (v) => <Tag color="blue" style={{ fontSize: 14, fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: 'الاسم',
      dataIndex: 'nameAr',
      key: 'nameAr',
      width: 140,
      render: (v, r) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'الرمز المختصر',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 80,
      render: (v) => <span style={{ fontSize: 18 }}>{v}</span>,
    },
    {
      title: 'الترتيب',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: 'الحالة',
      key: 'active',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={() => handleToggleActive(r)}
          checkedChildren="فعّال"
          unCheckedChildren="معطّل"
        />
      ),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 120,
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="تعديل">
            <Button type="text" size="small" icon={<EditOutlined style={{ color: '#10b981' }} />} onClick={() => openModal(r)} />
          </Tooltip>
          <Popconfirm
            title="هل أنت متأكد من حذف هذه العملة؟"
            description="لا يمكن الحذف إن كانت مستخدمة في محافظ أو معاملات."
            onConfirm={() => handleDelete(r._id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>إدارة العملات</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCurrencies}>تحديث</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>إضافة عملة</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={currencies}
        rowKey="_id"
        loading={loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: 'لا توجد عملات' }}
      />

      <Modal
        title={editingItem ? 'تعديل العملة' : 'إضافة عملة جديدة'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={saving}
        okText={editingItem ? 'تحديث' : 'إضافة'}
        cancelText="إلغاء"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="رمز العملة (ISO)"
            rules={[{ required: true, message: 'رمز العملة مطلوب' }, { pattern: /^[A-Z]{2,5}$/, message: 'رمز غير صالح (أحرف إنجليزية كبيرة فقط)' }]}
            normalize={(v) => v?.toUpperCase().trim()}
          >
            <Input placeholder="مثال: USD" maxLength={5} disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="nameAr"
            label="الاسم بالعربية"
            rules={[{ required: true, message: 'اسم العملة مطلوب' }]}
          >
            <Input placeholder="مثال: دولار" />
          </Form.Item>
          <Form.Item
            name="symbol"
            label="الرمز المختصر"
          >
            <Input placeholder="مثال: $" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="ترتيب العرض"
            rules={[{ required: true, message: 'ترتيب العرض مطلوب' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="مفعّلة"
            valuePropName="checked"
          >
            <Switch checkedChildren="نعم" unCheckedChildren="لا" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CurrenciesManagement;
