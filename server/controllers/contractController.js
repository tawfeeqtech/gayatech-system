const Contract = require('../models/Contract');
const ContractMonth = require('../models/ContractMonth');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { updateClientStats } = require('../services/clientStatsService');

// @desc    الحصول على جميع العقود
// @route   GET /api/contracts
// @access  Private (admin, finance, pm)
exports.getContracts = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { serviceType: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const contracts = await Contract.find(filter)
    .populate('client', 'name company')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Contract.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: contracts.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { contracts }
  });
});

// @desc    الحصول على عقد واحد
// @route   GET /api/contracts/:id
// @access  Private
exports.getContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id)
    .populate('client', 'name company email phone');

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    إضافة عقد جديد
// @route   POST /api/contracts
// @access  Private (admin, pm)
exports.createContract = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const contract = await Contract.create(req.body);

  // توليد تلقائي فور التفعيل عند الإنشاء
  if (contract.status === 'نشط' && contract.autoGeneration && contract.autoGeneration.enabled) {
    const startDate = new Date(contract.startDate);
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth(), contract.dueDayOfMonth || 10);

    const contractMonth = await ContractMonth.create({
      contract: contract._id,
      client: contract.client,
      month: startMonth,
      value: contract.defaultMonthlyValue,
      currency: contract.currency,
      dueDate: dueDate,
      status: contract.autoGeneration.autoConfirm ? 'confirmed' : 'pending_review',
      generationType: 'auto',
      createdBy: req.user?._id
    });

    const Invoice = require('../models/Invoice');
    const invoice = await Invoice.create({
      client: contract.client,
      invoiceType: 'عقد شهري',
      totalAmount: contract.defaultMonthlyValue,
      currency: contract.currency,
      issueDate: new Date(),
      dueDate: dueDate,
      status: 'مصدرة',
      contractMonth: contractMonth._id,
      notes: `فاتورة شهر ${startMonth} - ${contract.title}`,
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

    // تحديث إحصائيات العقد
    const months = await ContractMonth.find({ contract: contract._id });
    const stats = {
      totalMonths: months.length,
      paidMonths: months.filter(m => m.status === 'paid').length,
      pendingMonths: months.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
      totalValue: months.reduce((sum, m) => sum + m.value, 0),
      totalPaid: months.reduce((sum, m) => sum + m.paidAmount, 0)
    };
    stats.totalRemaining = stats.totalValue - stats.totalPaid;

    contract.computedStats = stats;
    await contract.save();
  }

  // 👈 توليد جميع الأشهر من البداية حتى الشهر الحالي
  if (contract.status === 'نشط' && contract.autoGeneration && contract.autoGeneration.enabled) {
    const Invoice = require('../models/Invoice');
    
    const startDate = new Date(contract.startDate);
    const now = new Date();
    // Loop من شهر البداية حتى الشهر الحالي
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentDate <= now) {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const exists = await ContractMonth.findOne({
        contract: contract._id,
        month: month
      });
      
      if (!exists) {
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), contract.dueDayOfMonth || 10);
        
        const contractMonth = await ContractMonth.create({
          contract: contract._id,
          client: contract.client,
          month: month,
          value: contract.defaultMonthlyValue,
          currency: contract.currency,
          dueDate: dueDate,
          status: contract.autoGeneration.autoConfirm ? 'confirmed' : 'pending_review',
          generationType: 'auto',
          createdBy: req.user?._id
        });

        const invoice = await Invoice.create({
          client: contract.client,
          invoiceType: 'عقد شهري',
          totalAmount: contract.defaultMonthlyValue,
          currency: contract.currency,
          issueDate: currentDate,
          dueDate: dueDate,
          status: 'مصدرة',
          contractMonth: contractMonth._id,
          notes: `فاتورة شهر ${month} - ${contract.title}`,
          items: [{
            description: `رسوم العقد الشهري - ${contract.title} - ${month}`,
            quantity: 1,
            unitPrice: contract.defaultMonthlyValue,
            totalPrice: contract.defaultMonthlyValue
          }],
          createdBy: req.user?._id
        });

        contractMonth.invoice = invoice._id;
        await contractMonth.save();
      }
      
      // الشهر التالي
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // تحديث إحصائيات العقد
    const months = await ContractMonth.find({ contract: contract._id });
    const stats = {
      totalMonths: months.length,
      paidMonths: months.filter(m => m.status === 'paid').length,
      pendingMonths: months.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
      totalValue: months.reduce((sum, m) => sum + m.value, 0),
      totalPaid: months.reduce((sum, m) => sum + (m.paidAmount || 0), 0)
    };
    stats.totalRemaining = stats.totalValue - stats.totalPaid;

    contract.computedStats = stats;
    await contract.save();
  }

  // تحديث إحصائيات العميل
  const { updateClientStats } = require('./clientController');
  await updateClientStats(contract.client);

  res.status(201).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    تحديث عقد
