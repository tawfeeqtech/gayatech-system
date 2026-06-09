const SubscriptionSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true
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
  
  status: {
    type: String,
    enum: ['نشط', 'منتهي', 'ملغي', 'بانتظار التجديد'],
    default: 'نشط'
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