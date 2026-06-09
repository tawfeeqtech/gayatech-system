const ClientSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    country: {
      type: String,
      default: 'فلسطين'
    }
  },
  
  // التصنيف
  clientType: {
    type: String,
    enum: ['شركة', 'مؤسسة', 'فرد', 'جهة حكومية', 'أخرى'],
    default: 'شركة'
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomeSource'
  },
  
  // الحالة
  status: {
    type: String,
    enum: ['نشط', 'غير نشط', 'متوقف مؤقتاً', 'محظور'],
    default: 'نشط'
  },
  
  // معلومات إضافية
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [String],
  
  // العملة المفضلة للتعامل
  preferredCurrency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // مؤشرات محسوبة (تحدث تلقائياً)
  computedStats: {
    totalContracts: { type: Number, default: 0 },
    activeContracts: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    totalInvoiced: { type: Number, default: 0 },      // إجمالي الفواتير
    totalPaid: { type: Number, default: 0 },           // إجمالي المدفوع
    balance: { type: Number, default: 0 },             // الرصيد (مدفوع - فواتير)
    lastTransactionDate: Date
  },
  
  // سجل التدقيق
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// المؤشرات
ClientSchema.index({ name: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ email: 1 }, { sparse: true });
ClientSchema.index({ phone: 1 }, { sparse: true });

// Virtual: اسم عرض العميل
ClientSchema.virtual('displayName').get(function() {
  return this.company ? `${this.name} - ${this.company}` : this.name;
});