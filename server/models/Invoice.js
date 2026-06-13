const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // رقم الفاتورة
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
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
  contractMonth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContractMonth'
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

InvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const year = this.issueDate ? this.issueDate.getFullYear() : new Date().getFullYear();
      const lastInvoice = await this.constructor.findOne({
        invoiceNumber: new RegExp(`^INV-${year}-`)
      }).sort({ invoiceNumber: -1 });
      
      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const parts = lastInvoice.invoiceNumber.split('-');
        nextNumber = parseInt(parts[parts.length - 1]) + 1;
      }
      
      this.invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      this.invoiceNumber = `INV-${Date.now()}`;
    }
  }
  
  // حساب المتبقي
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // تحديث الحالة
  if (this.paidAmount >= this.totalAmount && this.status !== 'ملغاة') {
    this.status = 'مدفوعة';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = 'مدفوعة جزئياً';
  } else if (this.dueDate && new Date() > this.dueDate && this.paidAmount === 0 && this.status !== 'مسودة') {
    this.status = 'متأخرة';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
