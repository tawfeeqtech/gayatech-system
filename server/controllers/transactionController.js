const Transaction = require('../models/Transaction');
const ContractMonth = require('../models/ContractMonth');
const Invoice = require('../models/Invoice');
const Account = require('../models/Account');
const Client = require('../models/Client');
const Wallet = require('../models/Wallet');
const CurrencyExchange = require('../models/CurrencyExchange');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { updateClientStats } = require('../services/clientStatsService');

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
  
  if (req.query.wallet) {
    const walletFilter = [
      { fromWallet: req.query.wallet },
      { toWallet: req.query.wallet }
    ];
    filter.$or = filter.$or 
      ? [...filter.$or, ...walletFilter] 
      : walletFilter;
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
    .populate('fromWallet', 'name currency')
    .populate('toWallet', 'name currency')
    .populate('contractMonth', 'month value')
    .populate('invoice', 'invoiceNumber totalAmount paidAmount currency invoiceType')
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
    .populate('fromWallet', 'name currency')
    .populate('toWallet', 'name currency')
    .populate('contractMonth', 'month value status')
    .populate('invoice', 'invoiceNumber totalAmount paidAmount currency invoiceType')
    .populate('project', 'title')
    .populate('allocations.contractMonth', 'month value')
    .populate('allocations.invoice', 'invoiceNumber totalAmount paidAmount currency')
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

  const { type, fromAccount, toAccount, fromWallet, toWallet, amount, currency } = req.body;

  // التحقق من صحة البيانات
  if (type === 'تحويل') {
    if (!fromAccount || !toAccount) {
      return next(new ApiError('التحويل يتطلب حساب المصدر وحساب الوجهة', 400));
    }
    if (fromAccount === toAccount && fromWallet === toWallet) {
      return next(new ApiError('لا يمكن التحويل إلى نفس المحفظة', 400));
    }
  }

  if (type === 'دخل' && !toAccount) {
    return next(new ApiError('يرجى تحديد الحساب المستلم', 400));
  }

  if (type === 'مصروف' && !fromAccount) {
    return next(new ApiError('يرجى تحديد الحساب المدفوع منه', 400));
  }

  const hasAllocations = req.body.allocations && Array.isArray(req.body.allocations) && req.body.allocations.length > 0;
  if (hasAllocations) {
    req.body.invoice = undefined;
    req.body.contractMonth = undefined;
  }

  // إذا لم يُحدد العميل وكان هناك فاتورة، حاول الحصول عليه
  if (!req.body.client && req.body.invoice) {
    const invoice = await Invoice.findById(req.body.invoice).select('client');
    if (invoice && invoice.client) {
      req.body.client = invoice.client;
    }
  }

  const transaction = await Transaction.create(req.body);

  // معالجة التوزيعات
  if (hasAllocations) {
    for (const allocation of req.body.allocations) {
      if (allocation.invoice) {
        await updateInvoiceAndLinkedStatus(allocation.invoice, allocation.amount, transaction._id);
      }
    }
  } else {
    // إذا لم تكن هناك توزيعات، استخدم الطريقة المباشرة
    if (transaction.invoice) {
      await updateInvoiceAndLinkedStatus(transaction.invoice, transaction.amount, transaction._id);
    }

    if (transaction.contractMonth) {
      await updateContractMonthStatus(transaction.contractMonth);
    }
  }

  // تحديث رصيد المحفظة
  if (toWallet && (type === 'دخل' || type === 'تحويل')) {
    const creditAmount = (type === 'تحويل' && req.body.toAmount) ? req.body.toAmount : amount;
    await Wallet.findByIdAndUpdate(toWallet, { $inc: { balance: creditAmount } });
  }
  if (fromWallet && (type === 'مصروف' || type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(fromWallet, { $inc: { balance: -amount } });
  }

  // إذا كان تحويلاً بين عملات مختلفة
  if (type === 'تحويل' && fromWallet && toWallet) {
    const fromW = await Wallet.findById(fromWallet);
    const toW = await Wallet.findById(toWallet);
    if (fromW && toW && fromW.currency !== toW.currency) {
      await CurrencyExchange.create({
        fromCurrency: fromW.currency,
        toCurrency: toW.currency,
        fromAmount: amount,
        toAmount: req.body.toAmount || amount,
        exchangeRate: req.body.exchangeRate || (amount > 0 ? (req.body.toAmount || amount) / amount : 0),
        exchangeDate: transaction.transactionDate,
        via: req.body.paymentMethod || 'بنك',
        fromWallet: fromWallet,
        toWallet: toWallet,
        transaction: transaction._id,
        notes: `تحويل من معاملة #${transaction.transactionNumber}`,
        createdBy: req.user._id
      });
    }
  }

  // تحديث إحصائيات العميل (للفواتير الخارجية فقط)
  if (transaction.client) {
    await updateClientStats(transaction.client);
  }

  res.status(201).json({ status: 'success', data: { transaction } });
});

