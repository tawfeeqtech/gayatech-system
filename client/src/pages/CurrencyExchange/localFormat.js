// تنسيق العملات (نسخة محلية لتجنب تعارض bundler)
const fmtCurrency = (amount, currency = 'USD') => {
  const symbols = { USD: '$', ILS: '₪', SAR: '﷼', JOD: 'د.أ', EUR: '€' };
  const symbol = symbols[currency] || currency;
  try {
    return `${symbol} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return `${amount} ${symbol}`;
  }
};