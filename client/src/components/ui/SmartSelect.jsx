import React, { useState, useRef } from 'react';
import { Select, Typography } from 'antd';

const { Text } = Typography;

/**
 * مكون Select ذكي يسمح بالكتابة والاختيار مع إمكانية إنشاء خيارات جديدة
 * 
 * @param {Array} options - قائمة الخيارات [{value, label}]
 * @param {any} value - القيمة الحالية
 * @param {Function} onChange - دالة عند تغيير القيمة
 * @param {string} placeholder - النص التوجيهي
 * @param {boolean} allowCreate - السماح بإنشاء خيارات جديدة
 * @param {boolean} mode - وضع Ant Select (tags, multiple, etc)
 * @param {object} rest - خصائص إضافية تمر لمكون Select
 */
const SmartSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'بحث...',
  allowCreate = false,
  mode,
  ...rest
}) => {
  const [localOptions, setLocalOptions] = useState(options);
  const inputRef = useRef(null);

  // مزامنة الـ options الخارجية مع الداخلية
  React.useEffect(() => {
    setLocalOptions((prev) => {
      // دمج الخيارات الجديدة مع القديمة مع الحفاظ على أي إضافات محلية
      const existingValues = new Set(prev.map((o) => o.value));
      const newItems = options.filter((o) => !existingValues.has(o.value));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [options]);

  const handleChange = (newValue, option) => {
    if (onChange) {
      onChange(newValue, option);
    }
  };

  const handleSearch = (searchValue) => {
    // في وضع tags، يتولى Ant Design الأمر تلقائياً
    if (mode === 'tags' || !allowCreate) return;
  };

  const handleBlur = (e) => {
    if (!allowCreate || mode === 'tags') return;
    const searchText = e?.target?.value || '';
    if (!searchText.trim()) return;

    const exists = localOptions.some(
      (opt) => opt.value?.toString().toLowerCase() === searchText.trim().toLowerCase()
    );
    if (!exists) {
      const newOption = { value: searchText.trim(), label: searchText.trim() };
      const updatedOptions = [...localOptions, newOption];
      setLocalOptions(updatedOptions);
      if (onChange) {
        onChange(searchText.trim(), newOption);
      }
    }
  };

  // إنشاء custom option tag عند التخصيص
  const tagRender = (props) => {
    if (!allowCreate) return null;
    const { label, value: val, closable, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          margin: '2px 4px 2px 0',
          padding: '2px 8px',
          background: '#e6f4ff',
          border: '1px solid #91caff',
          borderRadius: 4,
          fontSize: 13,
          fontFamily: 'Cairo, sans-serif',
        }}
        onMouseDown={onPreventMouseDown}
      >
        {label}
        {closable && (
          <span
            onClick={onClose}
            style={{
              marginRight: 6,
              cursor: 'pointer',
              color: '#1677ff',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            ×
          </span>
        )}
      </span>
    );
  };

  return (
    <Select
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      showSearch
      allowClear
      filterOption={(input, option) =>
        (option?.label ?? '')
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      notFoundContent={
        allowCreate ? (
          <div style={{ padding: '8px 0', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
            <Text type="secondary">اكتب قيمة جديدة للإضافة</Text>
          </div>
        ) : (
          <div style={{ padding: '8px 0', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
            <Text type="secondary">لا توجد نتائج</Text>
          </div>
        )
      }
      options={localOptions}
      mode={mode}
      tagRender={mode === 'tags' || mode === 'multiple' ? tagRender : undefined}
      onSearch={handleSearch}
      onBlur={handleBlur}
      style={{ width: '100%', fontFamily: 'Cairo, sans-serif' }}
      {...rest}
    />
  );
};

export default SmartSelect;