// @desc    توزيع دفعة على فواتير/أشهر عقود
exports.allocateTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return next(new ApiError('المعاملة غير موجودة', 404));
  if (transaction.type !== 'دخل') return next(new ApiError('يمكن توزيع معاملات الدخل فقط', 400));

  const { allocations } = req.body;
  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return next(new ApiError('يرجى توفير التوزيعات', 400));
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > transaction.amount) {
    return next(new ApiError(`مجموع التوزيعات أكبر من مبلغ المعاملة`, 400));
  }

  for (const allocation of allocations) {
    if (allocation.contractMonth) {
      const month = await ContractMonth.findById(allocation.contractMonth);
      if (month) {
        month.paidAmount += allocation.amount;
        await month.save();
      }
    }
    if (allocation.invoice) {
      await updateInvoiceAndLinkedStatus(allocation.invoice, allocation.amount, transaction._id);
    }
  }

  transaction.allocations = allocations;
  await transaction.save();

  if (transaction.client) await updateClientStats(transaction.client);

  res.status(200).json({ status: 'success', message: 'تم توزيع الدفعة بنجاح', data: { transaction } });
});

// @desc    تحديث معاملة
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const oldTransaction = await Transaction.findById(req.params.id);
  if (!oldTransaction) return next(new ApiError('المعاملة غير موجودة', 404));

  // التراجع عن تأثيرات المعاملة القديمة
  if (oldTransaction.toWallet) {
    const oldCredit = oldTransaction.toAmount || oldTransaction.amount;
    await Wallet.findByIdAndUpdate(oldTransaction.toWallet, { $inc: { balance: -oldCredit } });
  }
  if (oldTransaction.fromWallet) await Wallet.findByIdAndUpdate(oldTransaction.fromWallet, { $inc: { balance: oldTransaction.amount } });

  if (oldTransaction.invoice) {
    await updateInvoiceAndLinkedStatus(oldTransaction.invoice, -oldTransaction.amount, oldTransaction._id, true);
  }

  const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  // تطبيق التأثيرات الجديدة
  if (transaction.toWallet && (transaction.type === 'دخل' || transaction.type === 'تحويل')) {
    const newCredit = (transaction.type === 'تحويل' && transaction.toAmount) ? transaction.toAmount : transaction.amount;
    await Wallet.findByIdAndUpdate(transaction.toWallet, { $inc: { balance: newCredit } });
  }
  if (transaction.fromWallet && (transaction.type === 'مصروف' || transaction.type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(transaction.fromWallet, { $inc: { balance: -transaction.amount } });
  }

  if (transaction.invoice) {
    await updateInvoiceAndLinkedStatus(transaction.invoice, transaction.amount, transaction._id);
  }

  if (transaction.client) await updateClientStats(transaction.client);

  res.status(200).json({ status: 'success', data: { transaction } });
});

// @desc    حذف معاملة
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return next(new ApiError('المعاملة غير موجودة', 404));

  if (transaction.toWallet) {
    const credit = transaction.toAmount || transaction.amount;
    await Wallet.findByIdAndUpdate(transaction.toWallet, { $inc: { balance: -credit } });
  }
  if (transaction.fromWallet) await Wallet.findByIdAndUpdate(transaction.fromWallet, { $inc: { balance: transaction.amount } });

  if (transaction.invoice) {
    await updateInvoiceAndLinkedStatus(transaction.invoice, -transaction.amount, transaction._id, true);
  }

  if (transaction.client) await updateClientStats(transaction.client);

  await Transaction.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف المعاملة بنجاح' });
});

