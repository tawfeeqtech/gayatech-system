const mongoose = require('mongoose');

const PartnerFundingSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  
  // اتجاه الحركة
  direction: {
    type: String,
    enum: ['تمويل وارد', 'سداد للشريك'],
    required: true
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
  fundingDate: {
    type: Date,
    required: true
  },
  
  // الحساب المرتبط
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
    // أين ذهبت الأموال (في التمويل الوارد)
  },
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
    // من أين تم السداد (في السداد للشريك)
  },
  
  // المعاملة المرتبطة
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // السبب
  reason: {
    type: String,
    required: true
  },
  
  // تاريخ الاستحقاق (للسداد)
  expectedRepaymentDate: Date,
  
  status: {
    type: String,
    enum: ['مكتمل', 'معلق', 'ملغي'],
    default: 'مكتمل'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

PartnerFundingSchema.index({ partner: 1, fundingDate: -1 });
PartnerFundingSchema.index({ direction: 1 });

module.exports = mongoose.model('PartnerFunding', PartnerFundingSchema);
