const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true
  },
  vendorRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  serviceName: {
    type: String,
    required: true
  },
  category: {
    type: String
    // 'برمجيات', 'استضافة', 'أدوات', 'خدمات سحابية', 'أخرى'
  },
  
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  renewalType: {
    type: String,
    enum: ['شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي', 'مرة واحدة'],
    default: 'سنوي'
  },
  
  billingPreference: {
    type: String,
    enum: ['بداية الفترة', 'تاريخ الاستحقاق'],
    default: 'تاريخ الاستحقاق'
  },

  status: {
    type: String,
    enum: ['نشط', 'منتهي', 'ملغي', 'بانتظار التجديد'],
    default: 'نشط'
  },
  
  // الفواتير المرتبطة
  invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],

  // هل الفاتورة الحالية مدفوعة
  isPaid: {
    type: Boolean,
    default: false
  },

  // تنبيهات
  reminderDays: {
    type: [Number],
    default: [30, 14, 7, 3, 1]
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

SubscriptionSchema.index({ endDate: 1, status: 1 });
SubscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
