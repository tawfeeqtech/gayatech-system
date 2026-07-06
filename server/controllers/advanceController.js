const Advance = require('../models/Advance');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const invoiceFactoryService = require('../services/invoiceFactoryService');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Wallet = require('../models/Wallet');

exports.getAdvances = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employee) filter.employee = req.query.employee;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const advances = await Advance.find(filter)
    .populate('employee', 'name jobTitle')
    .populate('approvedBy', 'fullName')
    .populate('invoice', 'invoiceNumber status')
    .sort('-requestDate')
    .skip(skip)
    .limit(limit);

  const total = await Advance.countDocuments(filter);

  res.status(200).json({
    status: 'success', results: advances.length, total, page,
    totalPages: Math.ceil(total / limit), data: { advances }
  });
});

exports.getMyAdvances = asyncHandler(async (req, res, next) => {
  if (!req.user.employee) {
    return next(new ApiError('لا يوجد موظف مرتبط بهذا الحساب', 404));
  }
  const advances = await Advance.find({ employee: req.user.employee })
    .populate('approvedBy', 'fullName')
    .populate('invoice', 'invoiceNumber status')
    .sort('-requestDate');
  res.status(200).json({ status: 'success', results: advances.length, data: { advances } });
});

exports.createAdvance = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const advance = await Advance.create(req.body);
  res.status(201).json({ status: 'success', data: { advance } });
});

exports.updateAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.approveAdvance = asyncHandler(async (req, res, next) => {
  let advance = await Advance.findById(req.params.id);
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));

  if (advance.status !== 'معلقة') {
    return next(new ApiError('لا يمكن الموافقة على سلفة غير معلقة', 400));
  }

  // تحديث حالة السلفة
  advance.status = 'موافق عليها';
  advance.approvedBy = req.user._id;
  advance.approvedAt = Date.now();

  if (req.body.installmentAmount) {
    advance.installmentAmount = req.body.installmentAmount;
  }

  await advance.save();

  // إنشاء فاتورة للسلفة
  const invoice = await invoiceFactoryService.createInvoice({
    type: 'سلفة',
    amount: advance.amount,
    currency: advance.currency,
    issueDate: new Date(),
    dueDate: new Date(),
    refId: advance._id,
    refModel: 'advance',
    recipientId: advance.employee,
    recipientType: 'employee',
    description: `سلفة للموظف - ${advance.reason || ''}`,
    userId: req.user._id
  });

  advance.invoice = invoice._id;
  await advance.save();

  // إذا كانت طريقة السداد دفعة واحدة، يمكن إنشاء معاملة تلقائية (اختياري حسب رغبة المستخدم)
  // هنا سنقوم بإنشاء المعاملة إذا تم تحديد حساب الدفع
  if (advance.repaymentMethod === 'دفعة واحدة' && req.body.accountId && req.body.walletId) {
    const transaction = await Transaction.create({
      type: 'مصروف',
      amount: advance.amount,
      currency: advance.currency,
      fromAccount: req.body.accountId,
      fromWallet: req.body.walletId,
      invoice: invoice._id,
      advance: advance._id,
      employee: advance.employee,
      transactionDate: new Date(),
      description: `صرف سلفة للموظف - ${advance.reason || ''}`,
      status: 'مكتمل',
      createdBy: req.user._id
    });

    // تحديث رصيد المحفظة
    await Wallet.findByIdAndUpdate(req.body.walletId, { $inc: { balance: -advance.amount } });

    advance.transaction = transaction._id;
    advance.repaidAmount = advance.amount;
    advance.status = 'مسددة';
    await advance.save();

    // تحديث الفاتورة لتصبح مدفوعة
    invoice.paidAmount = advance.amount;
    invoice.status = 'مدفوعة';
    invoice.transactions.push(transaction._id);
    await invoice.save();
  }

  res.status(200).json({ status: 'success', data: { advance } });
});

exports.rejectAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, {
    status: 'مرفوضة'
  }, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.getPendingAdvances = asyncHandler(async (req, res, next) => {
  const advances = await Advance.find({ status: 'معلقة' })
    .populate('employee', 'name jobTitle')
    .sort('-requestDate');
  res.status(200).json({ status: 'success', results: advances.length, data: { advances } });
});

exports.deleteAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findById(req.params.id);
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  if (advance.transaction) return next(new ApiError('لا يمكن حذف السلفة لوجود معاملة مالية مرتبطة بها', 400));

  if (advance.invoice) {
    const Invoice = require('../models/Invoice');
    await Invoice.findByIdAndDelete(advance.invoice);
  }

  await Advance.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف السلفة بنجاح' });
});
