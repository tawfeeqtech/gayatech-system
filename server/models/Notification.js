const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: [
      'فاتورة مستحقة',
      'فاتورة متأخرة',
      'اشتراك ينتهي قريباً',
      'اشتراك انتهى',
      'شهر عقد بانتظار التأكيد',
      'رصيد دائن للعميل',
      'تمويل شريك مستحق',
      'مهمة متأخرة',
      'تنبيه نظام',
      'أخرى'
    ],
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // رابط للعنصر المرتبط
  link: String,
  linkType: {
    type: String,
    enum: ['client', 'contract', 'project', 'invoice', 'subscription', 'task', 'transaction']
  },
  linkId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // الأولوية
  priority: {
    type: String,
    enum: ['عادي', 'مهم', 'حرج'],
    default: 'عادي'
  },
  
  // الحالة
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  dismissed: {
    type: Boolean,
    default: false
  },
  
  // لون الإشعار
  color: {
    type: String,
    default: '#3B82F6'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, dismissed: 1 });