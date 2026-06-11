const Transaction = require('../models/Transaction');
const ContractMonth = require('../models/ContractMonth');
const Invoice = require('../models/Invoice');
const Account = require('../models/Account');
const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع المعاملات
// @route   GET /api/transactions
// @access  Private (admin, finance, accountant)
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const filter = {};

  // فلترة حسب النوع
  if (req.query.type) filter.type = req.query.type;
  
  // فلترة حسب الطبيعة
  if (req.query.nature) filter.nature = req.query.nature;
  
  // فلترة حسب الحالة
  if (req.query.status) filter.status = req.query.status;
  
  // فلترة حسب العميل
  if (req.query.client) filter.client = req.query.client;
  
  // فلترة حسب الحساب
  if (req.query.account) {
    filter.$or = [
      { fromAccount: req.query.account },
      { toAccount: req.query.account }
    ];
  }
  
  // فلترة حسب التاريخ
  if (req.query.startDate && req.query.endDate) {
    filter.transactionDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // بحث
  if (req.query.search) {
    filter.$or = [
      ...(filter.$or || []),
      { description: { $regex: req.query.search, $options: 'i' } },
      { transactionNumber: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find(filter)
    .populate('client', 'name company')
    .populate('fromAccount', 'name')
    .populate('toAccount', 'name')
    .populate('contractMonth', 'month value')
    .populate('invoice', 'invoiceNumber totalAmount')
    .populate('project', 'title')
    .populate('createdBy', 'fullName')
    .sort('-transactionDate')
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { transactions }
  });
});

// @desc    الحصول على معاملة واحدة
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('client', 'name company email phone')
    .populate('fromAccount', 'name accountType')
    .populate('toAccount', 'name accountType')
    .populate('contractMonth', 'month value status')
    .populate('invoice', 'invoiceNumber totalAmount')
    .populate('project', 'title')
    .populate('allocations.contractMonth', 'month value')
    .populate('allocations.invoice', 'invoiceNumber totalAmount')
    .populate('createdBy', 'fullName');

  if (!transaction) {
    return next(new ApiError('المعاملة غير موجودة', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { transaction }
  });
});

// @desc    إضافة معاملة جديدة
// @route   POST /api/transactions
// @access  Private (admin, finance, accountant)
exports.createTransaction = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  // التحقق من صحة البيانات حسب نوع المعاملة
  const { type, fromAccount, toAccount } = req.body;

  if (type === 'تحويل') {
    if (!fromAccount || !toAccount) {
      return next(new ApiError('التحويل يتطلب حساب المصدر وحساب الوجهة', 400));
    }
    if (fromAccount === toAccount) {
      return next(new ApiError('لا يمكن التحويل إلى نفس الحساب', 400));
    }
  }

  if (type === 'دخل' && !toAccount) {
    return next(new ApiError('يرجى تحديد الحساب المستلم', 400));
  }

  if (type === 'مصروف' && !fromAccount) {
    return next(new ApiError('يرجى تحديد الحساب المدفوع منه', 400));
  }

  const transaction = await Transaction.create(req.body);

  if (transaction.invoice && transaction.type === 'دخل') {
    await updateInvoiceStatus(transaction.invoice, transaction.amount);
    
    // ربط المعاملة بالفاتورة
    await Invoice.findByIdAndUpdate(transaction.invoice, {
      $push: { transactions: transaction._id }
    });
  }


  // تحديث حالة الشهر المرتبط
  if (transaction.contractMonth) {
    await updateContractMonthStatus(transaction.contractMonth);
  }

  // تحديث الأرصدة
  await updateAccountBalances(transaction);

  // تحديث إحصائيات العميل
  if (transaction.client) {
    await updateClientStats(transaction.client);
  }

  res.status(201).json({
    status: 'success',
    data: { transaction }
  });
});

// @desc    توزيع دفعة على فواتير/أشهر عقود
// @route   POST /api/transactions/:id/allocate
// @access  Private (admin, finance)
exports.allocateTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ApiError('المعاملة غير موجودة', 404));
  }

  if (transaction.type !== 'دخل') {
    return next(new ApiError('يمكن توزيع معاملات الدخل فقط', 400));
  }

  const { allocations } = req.body;
  // allocations: [{ contractMonth: id, invoice: id, amount: number }]

  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return next(new ApiError('يرجى توفير التوزيعات', 400));
  }

  // التحقق من مجموع التوزيعات
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > transaction.amount) {
    return next(new ApiError(`مجموع التوزيعات (${totalAllocated}) أكبر من مبلغ المعاملة (${transaction.amount})`, 400));
  }

  // تحديث كل فاتورة/شهر
  for (const allocation of allocations) {
    if (allocation.contractMonth) {
      const month = await ContractMonth.findById(allocation.contractMonth);
      if (month) {
        month.paidAmount += allocation.amount;
        await month.save();
      }
    }
    if (allocation.invoice) {
      const invoice = await Invoice.findById(allocation.invoice);
      if (invoice) {
        invoice.paidAmount += allocation.amount;
        // ربط المعاملة بالفاتورة
        if (!invoice.transactions.includes(transaction._id)) {
          invoice.transactions.push(transaction._id);
        }
        await invoice.save();
      }
    }
  }

  // حفظ التوزيعات في المعاملة
  transaction.allocations = allocations;
  await transaction.save();

  // تحديث العميل
  if (transaction.client) {
    await updateClientStats(transaction.client);
  }

  res.status(200).json({
    status: 'success',
    message: 'تم توزيع الدفعة بنجاح',
    data: { transaction }
  });
});

