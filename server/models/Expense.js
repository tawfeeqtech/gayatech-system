const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  // رقم المصروف
  expenseNumber: {
    type: String,
    unique: true,
    sparse: true
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

ExpenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    try {
      const year = this.expenseDate ? this.expenseDate.getFullYear() : new Date().getFullYear();
      const lastExpense = await this.constructor.findOne({
        expenseNumber: new RegExp(`^EXP-${year}-`)
      }).sort({ expenseNumber: -1 });
      
      let nextNumber = 1;
      if (lastExpense && lastExpense.expenseNumber) {
        const parts = lastExpense.expenseNumber.split('-');
        nextNumber = parseInt(parts[parts.length - 1]) + 1;
      }
      
      this.expenseNumber = `EXP-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      this.expenseNumber = `EXP-${Date.now()}`;
    }
  }
  next();
});
module.exports = mongoose.model('Expense', ExpenseSchema);
