const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  // الإعدادات المالية
  defaultCurrency: {
    type: String,
    default: 'USD'
  },
  defaultExpenseAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  defaultExpenseWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },

  // إعدادات الرواتب
  autoGenerateSalary: {
    type: Boolean,
    default: true
  },
  salaryDayOfMonth: {
    type: Number,
    default: 1
  },

  // إعدادات عامة
  language: {
    type: String,
    default: 'ar'
  },
  dateFormat: {
    type: String,
    default: 'gregorian'
  },
  pageSize: {
    type: Number,
    default: 10
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
