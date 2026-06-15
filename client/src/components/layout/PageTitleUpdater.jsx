import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { pageTitles } from '../../config/pageTitles';

const PageTitleUpdater = () => {
  const location = useLocation();

  // دالة ذكية للبحث عن العنوان المطابق أو الأقرب للمسار الحالي
  const getTitle = () => {
    const path = location.pathname;

    // 1. إذا كان المسار مطابقاً تماماً في القاموس
    if (pageTitles[path]) {
      return pageTitles[path];
    }

    // 2. إذا كان رابطاً فرعياً (مثال: /contracts/edit/5) نبحث عن الأب المشترك
    const matchingKey = Object.keys(pageTitles)
      .reverse() // العكس للتأكد من مطابقة المسارات الأكثر تخصيصاً أولاً
      .find(key => key !== '/' && path.startsWith(key));

    return matchingKey ? pageTitles[matchingKey] : 'الرئيسية';
  };

  return (
    <Helmet>
      <title>{`غايتك | ${getTitle()}`}</title>
    </Helmet>
  );
};

export default PageTitleUpdater;