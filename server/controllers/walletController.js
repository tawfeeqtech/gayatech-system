const Wallet = require('../models/Wallet');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع المحافظ (للاستخدام العام)
// @route   GET /api/wallets
exports.getAllWallets = asyncHandler(async (req, res, next) => {
  const wallets = await Wallet.find().populate('account', 'name accountType');

  res.status(200).json({
    status: 'success',
    results: wallets.length,
    data: { wallets }
  });
});

// @desc    الحصول على محافظ حساب
// @route   GET /api/accounts/:accountId/wallets
exports.getWallets = asyncHandler(async (req, res, next) => {
  const wallets = await Wallet.find({ account: req.params.accountId });

  res.status(200).json({
    status: 'success',
    results: wallets.length,
    data: { wallets }
  });
});

// @desc    إضافة محفظة
// @route   POST /api/accounts/:accountId/wallets
exports.createWallet = asyncHandler(async (req, res, next) => {
  req.body.account = req.params.accountId;
  req.body.createdBy = req.user._id;

  // التحقق من عدم وجود محفظة بنفس العملة
  const exists = await Wallet.findOne({
    account: req.params.accountId,
    currency: req.body.currency
  });

  if (exists) {
    return next(new ApiError('توجد محفظة بنفس العملة لهذا الحساب', 400));
  }

  // إذا تم تحديدها كافتراضية، قم بإلغاء الافتراضية عن المحافظ الأخرى لنفس الحساب
  if (req.body.isDefault) {
    await Wallet.updateMany({ account: req.params.accountId }, { isDefault: false });
  }

  const wallet = await Wallet.create(req.body);

  // إضافة المحفظة للحساب
  await Account.findByIdAndUpdate(req.params.accountId, {
    $push: { wallets: wallet._id }
  });

  res.status(201).json({
    status: 'success',
    data: { wallet }
  });
});

// @desc    تحديث محفظة
// @route   PUT /api/wallets/:id
exports.updateWallet = asyncHandler(async (req, res, next) => {
  let wallet = await Wallet.findById(req.params.id);
  if (!wallet) {
    return next(new ApiError('المحفظة غير موجودة', 404));
  }

  // إذا تم تغيير المحفظة لتصبح افتراضية
  if (req.body.isDefault && !wallet.isDefault) {
    await Wallet.updateMany({ account: wallet.account }, { isDefault: false });
  }

  wallet = await Wallet.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!wallet) {
    return next(new ApiError('المحفظة غير موجودة', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { wallet }
  });
});

// @desc    حذف محفظة
// @route   DELETE /api/wallets/:id
exports.deleteWallet = asyncHandler(async (req, res, next) => {
  const wallet = await Wallet.findById(req.params.id);

  if (!wallet) {
    return next(new ApiError('المحفظة غير موجودة', 404));
  }

  // قيود الحذف: منع الحذف إذا كان الرصيد غير صفري
  if (wallet.balance !== 0) {
    return next(new ApiError('لا يمكن حذف محفظة بها رصيد، يرجى تصفير الرصيد أولاً', 400));
  }

  // قيود الحذف: منع الحذف إذا كانت مرتبطة بمعاملات
  const hasTransactions = await Transaction.findOne({
    $or: [{ fromWallet: req.params.id }, { toWallet: req.params.id }]
  });

  if (hasTransactions) {
    return next(new ApiError('لا يمكن حذف محفظة مرتبطة بمعاملات سابقة، يمكنك تعطيلها بدلاً من حذفها', 400));
  }

  // إزالة المحفظة من الحساب
  await Account.findByIdAndUpdate(wallet.account, {
    $pull: { wallets: wallet._id }
  });

  await Wallet.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المحفظة'
  });
});