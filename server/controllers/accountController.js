const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع الحسابات
// @route   GET /api/accounts
// @access  Private (admin, finance, accountant)
exports.getAccounts = asyncHandler(async (req, res, next) => {
  const accounts = await Account.find()
    .sort({ isDefault: -1, name: 1 });

  // حساب الرصيد لكل حساب
  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => {
      // إجمالي الوارد
      const totalIn = await Transaction.aggregate([
        { $match: { toAccount: account._id, status: 'مكتمل' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // إجمالي الصادر
      const totalOut = await Transaction.aggregate([
        { $match: { fromAccount: account._id, status: 'مكتمل' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const incoming = totalIn[0]?.total || 0;
      const outgoing = totalOut[0]?.total || 0;
      const balance = incoming - outgoing;

      return {
        ...account.toObject(),
        balance,
        totalIncoming: incoming,
        totalOutgoing: outgoing
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: accountsWithBalance.length,
    data: { accounts: accountsWithBalance }
  });
});

// @desc    الحصول على حساب واحد
// @route   GET /api/accounts/:id
// @access  Private
exports.getAccount = asyncHandler(async (req, res, next) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    return next(new ApiError('الحساب غير موجود', 404));
  }

  // حركة الحساب
  const totalIn = await Transaction.aggregate([
    { $match: { toAccount: account._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalOut = await Transaction.aggregate([
    { $match: { fromAccount: account._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const balance = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

  res.status(200).json({
    status: 'success',
    data: {
      account,
      balance,
      totalIncoming: totalIn[0]?.total || 0,
      totalOutgoing: totalOut[0]?.total || 0
    }
  });
});

// @desc    إضافة حساب جديد
// @route   POST /api/accounts
// @access  Private (admin)
exports.createAccount = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const account = await Account.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { account }
  });
});

// @desc    تحديث حساب
// @route   PUT /api/accounts/:id
// @access  Private (admin)
exports.updateAccount = asyncHandler(async (req, res, next) => {
  const account = await Account.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!account) {
    return next(new ApiError('الحساب غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { account }
  });
});

// @desc    الحصول على حركة حساب
// @route   GET /api/accounts/:id/movements
// @access  Private (admin, finance)
exports.getAccountMovements = asyncHandler(async (req, res, next) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    return next(new ApiError('الحساب غير موجود', 404));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {
    status: 'مكتمل',
    $or: [
      { fromAccount: account._id },
      { toAccount: account._id }
    ]
  };

  const movements = await Transaction.find(filter)
    .populate('client', 'name')
    .populate('fromAccount', 'name')
    .populate('toAccount', 'name')
    .sort('-transactionDate')
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: movements.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { movements }
  });
});