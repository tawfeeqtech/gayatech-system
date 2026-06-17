// تنسيق العملات
export const formatCurrency = (amount, currency = 'USD', customSymbol = null) => {
  const symbols = {
    USD: '$',
    ILS: '₪',
    SAR: '﷼',
    JOD: 'د.أ',
    EUR: '€',
  };

  const symbol = customSymbol || symbols[currency] || currency;

  try {
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // وضع الرمز قبل أو بعد المبلغ حسب العملة (اختياري، هنا سنبقيها بسيطة)
    return `${symbol} ${formattedAmount}`;
  } catch {
    return `${amount} ${symbol}`;
  }
};

// تنسيق التاريخ
export const formatDate = (date, format = 'ar') => {
  if (!date) return '—';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (format === 'ar') {
    return d.toLocaleDateString('ar-SA', options);
  }
  return d.toLocaleDateString('en-US', options);
};

// تنسيق التاريخ والوقت
export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// تنسيق الشهر (2026-06 → يونيو 2026)
export const formatMonth = (monthStr) => {
  if (!monthStr) return '—';
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// اختصار الأرقام الكبيرة
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toString() || '0';
};

// تنسيق نسبة مئوية
export const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

// لون الرصيد
export const getBalanceColor = (balance) => {
  if (balance > 0) return '#10b981';
  if (balance < 0) return '#ef4444';
  return '#94a3b8';
};