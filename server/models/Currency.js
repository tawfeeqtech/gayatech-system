const mongoose = require('mongoose');

// نموذج العملة - مصدر موحد لكل العملات في النظام
// يُستخدم لجلب قائمة العملات في كل النماذج (عميل، عقد، مشروع، فاتورة، معاملة...)
const CurrencySchema = new mongoose.Schema({
  // رمز العملة الدولي (ISO 4217) - مثل USD, ILS, SAR, JOD, EUR
  code: {
    type: String,
    required: [true, 'رمز العملة مطلوب'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 5
  },
  // الاسم بالعربية - مثل 'دولار', 'شيكل', 'ريال', 'دينار', 'يورو'
  nameAr: {
    type: String,
    required: [true, 'اسم العملة بالعربية مطلوب'],
    trim: true
  },
  // رمز العملة للعرض - مثل '$', '₪', '﷼', 'د.أ', '€'
  symbol: {
    type: String,
    default: '',
    trim: true
  },
  // هل العملة مفعّلة (تظهر في القوائم)
  isActive: {
    type: Boolean,
    default: true
  },
  // ترتيب العرض
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

CurrencySchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Currency', CurrencySchema);
