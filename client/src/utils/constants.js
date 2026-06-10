// أنواع العملاء
export const CLIENT_TYPES = [
  { value: 'شركة', label: 'شركة' },
  { value: 'مؤسسة', label: 'مؤسسة' },
  { value: 'فرد', label: 'فرد' },
  { value: 'جهة حكومية', label: 'جهة حكومية' },
  { value: 'أخرى', label: 'أخرى' },
];

// حالات العميل
export const CLIENT_STATUSES = [
  { value: 'نشط', label: 'نشط', color: 'green' },
  { value: 'غير نشط', label: 'غير نشط', color: 'red' },
  { value: 'متوقف مؤقتاً', label: 'متوقف مؤقتاً', color: 'orange' },
  { value: 'محظور', label: 'محظور', color: 'red' },
];

// حالات العقد
export const CONTRACT_STATUSES = [
  { value: 'نشط', label: 'نشط', color: 'green' },
  { value: 'متوقف', label: 'متوقف', color: 'orange' },
  { value: 'منتهي', label: 'منتهي', color: 'default' },
  { value: 'ملغي', label: 'ملغي', color: 'red' },
];

// حالات المشروع
export const PROJECT_STATUSES = [
  { value: 'قيد التخطيط', label: 'قيد التخطيط', color: 'blue' },
  { value: 'قيد التنفيذ', label: 'قيد التنفيذ', color: 'processing' },
  { value: 'تحت المراجعة', label: 'تحت المراجعة', color: 'warning' },
  { value: 'مكتمل', label: 'مكتمل', color: 'green' },
  { value: 'تم التسليم', label: 'تم التسليم', color: 'success' },
  { value: 'متوقف', label: 'متوقف', color: 'orange' },
  { value: 'ملغي', label: 'ملغي', color: 'red' },
];

// أنواع المعاملات
export const TRANSACTION_TYPES = [
  { value: 'دخل', label: 'دخل', color: 'green' },
  { value: 'مصروف', label: 'مصروف', color: 'red' },
  { value: 'تحويل', label: 'تحويل', color: 'blue' },
];

// طبيعة المعاملة
export const TRANSACTION_NATURE = [
  { value: 'خارجي', label: 'خارجي' },
  { value: 'داخلي', label: 'داخلي' },
];

// العملات
export const CURRENCIES = [
  { value: 'USD', label: 'دولار ($)', symbol: '$' },
  { value: 'ILS', label: 'شيكل (₪)', symbol: '₪' },
  { value: 'SAR', label: 'ريال (﷼)', symbol: '﷼' },
  { value: 'JOD', label: 'دينار (د.أ)', symbol: 'د.أ' },
  { value: 'EUR', label: 'يورو (€)', symbol: '€' },
];

// وسائل الدفع
export const PAYMENT_METHODS = [
  { value: 'تحويل بنكي', label: 'تحويل بنكي' },
  { value: 'نقد', label: 'نقد' },
  { value: 'شيك', label: 'شيك' },
  { value: 'بطاقة ائتمان', label: 'بطاقة ائتمان' },
  { value: 'ريم', label: 'ريم' },
  { value: 'أخرى', label: 'أخرى' },
];

// حالات الموظف
export const EMPLOYEE_STATUSES = [
  { value: 'نشط', label: 'نشط', color: 'green' },
  { value: 'إجازة', label: 'إجازة', color: 'blue' },
  { value: 'متوقف', label: 'متوقف', color: 'orange' },
  { value: 'مستقيل', label: 'مستقيل', color: 'red' },
  { value: 'مفصول', label: 'مفصول', color: 'red' },
];

// أنواع الحسابات
export const ACCOUNT_TYPES = [
  { value: 'بنك', label: 'بنك' },
  { value: 'محفظة رقمية', label: 'محفظة رقمية' },
  { value: 'وسيط', label: 'وسيط' },
  { value: 'نقد', label: 'نقد' },
  { value: 'أخرى', label: 'أخرى' },
];

// أدوار المستخدمين
export const USER_ROLES = [
  { value: 'admin', label: 'مدير النظام', color: 'red' },
  { value: 'finance', label: 'مدير مالي', color: 'blue' },
  { value: 'pm', label: 'مدير مشاريع', color: 'green' },
  { value: 'accountant', label: 'محاسب', color: 'orange' },
  { value: 'employee', label: 'موظف', color: 'default' },
];

// ألوان المخططات البيانية
export const CHART_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

// حجم الصفحة الافتراضي
export const DEFAULT_PAGE_SIZE = 10;

// خيارات حجم الصفحة
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];