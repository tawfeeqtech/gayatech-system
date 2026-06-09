const ContractMonthSchema = new mongoose.Schema({
  // العلاقات
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // معلومات الشهر
  month: {
    type: String,
    required: true
    // تنسيق: '2026-06'
  },
  monthName: {
    type: String
    // مثال: 'يونيو 2026' (يُملأ تلقائياً)
  },
  
  // القيمة المالية لهذا الشهر بالتحديد
  value: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    required: true
  },
  
  // حالة السداد
  status: {
    type: String,
    enum: [
      'pending_review',  // بانتظار المراجعة (تلقائي غير مؤكد)
      'confirmed',       // مؤكد بانتظار الدفع
      'paid',            // مدفوع
      'partially_paid',  // مدفوع جزئياً
      'overdue',         // متأخر
      'cancelled',       // ملغي
      'paused'           // معلق (الشهر متوقف)
    ],
    default: 'pending_review'
  },
  
  // التواريخ
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  
  // المدفوعات
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
    // يُحسب تلقائياً: value - paidAmount
  },
  
  // الموظفون المشاركون هذا الشهر
  assignedEmployees: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    role: String,
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // الفاتورة المرتبطة (إن وجدت)
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // مصدر التوليد
  generationType: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },
  
  // ملاحظات
  notes: String,
  
  // هل تم تأكيد المراجعة؟
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// المؤشرات
ContractMonthSchema.index({ contract: 1, month: 1 }, { unique: true });
ContractMonthSchema.index({ client: 1, status: 1 });
ContractMonthSchema.index({ dueDate: 1, status: 1 });
ContractMonthSchema.index({ status: 1 });

// Middleware: حساب المتبقي تلقائياً
ContractMonthSchema.pre('save', function(next) {
  this.remainingAmount = this.value - this.paidAmount;
  
  // تحويل الشهر إلى اسم مقروء
  if (this.month) {
    const [year, monthNum] = this.month.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    this.monthName = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  }
  
  // تحديث الحالة بناءً على الدفع
  if (this.paidAmount >= this.value && this.status !== 'cancelled') {
    this.status = 'paid';
    this.paidDate = this.paidDate || new Date();
  } else if (this.paidAmount > 0 && this.paidAmount < this.value && this.status !== 'cancelled') {
    this.status = 'partially_paid';
  }
  
  next();
});