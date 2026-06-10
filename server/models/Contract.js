const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  // رقم العقد (تلقائي)
  contractNumber: {
    type: String,
    unique: true,
    sparse: true
    // مثال: CONT-2026-0001
  },
  
  // العلاقات
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // معلومات العقد
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  serviceType: {
    type: String,
    required: true
    // مثال: 'تسويق رقمي', 'إدارة مواقع', 'تصميم جرافيك', 'استشارات'
  },
  
  // القيمة الافتراضية للشهر (يمكن تغييرها شهرياً)
  defaultMonthlyValue: {
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
    // null = مفتوح (مستمر حتى إشعار آخر)
  },
  
  // تاريخ الاستحقاق الشهري (أي يوم من الشهر)
  dueDayOfMonth: {
    type: Number,
    default: 10,
    min: 1,
    max: 31
  },
  
  // الحالة
  status: {
    type: String,
    enum: ['نشط', 'متوقف', 'منتهي', 'ملغي'],
    default: 'نشط'
  },
  
  // إعدادات التوليد التلقائي للفواتير الشهرية
  autoGeneration: {
    enabled: {
      type: Boolean,
      default: true
    },
    dayOfMonth: {
      type: Number,
      default: 1,
      min: 1,
      max: 28  // لتجنب مشكلة 29-31 في بعض الشهور
    },
    autoConfirm: {
      type: Boolean,
      default: false  // false = تحتاج مراجعة يدوية
    },
    reminderDays: {
      type: [Number],
      default: [25]  // إشعار قبل 25 من الشهر
    },
    lastGeneratedMonth: {
      type: String
      // مثال: '2026-06'
    }
  },
  
  // مؤشرات محسوبة
  computedStats: {
    totalMonths: { type: Number, default: 0 },
    paidMonths: { type: Number, default: 0 },
    pendingMonths: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalRemaining: { type: Number, default: 0 }
  },
  
  // سجل التغييرات
  changeLog: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// مؤشرات
ContractSchema.index({ client: 1, status: 1 });
ContractSchema.index({ status: 1 });

// توليد رقم العقد تلقائياً
ContractSchema.pre('save', async function(next) {
  if (this.isNew && !this.contractNumber) {
    try {
      const year = this.startDate ? this.startDate.getFullYear() : new Date().getFullYear();
      const lastContract = await this.constructor.findOne({
        contractNumber: new RegExp(`^CONT-${year}-`)
      }).sort({ contractNumber: -1 });
      
      let nextNumber = 1;
      if (lastContract && lastContract.contractNumber) {
        const parts = lastContract.contractNumber.split('-');
        nextNumber = parseInt(parts[parts.length - 1]) + 1;
      }
      
      this.contractNumber = `CONT-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      this.contractNumber = `CONT-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Contract', ContractSchema);
