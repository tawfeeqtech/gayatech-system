const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع الفواتير
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.invoiceType) filter.invoiceType = req.query.invoiceType;
  if (req.query.project) filter.project = req.query.project;

  if (req.query.startDate && req.query.endDate) {
    filter.dueDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  if (req.query.search) {
    filter.$or = [
      { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
      { notes: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const invoices = await Invoice.find(filter)
    .populate('employee', 'name')
    .populate('client', 'name company')
    .populate('employee', 'name')
    .populate('project', 'title')
    .populate('createdBy', 'fullName')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Invoice.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: invoices.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { invoices }
  });
});

// @desc    الحصول على فاتورة واحدة
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client', 'name company email phone')
    .populate('project', 'title totalValue')
    .populate('transactions')
    .populate('createdBy', 'fullName');

  if (!invoice) {
    return next(new ApiError('الفاتورة غير موجودة', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { invoice }
  });
});

// @desc    إضافة فاتورة جديدة
// @route   POST /api/invoices
// @access  Private (admin, finance)
exports.createInvoice = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const invoice = await Invoice.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { invoice }
  });
});

// @desc    تحديث فاتورة
// @route   PUT /api/invoices/:id
// @access  Private (admin, finance)
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!invoice) {
    return next(new ApiError('الفاتورة غير موجودة', 404));
  }

  if (req.body.totalAmount !== undefined) {
    const ContractMonth = require('../models/ContractMonth');
    const contractMonth = await ContractMonth.findOne({ invoice: invoice._id });
    
    if (contractMonth) {
      contractMonth.value = req.body.totalAmount;
      contractMonth.currency = req.body.currency || contractMonth.currency;
      await contractMonth.save();
      
      // تحديث إحصائيات العقد
      const Contract = require('../models/Contract');
      const allMonths = await ContractMonth.find({ contract: contractMonth.contract });
      const stats = {
        totalMonths: allMonths.length,
        paidMonths: allMonths.filter(m => m.status === 'paid').length,
        pendingMonths: allMonths.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
        totalValue: allMonths.reduce((sum, m) => sum + m.value, 0),
        totalPaid: allMonths.reduce((sum, m) => sum + (m.paidAmount || 0), 0)
      };
      stats.totalRemaining = stats.totalValue - stats.totalPaid;
      await Contract.findByIdAndUpdate(contractMonth.contract, { computedStats: stats });
      
      // تحديث إحصائيات العميل
      const { updateClientStats } = require('../services/clientStatsService');
      await updateClientStats(contractMonth.client);
    }
  }

  res.status(200).json({
    status: 'success',
    data: { invoice }
  });
});

// @desc    تغيير حالة الفاتورة
// @route   PATCH /api/invoices/:id/status
// @access  Private (admin, finance)
exports.updateInvoiceStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!invoice) {
    return next(new ApiError('الفاتورة غير موجودة', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { invoice }
  });
});

// @desc    حذف فاتورة
// @route   DELETE /api/invoices/:id
// @access  Private (admin)
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new ApiError('الفاتورة غير موجودة', 404));
  }

    // تحقق من وجود معاملات مرتبطة
  const Transaction = require('../models/Transaction');

  // تحقق من وجود معاملات مرتبطة
  const hasTransactions = await Transaction.exists({ invoice: req.params.id });

  if (hasTransactions) {
    return next(new ApiError('لا يمكن حذف الفاتورة لوجود معاملات مالية مرتبطة بها', 400));
  }

  const ContractMonth = require('../models/ContractMonth');
  const contractMonth = await ContractMonth.findOne({ invoice: invoice._id });
  const clientId = invoice.client;

  if (contractMonth) {
    await ContractMonth.findByIdAndDelete(contractMonth._id);
  }

  await Invoice.findByIdAndDelete(req.params.id);

  if (clientId) {
    const { updateClientStats } = require('../services/clientStatsService');
    await updateClientStats(clientId);
  }

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الفاتورة بنجاح'
  });
});

// @desc    الفواتير المتأخرة
// @route   GET /api/invoices/overdue
// @access  Private (admin, finance)
exports.getOverdueInvoices = asyncHandler(async (req, res, next) => {
  const invoices = await Invoice.find({
    dueDate: { $lt: new Date() },
    status: { $in: ['مصدرة', 'مدفوعة جزئياً', 'متأخرة'] }
  })
    .populate('client', 'name company phone')
    .sort('dueDate');

  res.status(200).json({
    status: 'success',
    results: invoices.length,
    data: { invoices }
  });
});