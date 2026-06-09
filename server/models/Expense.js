const ExpenseSchema = new mongoose.Schema({
  // رقم المصروف
  expenseNumber: {
    type: String,
    unique: true
  },
  
  // العلاقات
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // المبلغ
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // التاريخ
  expenseDate: {
    type: Date,
    required: true
  },
  
  // التفاصيل
  description: {
    type: String,
    required: true
  },
  vendor: String,     // المزود/البائع
  receipt: String,    // رقم الإيصال
  
  // وسيلة الدفع
  paymentMethod: {
    type: String,
    enum: ['تحويل بنكي', 'نقد', 'شيك', 'بطاقة ائتمان', 'أخرى'],
    default: 'تحويل بنكي'
  },
  
  // من أي حساب تم الدفع
  paidFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  
  // هل هو مصروف متكرر؟
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['يومي', 'أسبوعي', 'شهري', 'ربع سنوي', 'سنوي']
    },
    nextDueDate: Date,
    endDate: Date
  },
  
  // مرفقات
  attachments: [{
    filename: String,
    originalName: String,
    path: String
  }],
  
  status: {
    type: String,
    enum: ['مدفوع', 'معلق', 'ملغي'],
    default: 'مدفوع'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });