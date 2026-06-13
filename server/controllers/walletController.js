const Wallet = require('../models/Wallet');
const Account = require('../models/Account');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

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
  const wallet = await Wallet.findByIdAndUpdate(
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