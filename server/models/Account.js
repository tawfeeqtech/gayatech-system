const AccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
    // مثال: 'صندوق ريم', 'حساب الشركة', 'نقد'
  },
  
  accountType: {
    type: String,
    enum: ['بنك', 'محفظة رقمية', 'وسيط', 'نقد', 'أخرى'],
    required: true
  },
  
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // تفاصيل الحساب
  bankName: String,
  accountNumber: String,
  iban: String,
  
  // الرصيد المحسوب
  computedBalance: {
    type: Number,
    default: 0
  },
  
  // الحالة
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  description: String,
  notes: String,
  
  // آخر تحديث للرصيد
  lastBalanceUpdate: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});