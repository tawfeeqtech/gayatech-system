import React, { useState } from 'react';
import { Table, Input, Button, Space, Tag, Tooltip, Card, Row, Col, Popconfirm } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteFilled,
  EditFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import BulkEditModal from './BulkEditModal';

/**
 * مكون جدول بيانات موحد
 * 
 * @param {Array} columns - تعريف الأعمدة
 * @param {Array} dataSource - مصدر البيانات
 * @param {Number} loading - حالة التحميل
 * @param {Number} total - إجمالي النتائج
 * @param {Number} page - الصفحة الحالية
 * @param {Number} pageSize - حجم الصفحة
 * @param {Function} onPageChange - تغيير الصفحة
 * @param {String} searchPlaceholder - نص البحث
 * @param {Function} onSearch - دالة البحث
 * @param {String} addPath - مسار صفحة الإضافة
 * @param {String} editPath - مسار صفحة التعديل (يضاف له /:id)
 * @param {String} detailPath - مسار صفحة التفاصيل (يضاف له /:id)
 * @param {Function} onDelete - دالة الحذف
 * @param {Function} onExport - دالة التصدير
 * @param {Function} onRefresh - دالة التحديث
 * @param {String} title - عنوان الجدول
 * @param {Array} filters - أزرار فلترة إضافية
 * @param {Boolean} showActions - إظهار عمود الإجراءات
 * @param {Array} customActions - إجراءات مخصصة
 * @param {Boolean} rowSelection - تفعيل تحديد الصفوف (checkbox)
 * @param {Function} onBulkDelete - دالة الحذف الجماعي (تستقبل مصفوفة الـ ids)
 * @param {Function} onBulkAction - إجراء جماعي مخصص (تستقبل مصفوفة الـ ids)
 * @param {String} bulkActionLabel - نص زر الإجراء الجماعي المخصص
 */