// @route   PUT /api/contracts/:id
// @access  Private (admin, pm)
exports.updateContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  // 👈 توليد الأشهر المفقودة من البداية حتى الشهر الحالي
  if (contract.status === 'نشط' && contract.autoGeneration && contract.autoGeneration.enabled) {
    const Invoice = require('../models/Invoice');
    
    const startDate = new Date(contract.startDate);
    const now = new Date();
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let generatedCount = 0;
    
    while (currentDate <= now) {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const exists = await ContractMonth.findOne({
        contract: contract._id,
        month: month
      });
      
      if (!exists) {
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), contract.dueDayOfMonth || 10);
        
        const contractMonth = await ContractMonth.create({
          contract: contract._id,
          client: contract.client,
          month: month,
          value: contract.defaultMonthlyValue,
          currency: contract.currency,
          dueDate: dueDate,
          status: contract.autoGeneration.autoConfirm ? 'confirmed' : 'pending_review',
          generationType: 'auto',
          createdBy: req.user?._id
        });

        const invoice = await Invoice.create({
          client: contract.client,
          invoiceType: 'عقد شهري',
          totalAmount: contract.defaultMonthlyValue,
          currency: contract.currency,
          issueDate: currentDate,
          dueDate: dueDate,
          status: 'مصدرة',
          contractMonth: contractMonth._id,
          notes: `فاتورة شهر ${month} - ${contract.title}`,
          items: [{
            description: `رسوم العقد الشهري - ${contract.title} - ${month}`,
            quantity: 1,
            unitPrice: contract.defaultMonthlyValue,
            totalPrice: contract.defaultMonthlyValue
          }],
          createdBy: req.user?._id
        });

        contractMonth.invoice = invoice._id;
        await contractMonth.save();
        generatedCount++;
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // تحديث إحصائيات العقد
    if (generatedCount > 0) {
      const months = await ContractMonth.find({ contract: contract._id });
      const stats = {
        totalMonths: months.length,
        paidMonths: months.filter(m => m.status === 'paid').length,
        pendingMonths: months.filter(m => ['confirmed', 'overdue', 'partially_paid'].includes(m.status)).length,
        totalValue: months.reduce((sum, m) => sum + m.value, 0),
        totalPaid: months.reduce((sum, m) => sum + (m.paidAmount || 0), 0)
      };
      stats.totalRemaining = stats.totalValue - stats.totalPaid;

      contract.computedStats = stats;
      await contract.save();
    }
  }

  // تحديث إحصائيات العميل إذا تغيرت حالة العقد
  if (req.body.status) {
    const { updateClientStats } = require('./clientController');
    await updateClientStats(contract.client);
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    تغيير حالة العقد
// @route   PATCH /api/contracts/:id/status
// @access  Private (admin, pm)
exports.updateContractStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    حذف عقد
// @route   DELETE /api/contracts/:id
// @access  Private (admin)
exports.deleteContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  const clientId = contract.client;
  // حذف أشهر العقد
  await ContractMonth.deleteMany({ contract: req.params.id });
  await Contract.findByIdAndDelete(req.params.id);

  // 👈 تحديث إحصائيات العميل
  const Client = require('../models/Client');
  const Project = require('../models/Project');
  
  const [allContracts, allProjects] = await Promise.all([
    Contract.find({ client: clientId }),
    Project.find({ client: clientId })
  ]);

  await Client.findByIdAndUpdate(clientId, {
    computedStats: {
      totalContracts: allContracts.length,
      activeContracts: allContracts.filter(c => c.status === 'نشط').length,
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.status === 'قيد التنفيذ').length,
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'تم حذف العقد وجميع الأشهر المرتبطة به'
  });
});

// @desc    الحصول على أشهر العقد
// @route   GET /api/contracts/:id/months
// @access  Private
exports.getContractMonths = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  const months = await ContractMonth.find({ contract: req.params.id })
    .sort('-month');

  res.status(200).json({
    status: 'success',
    results: months.length,
    data: { months }
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
    totalPaid: months.reduce((sum, m) => sum + (m.paidAmount || 0), 0)
  };
  stats.totalRemaining = stats.totalValue - stats.totalPaid;

  await Contract.findByIdAndUpdate(contractId, { computedStats: stats });
  return stats;
};