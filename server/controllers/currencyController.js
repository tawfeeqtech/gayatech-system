const CurrencyExchange = require('../models/CurrencyExchange');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getExchanges = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const exchanges = await CurrencyExchange.find()
    .populate('fromWallet')
    .populate('toWallet')
    .sort('-exchangeDate')
    .skip(skip)
    .limit(limit);

  const total = await CurrencyExchange.countDocuments();

  res.status(200).json({
    status: 'success', results: exchanges.length, total, page,
    totalPages: Math.ceil(total / limit), data: { exchanges }
  });
});

exports.createExchange = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const { fromWallet, toWallet, fromAmount, toAmount } = req.body;

  if (fromWallet && !toWallet) {
    return next(new ApiError('يرجى تحديد محفظة الوجهة (toWallet)', 400));
  }

  const exchange = await CurrencyExchange.create(req.body);

  if (fromWallet && toWallet) {
    await Wallet.findByIdAndUpdate(fromWallet, { $inc: { balance: -fromAmount } });
    await Wallet.findByIdAndUpdate(toWallet, { $inc: { balance: toAmount } });
  }

  res.status(201).json({ status: 'success', data: { exchange } });
});

exports.updateExchange = asyncHandler(async (req, res, next) => {
  const oldExchange = await CurrencyExchange.findById(req.params.id);
  if (!oldExchange) return next(new ApiError('التحويل غير موجود', 404));

  // التراجع عن تأثيرات التحويل القديم على أرصدة المحافظ
  if (oldExchange.fromWallet && oldExchange.toWallet) {
    await Wallet.findByIdAndUpdate(oldExchange.fromWallet, { $inc: { balance: oldExchange.fromAmount } });
    await Wallet.findByIdAndUpdate(oldExchange.toWallet, { $inc: { balance: -oldExchange.toAmount } });
  }

  const exchange = await CurrencyExchange.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exchange) return next(new ApiError('التحويل غير موجود', 404));

  // تطبيق التأثيرات الجديدة
  if (exchange.fromWallet && exchange.toWallet) {
    await Wallet.findByIdAndUpdate(exchange.fromWallet, { $inc: { balance: -exchange.fromAmount } });
    await Wallet.findByIdAndUpdate(exchange.toWallet, { $inc: { balance: exchange.toAmount } });
  }

  res.status(200).json({ status: 'success', data: { exchange } });
});

// @desc    حذف تحويل عملات
exports.deleteExchange = asyncHandler(async (req, res, next) => {
  const exchange = await CurrencyExchange.findById(req.params.id);
  if (!exchange) return next(new ApiError('التحويل غير موجود', 404));

  // التراجع عن تأثير التحويل على الأرصدة
  if (exchange.fromWallet && exchange.toWallet) {
    await Wallet.findByIdAndUpdate(exchange.fromWallet, { $inc: { balance: exchange.fromAmount } });
    await Wallet.findByIdAndUpdate(exchange.toWallet, { $inc: { balance: -exchange.toAmount } });
  }

  await CurrencyExchange.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف التحويل بنجاح' });
});
