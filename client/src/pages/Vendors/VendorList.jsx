import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import vendorAPI from '../../api/vendors';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form] = Form.useForm();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.getAll();
      setVendors(res.data.data.vendors);
    } catch (e) {
      message.error('فشل في جلب المزودين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAdd = () => {
    setEditingVendor(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    form.setFieldsValue(vendor);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await vendorAPI.delete(id);
      message.success('تم الحذف بنجاح');
      fetchVendors();
    } catch (e) {
      message.error('فشل الحذف');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingVendor) {
        await vendorAPI.update(editingVendor._id, values);
        message.success('تم التحديث بنجاح');
      } else {
        await vendorAPI.create(values);
        message.success('تمت الإضافة بنجاح');
      }
      setModalVisible(false);
      fetchVendors();
    } catch (e) {
      message.error('فشل الحفظ');
    }
  };

  const columns = [
    { title: 'الاسم', dataIndex: 'name', key: 'name' },
    { title: 'التصنيف', dataIndex: 'category', key: 'category' },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone' },
    { title: 'البريد', dataIndex: 'email', key: 'email' },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>إدارة المزودين</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>إضافة مزود</Button>
      </div>

      <Card>
        <Table dataSource={vendors} columns={columns} rowKey="_id" loading={loading} />
      </Card>

      <Modal
        title={editingVendor ? 'تعديل مزود' : 'إضافة مزود'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="التصنيف" rules={[{ required: true }]}>
            <Input placeholder="مثال: أدوات مكتبية، خدمات سحابية" />
          </Form.Item>
          <Form.Item name="phone" label="رقم الهاتف">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="البريد الإلكتروني">
            <Input />
          </Form.Item>
          <Form.Item name="openingBalance" label="الرصيد الافتتاحي">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="ملاحظات">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorList;
