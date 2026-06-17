const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // الشهر
  month: {
    type: String,
    required: true
    // '2026-06'
  },
  
  // المبلغ
  baseAmount: {
    type: Number,
    required: true
  },

  // بنود الخصم التفصيلية
  deductionItems: [{
    amount: Number,
    reason: String,
    advance: { type: mongoose.Schema.Types.ObjectId, ref: 'Advance' },
    date: { type: Date, default: Date.now }
  }],

  deductions: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number
    // baseAmount - deductions + bonuses
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // حالة الدفع
  status: {
    type: String,
    enum: ['مستحق', 'مدفوع', 'مدفوع جزئياً', 'معلق'],
    default: 'مستحق'
  },
  
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
  },
  
  // تاريخ الدفع
  paymentDate: Date,
  
  // الفاتورة المرتبطة
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  // المعاملة المرتبطة
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

SalarySchema.index({ employee: 1, month: 1 });
SalarySchema.index({ status: 1 });

SalarySchema.pre('save', function(next) {
  // حساب إجمالي الخصومات من البنود
  if (this.deductionItems && this.deductionItems.length > 0) {
    this.deductions = this.deductionItems.reduce((acc, item) => acc + item.amount, 0);
  }

  this.totalAmount = this.baseAmount - this.deductions + this.bonuses;
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'مدفوع';
  } else if (this.paidAmount > 0) {
    this.status = 'مدفوع جزئياً';
  }
  
  next();
});

module.exports = mongoose.model('Salary', SalarySchema);