// ملخص المعاملات (كما هو)
exports.getTransactionsSummary = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyStats = await Transaction.aggregate([
    { $match: { transactionDate: { $gte: startOfMonth }, status: 'مكتمل', nature: 'خارجي' } },
    { $group: { _id: { type: '$type', currency: '$currency' }, total: { $sum: '$amount' } } }
  ]);

  const currencyStats = {};
  monthlyStats.forEach(stat => {
    const type = stat._id.type;
    const currency = stat._id.currency || 'USD';
    if (!currencyStats[currency]) currencyStats[currency] = { income: 0, expense: 0, net: 0 };
    if (type === 'دخل') currencyStats[currency].income = stat.total;
    else if (type === 'مصروف') currencyStats[currency].expense = stat.total;
  });

  Object.keys(currencyStats).forEach(currency => {
    currencyStats[currency].net = currencyStats[currency].income - currencyStats[currency].expense;
  });

  const wallets = await Wallet.find({ isActive: true });
  const totalBalance = {};
  wallets.forEach(w => {
    const currency = w.currency || 'USD';
    totalBalance[currency] = (totalBalance[currency] || 0) + (w.balance || 0);
  });

  res.status(200).json({ status: 'success', data: { month: currencyStats, totalBalance, wallets } });
});

// =============================================
// دوال مساعدة محدثة لتشمل الرواتب والسلف وغيرها
// =============================================

async function updateInvoiceAndLinkedStatus(invoiceId, amount, transactionId, isRemoving = false) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return;

  if (isRemoving) {
    invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) + amount);
    invoice.transactions = invoice.transactions.filter(t => t.toString() !== transactionId.toString());
  } else {
    invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) + amount);
    if (!invoice.transactions.includes(transactionId)) invoice.transactions.push(transactionId);
  }

  // تحديث حالة الفاتورة (pre-save سيتكفل بالباقي لكن سنؤكده هنا)
  await invoice.save();

  // تحديث السجلات المرتبطة بناءً على نوع الفاتورة
  const type = invoice.invoiceType;

  if (type === 'راتب' && invoice.salary) {
    const Salary = require('../models/Salary');
    await Salary.findByIdAndUpdate(invoice.salary, {
      paidAmount: invoice.paidAmount,
      status: invoice.status === 'مدفوعة' ? 'مدفوع' : invoice.status === 'مدفوعة جزئياً' ? 'مدفوع جزئياً' : 'مستحق',
      paymentDate: invoice.status === 'مدفوعة' ? new Date() : undefined
    });
  }
  else if (type === 'سلفة' && invoice.advance) {
    const Advance = require('../models/Advance');
    await Advance.findByIdAndUpdate(invoice.advance, {
      repaidAmount: invoice.paidAmount,
      status: invoice.status === 'مدفوعة' ? 'مسددة' : invoice.status === 'مدفوعة جزئياً' ? 'مسددة جزئياً' : 'موافق عليها'
    });
  }
  else if (type === 'مصروف' && invoice.expense) {
    const Expense = require('../models/Expense');
    await Expense.findByIdAndUpdate(invoice.expense, {
      status: invoice.status === 'مدفوعة' ? 'مدفوع' : 'معلق'
    });
  }
  else if (type === 'اشتراك' && invoice.subscription) {
    const Subscription = require('../models/Subscription');
    await Subscription.findByIdAndUpdate(invoice.subscription, {
      isPaid: invoice.status === 'مدفوعة'
    });
  }
  else if (type === 'عقد شهري' && invoice.contractMonth) {
    const ContractMonth = require('../models/ContractMonth');
    const contractMonth = await ContractMonth.findById(invoice.contractMonth);
    if (contractMonth) {
      contractMonth.paidAmount = invoice.paidAmount;
      if (invoice.status === 'مدفوعة') {
        contractMonth.status = 'paid';
        contractMonth.paidDate = new Date();
      } else if (invoice.status === 'مدفوعة جزئياً') {
        contractMonth.status = 'partially_paid';
      }
      await contractMonth.save();
    }
  }

  // تحديث المشروع إن وجد
  if (invoice.project) {
    const Project = require('../models/Project');
    const project = await Project.findById(invoice.project);
    if (project) {
      project.computedStats.totalPaid = invoice.paidAmount;
      project.computedStats.totalRemaining = project.totalValue - invoice.paidAmount;
      await project.save();
    }
  }
}

async function updateContractMonthStatus(monthId) {
  const ContractMonth = require('../models/ContractMonth');
  const month = await ContractMonth.findById(monthId);
  if (!month) return;

  if (month.paidAmount >= month.value) {
    month.status = 'paid';
    month.paidDate = new Date();
  } else if (month.paidAmount > 0) {
    month.status = 'partially_paid';
  }
  await month.save();
}
