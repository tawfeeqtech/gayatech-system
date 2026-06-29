import React, { useState, useRef, useEffect } from 'react';
import { Select, Typography, Divider, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * مكون Select ذكي يسمح بالكتابة والاختيار مع إمكانية إنشاء خيارات جديدة
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
  const searchTextRef = useRef('');

  // مزامنة الـ options الخارجية مع الداخلية
  // ⚠️ نستبدل بالكامل إذا تغيرت القيم (ليس مجرد إضافة)
  // ⚠️ لكن لا نمسح الخيارات التي أنشأها المستخدم إذا كانت options فارغة
  useEffect(() => {
    const incomingKeys = new Set(options.map((o) => o.value));
    const localKeys = new Set(localOptions.map((o) => o.value));
    const isSame =
      incomingKeys.size === localKeys.size &&
      [...incomingKeys].every((k) => localKeys.has(k));
    if (isSame) return;

    // إذا كانت options الجديدة فارغة والمستخدم لديه خيارات — احتفظ بها
    if (options.length === 0 && localOptions.length > 0) return;

    // دمج: احتفظ بالخيارات التي أنشأها المستخدم + أضف الجديدة
    const merged = [...options];
    for (const opt of localOptions) {
      if (!merged.some((m) => m.value === opt.value)) {
        merged.push(opt);
      }
    }
    setLocalOptions(merged);
  }, [options]);

  const handleSearch = (searchValue) => {
    searchTextRef.current = searchValue;
  };

  const handleCreateNew = () => {
    const searchValue = searchTextRef.current.trim();
    if (!searchValue) return;

    const exists = localOptions.some(
      (opt) => opt.value?.toString().toLowerCase() === searchValue.toLowerCase()
    );
    if (exists) return;

    const newOption = { value: searchValue, label: searchValue };
    setLocalOptions((prev) => [...prev, newOption]);
    if (onChange) {
      onChange(searchValue, newOption);
    }
    searchTextRef.current = '';
  };

  // زر الإضافة في قاع القائمة المنسدلة
  const popupRender = (menu) => {
    const searchValue = searchTextRef.current.trim();
    if (!allowCreate || !searchValue) return menu;

    const exists = localOptions.some(
      (opt) => opt.value?.toString().toLowerCase() === searchValue.toLowerCase()
    );
    if (exists) return menu;

    return (
      <div>
        {menu}
        <Divider style={{ margin: '4px 0' }} />
        <Button
          type="text"
          block
          icon={<PlusOutlined />}
          onClick={handleCreateNew}
          style={{
            textAlign: 'right',
            fontFamily: 'Cairo, sans-serif',
            height: 36,
            padding: '4px 12px',
          }}
        >
          إضافة "{searchValue}"
        </Button>
      </div>
    );
  };

  return (
    <Select
      value={value}
      onChange={(v, opt) => { if (onChange) onChange(v, opt); }}
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
      popupRender={allowCreate ? popupRender : undefined}
      onSearch={handleSearch}
      style={{ width: '100%', fontFamily: 'Cairo, sans-serif' }}
      {...rest}
    />
  );
};

export default SmartSelect;
