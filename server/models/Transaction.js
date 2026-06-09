const TransactionSchema = new mongoose.Schema({
  // رقم المعاملة
  transactionNumber: {
    type: String,
    unique: true
    // مثال: TRX-2026-0001
  },
  
  // نوع المعاملة
  type: {
    type: String,
    enum: ['دخل', 'مصروف', 'تحويل'],
    required: true
  },
  
  // طبيعة الحركة (لمنع ازدواجية الإيرادات)
  nature: {
    type: String,
    enum: ['خارجي', 'داخلي'],
    required: true
  },
  
  // المبلغ والعملة
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    required: true
  },
  
  // الحسابات
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
    // null إذا كان المصدر خارجياً
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
    // null إذا كان الوجهة خارجية
  },
  
  // التاريخ
  transactionDate: {
    type: Date,
    required: true
  },
  
  // العلاقات (اختيارية حسب النوع)
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  contractMonth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContractMonth'
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  expenseCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory'
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  
  // التوزيعات (للدفعات الموزعة على عدة فواتير)
  allocations: [{
    contractMonth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContractMonth'
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    amount: {
      type: Number,
      required: true
    },
    description: String
  }],
  
  // وسيلة الدفع / التحصيل
  paymentMethod: {
    type: String,
    enum: ['تحويل بنكي', 'نقد', 'شيك', 'بطاقة ائتمان', 'ريم', 'أخرى'],
    default: 'تحويل بنكي'
  },
  
  // الحالة
  status: {
    type: String,
    enum: ['مكتمل', 'معلق', 'ملغي', 'قيد المراجعة'],
    default: 'مكتمل'
  },
  
  // مرفقات
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  description: {
    type: String,
    maxlength: 500
  },
  notes: String,
  tags: [String],
  
  // معلومات إضافية للتحويلات
  exchangeRate: {
    type: Number
    // إذا كانت المعاملة بعملة مختلفة عن الحساب
  },
  originalAmount: {
    type: Number
  },
  originalCurrency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// المؤشرات
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ type: 1, transactionDate: -1 });
TransactionSchema.index({ client: 1, transactionDate: -1 });
TransactionSchema.index({ fromAccount: 1, transactionDate: -1 });
TransactionSchema.index({ toAccount: 1, transactionDate: -1 });
TransactionSchema.index({ contractMonth: 1 });
TransactionSchema.index({ invoice: 1 });
TransactionSchema.index({ nature: 1, type: 1 });

// Middleware: توليد رقم المعاملة
TransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date(this.transactionDate).getFullYear();
    const count = await this.constructor.countDocuments({
      transactionNumber: new RegExp(`TRX-${year}`)
    });
    this.transactionNumber = `TRX-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // تعيين الطبيعة تلقائياً
  if (this.type === 'تحويل') {
    this.nature = 'داخلي';
  } else {
    this.nature = 'خارجي';
  }
  
  next();
});