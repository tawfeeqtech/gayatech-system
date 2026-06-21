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
      className="shadow-sm border-slate-200"
      bodyStyle={{ padding: '0' }}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Search */}
        <div className="flex items-center gap-4 flex-wrap">
          {title && (
            <h3 className="text-lg font-bold text-slate-800 m-0">
              {title}
            </h3>
          )}
          {onSearch && (
            <Input
              placeholder={searchPlaceholder}
              allowClear
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onPressEnter={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined className="text-slate-400" />}
              className="w-full md:w-64 rounded-lg border-slate-200"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Space size="small">
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
        </div>
      </div>

      {/* Filters Section (Optional) */}
      {filters && (
        <div className="p-4 border-b border-slate-100 bg-white">
          {filters}
        </div>
      )}

      {/* Table */}
      <Table
        columns={tableColumns}
        dataSource={dataSource}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 800 }}
        className="modern-table"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: onPageChange,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `عرض ${range[0]} إلى ${range[1]} من إجمالي ${total}`,
          style: { padding: '16px', margin: 0, borderTop: '1px solid #f1f5f9' },
        }}
        locale={{
          emptyText: (
            <div className="py-12 flex flex-col items-center">
              <div className="text-5xl mb-4 text-slate-200">📭</div>
              <div className="text-slate-400 font-medium">
                لا توجد بيانات متاحة حالياً
              </div>
            </div>
          ),
        }}
      />
    </Card>
  );
};

export default DataTable;