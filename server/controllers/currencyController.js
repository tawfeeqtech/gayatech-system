const CurrencyExchange = require('../models/CurrencyExchange');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getExchanges = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const exchanges = await CurrencyExchange.find()
    .populate('transaction')
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
  const exchange = await CurrencyExchange.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!exchange) return next(new ApiError('التحويل غير موجود', 404));
  res.status(200).json({ status: 'success', data: { exchange } });
});
