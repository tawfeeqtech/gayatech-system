import { useState, useEffect } from 'react';
import currencyAPI from '../api/currencies';
import { CURRENCIES as FALLBACK } from '../utils/constants';

// خريطة ذاكرة مؤقتة بسيطة — جلب مرة واحدة لكل الجلسة
let _cache = null;
let _loading = false;
let _listeners = [];

const notifyListeners = (data) => {
  _listeners.forEach((fn) => fn(data));
};

/**
 * hook لجلب العملات المفعّلة من قاعدة البيانات مرة واحدة.
 * يعيد { currencies, loading, refresh }
 * - currencies: مصفوفة [{ value, label, symbol }] جاهزة لـ <Select options={currencies} />
 * - loading: حالة التحميل
 * - refresh: لإعادة الجلب (بعد إضافة/تعديل/حذف عملة في صفحة الإدارة)
 */
export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState(() => _cache || []);
  const [loading, setLoading] = useState(() => (!_cache && _loading));

  const refresh = () => {
    _cache = null; // إبطال الذاكرة المؤقتة
    _loadCurrencies();
  };

  useEffect(() => {
    // التسجيل كمستمع للتحديثات العالمية
    const listener = (data) => setCurrencies(data);
    _listeners.push(listener);

    // جلب فقط إن لم يكن في الذاكرة المؤقتة
    if (!_cache) {
      _loadCurrencies();
    }

    return () => {
      _listeners = _listeners.filter((fn) => fn !== listener);
    };
  }, []);

  return { currencies, loading, refresh };
};

const _loadCurrencies = async () => {
  if (_loading) return;
  _loading = true;

  // إبلاغ المستمعين بحالة التحميل
  _listeners.forEach((fn) => {
    if (fn.setState) fn.setState({ loading: true });
  });

  try {
    const res = await currencyAPI.getActive();
    const raw = res.data.data.currencies || [];

    // تحويل الصيغة لتكون متوافقة مع <Select options={}>
    // [{ value: 'USD', label: 'دولار ($)', symbol: '$' }, ...]
    const mapped = raw.map((c) => ({
      value: c.code,
      label: `${c.nameAr} (${c.symbol})`,
      symbol: c.symbol,
    }));

    _cache = mapped;
    _loading = false;

    // إبلاغ كل المستمعين بالبيانات الجديدة
    notifyListeners(mapped);
  } catch {
    // في حال فشل الـ API، نستخدم القائمة الاحتياطية
    if (!_cache) {
      _cache = FALLBACK;
    }
    _loading = false;
    notifyListeners(_cache);
  }
};

// دالة لإبطال الذاكرة المؤقتة (تُستدعى بعد إضافة/تعديل/حذف عملة)
export const invalidateCurrenciesCache = () => {
  _cache = null;
  _loadCurrencies();
};

export default useCurrencies;
