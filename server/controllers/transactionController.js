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
    .populate('fromWallet', 'name currency')
    .populate('toWallet', 'name currency')
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

  const transaction = await Transaction.create(req.body);

  // 👈 معالجة التوزيعات (allocations) - مرة واحدة فقط
  if (req.body.allocations && Array.isArray(req.body.allocations) && req.body.allocations.length > 0) {
    for (const allocation of req.body.allocations) {
      if (allocation.invoice) {
        await updateInvoiceStatus(allocation.invoice, allocation.amount);
        await Invoice.findByIdAndUpdate(allocation.invoice, {
          $push: { transactions: transaction._id }
        });
      }
      
      if (allocation.contractMonth) {
        const month = await ContractMonth.findById(allocation.contractMonth);
        if (month) {
          month.paidAmount = (month.paidAmount || 0) + allocation.amount;
          await month.save();
          await updateContractMonthStatus(allocation.contractMonth);
        }
      }
    }
  } else {
    // 👈 إذا لم تكن هناك توزيعات، استخدم الطريقة المباشرة
    if (transaction.invoice && transaction.type === 'دخل') {
      await updateInvoiceStatus(transaction.invoice, transaction.amount);
      await Invoice.findByIdAndUpdate(transaction.invoice, {
        $push: { transactions: transaction._id }
      });
    }

    if (transaction.contractMonth) {
      await updateContractMonthStatus(transaction.contractMonth);
    }
  }

  // تحديث رصيد المحفظة
  if (toWallet && (type === 'دخل' || type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(toWallet, {
      $inc: { balance: amount }
    });
  }
  if (fromWallet && (type === 'مصروف' || type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(fromWallet, {
      $inc: { balance: -amount }
    });
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
        transaction: transaction._id,
        notes: `تحويل من معاملة #${transaction.transactionNumber}`,
        createdBy: req.user._id
      });
    }
  }

  // تحديث إحصائيات العميل (مرة واحدة فقط)
  if (transaction.client) {
    const { updateClientStats } = require('../services/clientStatsService');
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
      const invoice = await Invoice.findById(allocation.invoice);
      if (invoice) {
        invoice.paidAmount += allocation.amount;
        if (!invoice.transactions.includes(transaction._id)) {
          invoice.transactions.push(transaction._id);
        }
        await invoice.save();
        await updateInvoiceStatus(invoice._id);
      }
    }
  }

  transaction.allocations = allocations;
  await transaction.save();

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
  const oldTransaction = await Transaction.findById(req.params.id);
  if (!oldTransaction) {
    return next(new ApiError('المعاملة غير موجودة', 404));
  }

  // التراجع عن تأثيرات المعاملة القديمة على المحافظ
  if (oldTransaction.toWallet) {
    await Wallet.findByIdAndUpdate(oldTransaction.toWallet, {
      $inc: { balance: -oldTransaction.amount }
    });
  }
  if (oldTransaction.fromWallet) {
    await Wallet.findByIdAndUpdate(oldTransaction.fromWallet, {
      $inc: { balance: oldTransaction.amount }
    });
  }

  // حذف old transaction effects on invoice
  if (oldTransaction.invoice) {
    await Invoice.findByIdAndUpdate(oldTransaction.invoice, {
      $inc: { paidAmount: -oldTransaction.amount }
    });
  }

  // تحديث المعاملة
  delete req.body.type;
  delete req.body.nature;
  delete req.body.allocations;

  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  // تطبيق التأثيرات الجديدة
  if (transaction.toWallet && (transaction.type === 'دخل' || transaction.type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(transaction.toWallet, {
      $inc: { balance: transaction.amount }
    });
  }
  if (transaction.fromWallet && (transaction.type === 'مصروف' || transaction.type === 'تحويل')) {
    await Wallet.findByIdAndUpdate(transaction.fromWallet, {
      $inc: { balance: -transaction.amount }
    });
  }

  // تحديث الفاتورة
  if (transaction.invoice) {
    await updateInvoiceStatus(transaction.invoice, transaction.amount);
  }

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

  // التراجع عن تأثيرات المحافظ
  if (transaction.toWallet) {
    await Wallet.findByIdAndUpdate(transaction.toWallet, {
      $inc: { balance: -transaction.amount }
    });
  }
  if (transaction.fromWallet) {
    await Wallet.findByIdAndUpdate(transaction.fromWallet, {
      $inc: { balance: transaction.amount }
    });
  }

  // التراجع عن الفاتورة
  if (transaction.invoice) {
    await Invoice.findByIdAndUpdate(transaction.invoice, {
      $inc: { paidAmount: -transaction.amount },
      $pull: { transactions: transaction._id }
    });
    await updateInvoiceStatus(transaction.invoice);
  }

  // التراجع عن الشهر
  if (transaction.contractMonth) {
    const month = await ContractMonth.findById(transaction.contractMonth);
    if (month) {
      month.paidAmount = Math.max(0, (month.paidAmount || 0) - transaction.amount);
      await month.save();
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

  const monthlyStats = await Transaction.aggregate([
    { $match: { transactionDate: { $gte: startOfMonth }, status: 'مكتمل', nature: 'خارجي' } },
    {
      $group: {
        _id: { type: '$type', currency: '$currency' },
        total: { $sum: '$amount' }
      }
    }
  ]);

  const currencyStats = {};
  monthlyStats.forEach(stat => {
    const type = stat._id.type; // 'دخل' or 'مصروف'
    const currency = stat._id.currency || 'USD';
    if (!currencyStats[currency]) {
      currencyStats[currency] = { income: 0, expense: 0, net: 0 };
    }
    if (type === 'دخل') {
      currencyStats[currency].income = stat.total;
    } else if (type === 'مصروف') {
      currencyStats[currency].expense = stat.total;
    }
  });

  // حساب الصافي لكل عملة
  Object.keys(currencyStats).forEach(currency => {
    currencyStats[currency].net = currencyStats[currency].income - currencyStats[currency].expense;
  });

  // حساب الرصيد الإجمالي لكل عملة من جميع المحافظ النشطة
  const wallets = await Wallet.find({ isActive: true });
  const totalBalance = {};
  wallets.forEach(w => {
    const currency = w.currency || 'USD';
    totalBalance[currency] = (totalBalance[currency] || 0) + (w.balance || 0);
  });

  res.status(200).json({
    status: 'success',
    data: {
      month: currencyStats,
      totalBalance,
      wallets: wallets.map(w => ({
        _id: w._id,
        name: w.name,
        currency: w.currency,
        balance: w.balance,
        account: w.account
      }))
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
  } else {
    month.status = 'confirmed';
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

  if (additionalAmount !== 0) {
    invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) + additionalAmount);
  }

  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.status = 'مدفوعة';
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'مدفوعة جزئياً';
  } else {
    if (invoice.status !== 'مسودة' && invoice.status !== 'ملغاة') {
      invoice.status = 'مصدرة';
    }
  }

  invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount;
  await invoice.save();

  // تحديث شهر العقد إذا كانت الفاتورة لعقد شهري
  const ContractMonth = require('../models/ContractMonth');
  const contractMonth = await ContractMonth.findOne({ invoice: invoice._id });
  if (contractMonth) {
    contractMonth.paidAmount = invoice.paidAmount;
    await contractMonth.save();
    await updateContractMonthStatus(contractMonth._id);
  }
};

// const updateClientStats = async (clientId) => {
//   const ContractMonth = require('../models/ContractMonth');
//   const Contract = require('../models/Contract');
//   const Project = require('../models/Project');

//   const [contractMonths, contracts, projects] = await Promise.all([
//     ContractMonth.find({ client: clientId }),
//     Contract.find({ client: clientId }),
//     Project.find({ client: clientId })
//   ]);

//   const stats = {
//     totalContracts: contracts.length,
//     activeContracts: contracts.filter(c => c.status === 'نشط').length,
//     totalProjects: projects.length,
//     activeProjects: projects.filter(p => p.status === 'قيد التنفيذ').length,
//     totalInvoiced: contractMonths.reduce((sum, cm) => sum + cm.value, 0),
//     totalPaid: contractMonths.reduce((sum, cm) => sum + cm.paidAmount, 0)
//   };
//   stats.balance = stats.totalPaid - stats.totalInvoiced;

//   await Client.findByIdAndUpdate(clientId, { computedStats: stats });
// };