const DataTable = ({
  columns = [],
  dataSource = [],
  loading = false,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  searchPlaceholder = 'بحث...',
  onSearch,
  addPath,
  editPath,
  detailPath,
  onDelete,
  onExport,
  onRefresh,
  title,
  filters,
  showActions = true,
  customActions,
  rowSelection = false,
  onBulkDelete,
  onBulkAction,
  bulkActionLabel = 'تعديل الكل',
  onBulkEdit,
  bulkEditLabel = 'تعديل المحدد',
}) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkEditVisible, setBulkEditVisible] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  const handleSearch = (value) => {
    setSearchText(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleRefresh = () => {
    setSearchText('');
    setSelectedRowKeys([]);
    if (onRefresh) onRefresh();
  };

  // عمود الإجراءات الافتراضي
  const actionsColumn = showActions
    ? {
        title: 'الإجراءات',
        key: 'actions',
        width: 120,
        fixed: 'left',
        render: (_, record) => (
          <Space size="small">
            {detailPath && (
              <Tooltip title="عرض التفاصيل">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ color: '#3b82f6' }} />}
                  onClick={() => navigate(`${detailPath}/${record._id}`)}
                />
              </Tooltip>
            )}
            {editPath && (
              <Tooltip title="تعديل">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#10b981' }} />}
                  onClick={() => navigate(`${editPath}/${record._id}`)}
                />
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="حذف">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record)}
                />
              </Tooltip>
            )}
            {customActions && customActions(record)}
          </Space>
        ),
      }
    : null;

  // دمج الأعمدة مع عمود الإجراءات
  const tableColumns = showActions
    ? [actionsColumn, ...columns]
    : columns;

  // إعدادات تحديد الصفوف
  const rowSelectionConfig = rowSelection
    ? {
        type: 'checkbox',
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        preserveSelectedRowKeys: true,
        selections: [
          Table.SELECTION_ALL,
          Table.SELECTION_INVERT,
          Table.SELECTION_NONE,
        ],
      }
    : undefined;

  // حذف جماعي
  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedRowKeys.length === 0) return;
    setBulkDeleteLoading(true);
    try {
      await onBulkDelete(selectedRowKeys);
      setSelectedRowKeys([]);
    } catch {
      // الخطأ يتم معالجته في الدالة المسندة
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // إجراء جماعي مخصص
  const handleBulkAction = async () => {
    if (!onBulkAction || selectedRowKeys.length === 0) return;
    setBulkActionLoading(true);
    try {
      await onBulkAction(selectedRowKeys);
      setSelectedRowKeys([]);
    } catch {
      // الخطأ يتم معالجته في الدالة المسندة
    } finally {
      setBulkActionLoading(false);
    }
  };

  // تعديل جماعي
  const handleBulkEdit = async ({ field, value }) => {
    if (!onBulkEdit || selectedRowKeys.length === 0) return;
    setBulkEditLoading(true);
    try {
      await onBulkEdit(selectedRowKeys, field, value);
      setBulkEditVisible(false);
      setSelectedRowKeys([]);
    } catch {
      // الخطأ يتم معالجته في الدالة المسندة
    } finally {
      setBulkEditLoading(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* الشريط العلوي */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16 }}
        align="middle"
        justify="space-between"
      >
        {/* العنوان والبحث */}
        <Col xs={24} md={16}>
          <Space size="middle" wrap>
            {title && (
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                {title}
              </span>
            )}
            {onSearch && (
              <Input.Search
                placeholder={searchPlaceholder}
                allowClear
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
                style={{ width: 250, fontFamily: 'Cairo, sans-serif' }}
              />
            )}
          </Space>
        </Col>

        {/* أزرار الإجراءات */}
        <Col xs={24} md={8} style={{ textAlign: 'left' }}>
          <Space>
            {filters}
            {onRefresh && (
              <Tooltip title="تحديث">
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
              </Tooltip>
            )}
            {onExport && (
              <Tooltip title="تصدير">
                <Button
                  icon={<ExportOutlined />}
                  onClick={onExport}
                >
                  تصدير
                </Button>
              </Tooltip>
            )}
            {addPath && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(addPath)}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                إضافة جديد
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* أزرار الفلترة */}
      {filters && <div style={{ marginBottom: 16 }}>{filters}</div>}

      {/* شريط الإجراءات للصفوف المحددة */}
      {rowSelection && selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 16px',
            background: '#f0f5ff',
            border: '1px solid #d6e4ff',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'Cairo, sans-serif', color: '#1d39c4' }}>
            تم تحديد <strong>{selectedRowKeys.length}</strong> صف
          </span>
          <Space>
            {onBulkDelete && (
              <Popconfirm
                title="تأكيد الحذف الجماعي"
                description={`هل أنت متأكد من حذف ${selectedRowKeys.length} عنصر؟`}
                onConfirm={handleBulkDelete}
                okText="نعم"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteFilled />}
                  loading={bulkDeleteLoading}
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  حذف المحدد
                </Button>
              </Popconfirm>
            )}
            {onBulkEdit && (
              <Button
                icon={<EditFilled />}
                onClick={() => setBulkEditVisible(true)}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {bulkEditLabel}
              </Button>
            )}
            {onBulkAction && (
              <Button
                type="primary"
                onClick={handleBulkAction}
                loading={bulkActionLoading}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {bulkActionLabel}
              </Button>
            )}
            <Button
              size="small"
              onClick={() => setSelectedRowKeys([])}
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              إلغاء التحديد
            </Button>
          </Space>
        </div>
      )}

      {/* الجدول */}
      <Table
        columns={tableColumns}
        dataSource={dataSource}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 800 }}
        rowSelection={rowSelectionConfig}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, ps) => {
            setSelectedRowKeys([]);
            if (onPageChange) onPageChange(p, ps);
          },
          showSizeChanger: true,
          showTotal: (total, range) =>
            `عرض ${range[0]}-${range[1]} من إجمالي ${total}`,
          style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
        }}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontFamily: 'Cairo, sans-serif', color: '#94a3b8' }}>
                لا توجد بيانات للعرض
              </div>
            </div>
          ),
        }}
      />
    </Card>
    {onBulkEdit && (
      <BulkEditModal
        visible={bulkEditVisible}
        onCancel={() => setBulkEditVisible(false)}
        onConfirm={handleBulkEdit}
        selectedCount={selectedRowKeys.length}
        columns={tableColumns}
        loading={bulkEditLoading}
      />
    )}
  );
};

export default DataTable;