// @desc    تحديث معاملة
// @route   PUT /api/transactions/:id
// @access  Private (admin)
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  // لا نسمح بتغيير النوع أو الطبيعة
  delete req.body.type;
  delete req.body.nature;
  delete req.body.allocations; // التوزيعات عبر allocateTransaction فقط

  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return next(new ApiError('المعاملة غير موجودة', 404));
  }

  await updateAccountBalances(transaction);

  res.status(200).json({
    status: 'success',
    data: { transaction }
  });
});

// @desc    حذف معاملة
// @route   DELETE /api/transactions/:id
// @access  Private (admin)
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ApiError('المعاملة غير موجودة', 404));
  }

  // التراجع عن تأثيرات المعاملة
  if (transaction.contractMonth) {
    const month = await ContractMonth.findById(transaction.contractMonth);
    if (month) {
      month.paidAmount -= transaction.amount;
      if (month.paidAmount < 0) month.paidAmount = 0;
      await month.save();
    }
  }

  if (transaction.invoice) {
    const invoice = await Invoice.findById(transaction.invoice);
    if (invoice) {
      invoice.paidAmount -= transaction.amount;
      if (invoice.paidAmount < 0) invoice.paidAmount = 0;
      invoice.transactions = invoice.transactions.filter(
        t => t.toString() !== transaction._id.toString()
      );
      await invoice.save();
    }
  }

  if (transaction.client) {
    await updateClientStats(transaction.client);
  }

  await Transaction.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المعاملة بنجاح'
  });
});

// @desc    ملخص المعاملات
// @route   GET /api/transactions/summary
// @access  Private (admin, finance)
exports.getTransactionsSummary = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // إحصائيات الشهر الحالي
  const monthlyStats = await Transaction.aggregate([
    { $match: { transactionDate: { $gte: startOfMonth }, status: 'مكتمل', nature: 'خارجي' } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // إحصائيات السنة
  const yearlyStats = await Transaction.aggregate([
    { $match: { transactionDate: { $gte: startOfYear }, status: 'مكتمل', nature: 'خارجي' } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const formatStats = (stats) => {
    const result = { income: 0, expense: 0 };
    stats.forEach(s => {
      if (s._id === 'دخل') result.income = s.total;
      if (s._id === 'مصروف') result.expense = s.total;
    });
    result.net = result.income - result.expense;
    return result;
  };

  res.status(200).json({
    status: 'success',
    data: {
      month: formatStats(monthlyStats),
      year: formatStats(yearlyStats)
    }
  });
});

// =============================================
// دوال مساعدة
// =============================================

const updateAccountBalances = async (transaction) => {
  // هذه الدالة تُشغل يدوياً أو عبر service
  if (transaction.status !== 'مكتمل') return;

  if (transaction.toAccount) {
    await Account.findByIdAndUpdate(transaction.toAccount, {
      lastBalanceUpdate: Date.now()
    });
  }
  if (transaction.fromAccount) {
    await Account.findByIdAndUpdate(transaction.fromAccount, {
      lastBalanceUpdate: Date.now()
    });
  }
};

const updateContractMonthStatus = async (monthId) => {
  const month = await ContractMonth.findById(monthId);
  if (!month) return;

  if (month.paidAmount >= month.value) {
    month.status = 'paid';
    month.paidDate = new Date();
  } else if (month.paidAmount > 0) {
    month.status = 'partially_paid';
  }
  await month.save();

  // تحديث إحصائيات العقد
  const Contract = require('../models/Contract');
  const allMonths = await ContractMonth.find({ contract: month.contract });
  const stats = {
    totalMonths: allMonths.length,
    paidMonths: allMonths.filter(m => m.status === 'paid').length,
    pendingMonths: allMonths.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
    totalValue: allMonths.reduce((sum, m) => sum + m.value, 0),
    totalPaid: allMonths.reduce((sum, m) => sum + m.paidAmount, 0)
  };
  stats.totalRemaining = stats.totalValue - stats.totalPaid;
  await Contract.findByIdAndUpdate(month.contract, { computedStats: stats });
};

const updateInvoiceStatus = async (invoiceId, additionalAmount = 0) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return;

  // إضافة المبلغ الجديد
  if (additionalAmount > 0) {
    invoice.paidAmount = (invoice.paidAmount || 0) + additionalAmount;
  }

  // تحديث الحالة
  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.status = 'مدفوعة';
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'مدفوعة جزئياً';
  }
  
  invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount;
  await invoice.save();
};

const updateClientStats = async (clientId) => {
  const ContractMonth = require('../models/ContractMonth');
  const Contract = require('../models/Contract');
  const Project = require('../models/Project');

  const [contractMonths, contracts, projects] = await Promise.all([
    ContractMonth.find({ client: clientId }),
    Contract.find({ client: clientId }),
    Project.find({ client: clientId })
  ]);

  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'نشط').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'قيد التنفيذ').length,
    totalInvoiced: contractMonths.reduce((sum, cm) => sum + cm.value, 0),
    totalPaid: contractMonths.reduce((sum, cm) => sum + cm.paidAmount, 0)
  };
  stats.balance = stats.totalPaid - stats.totalInvoiced;

  await Client.findByIdAndUpdate(clientId, { computedStats: stats });
};