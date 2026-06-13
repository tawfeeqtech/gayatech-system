const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المحفظة مطلوب'],
    trim: true
    // مثال: 'محفظة الدولار', 'محفظة الشيكل', 'محفظة الريال'
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'الحساب مطلوب']
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    required: [true, 'العملة مطلوبة']
  },
  balance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// مؤشر مركب: لا يمكن وجود محفظتين بنفس العملة لنفس الحساب
WalletSchema.index({ account: 1, currency: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', WalletSchema);