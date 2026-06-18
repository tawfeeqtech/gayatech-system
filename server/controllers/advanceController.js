const Advance = require('../models/Advance');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const invoiceFactoryService = require('../services/invoiceFactoryService');

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

  // إذا كان السداد دفعة واحدة، نعتبر الفاتورة تحتاج لسداد عبر معاملة
  // أما إذا كان خصم من الراتب، فالسداد سيتم آلياً عند توليد الراتب
  await advance.save();

  res.status(200).json({ status: 'success', data: { advance } });
});

exports.rejectAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, {
    status: 'مرفوضة'
  }, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.repayAdvance = asyncHandler(async (req, res, next) => {
  return next(new ApiError('يجب سداد السلف عبر المعاملات المالية أو الخصم التلقائي من الراتب فقط', 400));
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
