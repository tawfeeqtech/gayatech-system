const ContractMonth = require('../models/ContractMonth');
const Contract = require('../models/Contract');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    إضافة شهر عقد يدوي
// @route   POST /api/contract-months
// @access  Private (admin, pm)
exports.createContractMonth = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  req.body.generationType = 'manual';

  const contractMonth = await ContractMonth.create(req.body);

  // تحديث إحصائيات العقد
  await updateContractStats(req.body.contract);

  res.status(201).json({
    status: 'success',
    data: { contractMonth }
  });
});

// @desc    تحديث شهر عقد
// @route   PUT /api/contract-months/:id
// @access  Private (admin, pm)
exports.updateContractMonth = asyncHandler(async (req, res, next) => {
  const contractMonth = await ContractMonth.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!contractMonth) {
    return next(new ApiError('شهر العقد غير موجود', 404));
  }

  if (contractMonth.invoice && (req.body.value !== undefined || req.body.currency !== undefined)) {
    const Invoice = require('../models/Invoice');
    const updateData = {};
    if (req.body.value !== undefined) updateData.totalAmount = req.body.value;
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    
    await Invoice.findByIdAndUpdate(contractMonth.invoice, updateData);
  }

  await updateContractStats(contractMonth.contract);

  // 👈 تحديث إحصائيات العميل
  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(contractMonth.client);

  res.status(200).json({
    status: 'success',
    data: { contractMonth }
  });
});

// @desc    تأكيد فاتورة الشهر
// @route   PATCH /api/contract-months/:id/confirm
// @access  Private (admin, pm, finance)
exports.confirmContractMonth = asyncHandler(async (req, res, next) => {
  const contractMonth = await ContractMonth.findByIdAndUpdate(
    req.params.id,
    {
      status: 'confirmed',
      reviewedBy: req.user._id,
      reviewedAt: Date.now()
    },
    { new: true }
  );

  if (!contractMonth) {
    return next(new ApiError('شهر العقد غير موجود', 404));
  }

  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(contractMonth.client);

  res.status(200).json({
    status: 'success',
    data: { contractMonth }
  });
});

// @desc    حذف شهر عقد
// @route   DELETE /api/contract-months/:id
// @access  Private (admin)
exports.deleteContractMonth = asyncHandler(async (req, res, next) => {
  const contractMonth = await ContractMonth.findById(req.params.id);

  if (!contractMonth) {
    return next(new ApiError('شهر العقد غير موجود', 404));
  }

  // تحقق من وجود معاملات مرتبطة
  const Transaction = require('../models/Transaction');
  const hasTransactions = await Transaction.exists({ contractMonth: req.params.id });

  if (hasTransactions) {
    return next(new ApiError('لا يمكن حذف الشهر لوجود معاملات مالية مرتبطة به', 400));
  }

  if (contractMonth.invoice) {
    const Invoice = require('../models/Invoice');
    // تحقق من وجود معاملات مرتبطة بالفاتورة
    const hasInvoiceTransactions = await Transaction.exists({ invoice: contractMonth.invoice });
    if (!hasInvoiceTransactions) {
      await Invoice.findByIdAndDelete(contractMonth.invoice);
    }
  }

  const contractId = contractMonth.contract;
  const clientId = contractMonth.client;
  await ContractMonth.findByIdAndDelete(req.params.id);
  await updateContractStats(contractId);

  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(clientId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف شهر العقد بنجاح'
  });
});

// @desc    توليد فواتير تلقائية
// @route   POST /api/contract-months/generate
// @access  Private (admin) or Auto
exports.generateAutoMonths = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // جلب العقود النشطة مع التوليد التلقائي المفعل
  const contracts = await Contract.find({
    status: 'نشط',
    'autoGeneration.enabled': true,
    startDate: { $lte: now }
  });

  let generated = 0;
  let skipped = 0;

  for (const contract of contracts) {
    const exists = await ContractMonth.findOne({
      contract: contract._id,
      month: currentMonth
    });

    if (!exists) {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.dueDayOfMonth || 10);
      const contractMonth = await ContractMonth.create({
        contract: contract._id,
        client: contract.client,
        month: currentMonth,
        value: contract.defaultMonthlyValue,
        currency: contract.currency,
        dueDate: dueDate,
        status: contract.autoGeneration?.autoConfirm ? 'confirmed' : 'pending_review',
        generationType: 'auto',
        createdBy: req.user?._id
      });
      generated++;

      // 👈 إنشاء فاتورة تلقائية للشهر
      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.create({
        client: contract.client,
        invoiceType: 'عقد شهري',
        totalAmount: contract.defaultMonthlyValue,
        currency: contract.currency,
        issueDate: now,
        dueDate: dueDate,
        status: 'مصدرة',
        notes: `فاتورة شهر ${currentMonth} - ${contract.title}`,
        items: [{
          description: `رسوم العقد الشهري - ${contract.title}`,
          quantity: 1,
          unitPrice: contract.defaultMonthlyValue,
          totalPrice: contract.defaultMonthlyValue
        }],
        createdBy: req.user?._id
      });

      contractMonth.invoice = invoice._id;
      await contractMonth.save();
    } else {
      skipped++;
    }
  }
  await updateAllContractStats();

  res.status(200).json({
    status: 'success',
    message: `تم توليد ${generated} فاتورة، تم تخطي ${skipped}`,
    data: { generated, skipped, month: currentMonth }
  });
});

// دالة مساعدة: تحديث إحصائيات العقد
const updateContractStats = async (contractId) => {
  const months = await ContractMonth.find({ contract: contractId });

  const stats = {
    totalMonths: months.length,
    paidMonths: months.filter(m => m.status === 'paid').length,
    pendingMonths: months.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
    totalValue: months.reduce((sum, m) => sum + m.value, 0),
    totalPaid: months.reduce((sum, m) => sum + m.paidAmount, 0)
  };
  stats.totalRemaining = stats.totalValue - stats.totalPaid;

  await Contract.findByIdAndUpdate(contractId, { computedStats: stats });
};

const updateAllContractStats = async () => {
  const Contract = require('../models/Contract');
  const ContractMonth = require('../models/ContractMonth');
  
  const contracts = await Contract.find();
  
  for (const contract of contracts) {
    const months = await ContractMonth.find({ contract: contract._id });
    
    const stats = {
      totalMonths: months.length,
      paidMonths: months.filter(m => m.status === 'paid').length,
      pendingMonths: months.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
      totalValue: months.reduce((sum, m) => sum + m.value, 0),
      totalPaid: months.reduce((sum, m) => sum + (m.paidAmount || 0), 0)
    };
    stats.totalRemaining = stats.totalValue - stats.totalPaid;

    await Contract.findByIdAndUpdate(contract._id, { computedStats: stats });
  }
};