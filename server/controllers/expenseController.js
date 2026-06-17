const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const invoiceFactoryService = require('../services/invoiceFactoryService');

// @desc    الحصول على جميع المصاريف
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isRecurring) filter.isRecurring = req.query.isRecurring === 'true';

  if (req.query.startDate && req.query.endDate) {
    filter.expenseDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  if (req.query.search) {
    filter.$or = [
      { description: { $regex: req.query.search, $options: 'i' } },
      { vendor: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const expenses = await Expense.find(filter)
    .populate('category', 'name icon color')
    .populate('vendorRef', 'name')
    .populate('paidFrom', 'name')
    .populate('invoice', 'invoiceNumber status')
    .populate('createdBy', 'fullName')
    .sort('-expenseDate')
    .skip(skip)
    .limit(limit);

  const total = await Expense.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: expenses.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { expenses }
  });
});

// @desc    الحصول على مصروف واحد
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id)
    .populate('category', 'name icon color')
    .populate('vendorRef', 'name phone email')
    .populate('paidFrom', 'name accountType')
    .populate('transaction')
    .populate('invoice', 'invoiceNumber status')
    .populate('createdBy', 'fullName');

  if (!expense) {
    return next(new ApiError('المصروف غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { expense }
  });
});

// @desc    إضافة مصروف جديد
// @route   POST /api/expenses
// @access  Private (admin, finance)
exports.createExpense = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const expense = await Expense.create(req.body);

  // إنشاء فاتورة للمصروف
  const invoice = await invoiceFactoryService.createInvoice({
    type: 'مصروف',
    amount: expense.amount,
    currency: expense.currency,
    issueDate: expense.expenseDate,
    dueDate: expense.expenseDate,
    refId: expense._id,
    refModel: 'expense',
    recipientId: expense.vendorRef || undefined,
    recipientType: 'vendor',
    description: expense.description,
    userId: req.user._id
  });

  expense.invoice = invoice._id;
  await expense.save();

  res.status(201).json({
    status: 'success',
    data: { expense }
  });
});

// @desc    تحديث مصروف
// @route   PUT /api/expenses/:id
// @access  Private (admin)
exports.updateExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!expense) {
    return next(new ApiError('المصروف غير موجود', 404));
  }

  // تحديث الفاتورة المرتبطة إن وجدت
  if (expense.invoice) {
    const Invoice = require('../models/Invoice');
    await Invoice.findByIdAndUpdate(expense.invoice, {
      totalAmount: expense.amount,
      issueDate: expense.expenseDate,
      dueDate: expense.expenseDate,
      vendor: expense.vendorRef
    });
  }

  res.status(200).json({
    status: 'success',
    data: { expense }
  });
});

// @desc    حذف مصروف
// @route   DELETE /api/expenses/:id
// @access  Private (admin)
exports.deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new ApiError('المصروف غير موجود', 404));
  }

  if (expense.transaction) {
    return next(new ApiError('لا يمكن حذف المصروف لوجود معاملة مالية مرتبطة به', 400));
  }

  if (expense.invoice) {
    const Invoice = require('../models/Invoice');
    await Invoice.findByIdAndDelete(expense.invoice);
  }

  await Expense.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المصروف بنجاح'
  });
});

// @desc    مصاريف حسب التصنيف
// @route   GET /api/expenses/by-category
// @access  Private (admin, finance)
exports.getExpensesByCategory = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const matchFilter = { status: 'مدفوع' };
  if (startDate && endDate) {
    matchFilter.expenseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const expensesByCategory = await Expense.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        expenses: { $push: { description: '$description', amount: '$amount', date: '$expenseDate' } }
      }
    },
    {
      $lookup: {
        from: 'expensecategories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $sort: { total: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    results: expensesByCategory.length,
    data: { expensesByCategory }
  });
});

// @desc    المصاريف المتكررة
// @route   GET /api/expenses/recurring
// @access  Private (admin, finance)
exports.getRecurringExpenses = asyncHandler(async (req, res, next) => {
  const expenses = await Expense.find({ isRecurring: true, status: 'مدفوع' })
    .populate('category', 'name')
    .sort('-expenseDate');

  res.status(200).json({
    status: 'success',
    results: expenses.length,
    data: { expenses }
  });
});
