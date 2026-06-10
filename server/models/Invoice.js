const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // رقم الفاتورة
  invoiceNumber: {
    type: String,
    unique: true
    // مثال: INV-2026-0001
  },
  
  // العلاقات
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // نوع الفاتورة
  invoiceType: {
    type: String,
    enum: ['مشروع', 'خدمة', 'عقد شهري', 'استقطاب', 'متجر', 'أخرى'],
    required: true
  },
  
  // المبلغ
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // التواريخ
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // حالة التحصيل
  status: {
    type: String,
    enum: [
      'مسودة',
      'مصدرة',
      'مدفوعة جزئياً',
      'مدفوعة',
      'متأخرة',
      'ملغاة'
    ],
    default: 'مسودة'
  },
  
  // المدفوعات
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
    // يحسب تلقائياً
  },
  
  // الدفعات المرتبطة
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  
  // تفاصيل الفاتورة
  items: [{
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: Number,
    totalPrice: Number
  }],
  
  notes: String,
  terms: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

InvoiceSchema.index({ client: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });

InvoiceSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  if (this.paidAmount >= this.totalAmount && this.status !== 'ملغاة') {
    this.status = 'مدفوعة';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = 'مدفوعة جزئياً';
  } else if (new Date() > this.dueDate && this.paidAmount === 0) {
    this.status = 'متأخرة';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
