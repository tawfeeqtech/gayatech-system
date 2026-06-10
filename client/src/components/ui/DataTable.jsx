import React, { useState } from 'react';
import { Table, Input, Button, Space, Tag, Tooltip, Card, Row, Col } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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
}) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value) => {
    setSearchText(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleRefresh = () => {
    setSearchText('');
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

      {/* الجدول */}
      <Table
        columns={tableColumns}
        dataSource={dataSource}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: onPageChange,
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
  );
};

export default DataTable;