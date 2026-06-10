const mongoose = require('mongoose');

const AdvanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // التاريخ
  requestDate: {
    type: Date,
    required: true
  },
  expectedRepaymentDate: Date,
  
  // السداد
  repaidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
  },
  
  // الحالة
  status: {
    type: String,
    enum: ['معلقة', 'موافق عليها', 'مرفوضة', 'مسددة', 'مسددة جزئياً'],
    default: 'معلقة'
  },
  
  // طريقة السداد
  repaymentMethod: {
    type: String,
    enum: ['خصم من الراتب', 'دفعة واحدة', 'أقساط', 'أخرى'],
    default: 'خصم من الراتب'
  },
  
  // المعاملة المرتبطة
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  reason: String,
  notes: String,
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

AdvanceSchema.index({ employee: 1, status: 1 });

AdvanceSchema.pre('save', function(next) {
  this.remainingAmount = this.amount - this.repaidAmount;
  
  if (this.repaidAmount >= this.amount) {
    this.status = 'مسددة';
  } else if (this.repaidAmount > 0) {
    this.status = 'مسددة جزئياً';
  }
  
  next();
});

module.exports = mongoose.model('Advance', AdvanceSchema);
