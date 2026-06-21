const mongoose = require('mongoose');

const CurrencyExchangeSchema = new mongoose.Schema({
  fromCurrency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    required: true
  },
  toCurrency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    required: true
  },
  
  fromAmount: {
    type: Number,
    required: true
  },
  toAmount: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  
  exchangeDate: {
    type: Date,
    required: true
  },
  
  via: {
    type: String,
    enum: ['ريم', 'بنك', 'تحويل بنكي', 'نقد', 'صرافة', 'شيك', 'بطاقة ائتمان', 'أخرى'],
    default: 'بنك'
  },
  
  // المحافظ المرتبطة
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },

  // المعاملة المرتبطة
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

CurrencyExchangeSchema.index({ exchangeDate: -1 });

module.exports = mongoose.model('CurrencyExchange', CurrencyExchangeSchema);
