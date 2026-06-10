const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // نوع الشريك
  partnerType: {
    type: String,
    enum: ['مؤسس', 'مستثمر', 'شريك استراتيجي', 'ممول', 'أخرى'],
    default: 'ممول'
  },
  
  // معلومات الاتصال
  email: {
    type: String,
    lowercase: true
  },
  phone: String,
  
  // مؤشرات محسوبة
  computedStats: {
    totalFunded: { type: Number, default: 0 },     // إجمالي التمويل المقدم
    totalRepaid: { type: Number, default: 0 },      // إجمالي المسدد
    balance: { type: Number, default: 0 },           // الرصيد المستحق (سالب = للشريك)
    totalTransactions: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['نشط', 'غير نشط'],
    default: 'نشط'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Partner', PartnerSchema);
