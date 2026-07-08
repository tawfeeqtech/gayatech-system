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

  let contracts = await Contract.find(filter)
    .populate('client', 'name company')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  // إخفاء البيانات المالية عن مدير المشاريع
  if (req.user.role === 'pm') {
    contracts = contracts.map(c => {
      const obj = c.toObject();
      delete obj.defaultMonthlyValue;
      delete obj.computedStats;
      delete obj.currency;
      return obj;
    });
  }

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

  // إخفاء البيانات المالية عن مدير المشاريع
  if (req.user.role === 'pm') {
    const obj = contract.toObject();
    delete obj.defaultMonthlyValue;
    delete obj.computedStats;
    delete obj.currency;
    return res.status(200).json({
      status: 'success',
      data: { contract: obj }
    });
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
    // استخراج الشهر من ISO string (UTC) بدلاً من getFullYear/getMonth
    // لتجنب مشاكل timezone (2026-01-01T00:00+02:00 → 2025-12-31T22:00Z)
    const startISO = startDate.toISOString().slice(0, 10);
    const [sYear, sMonth] = startISO.split('-').map(Number);
    let currentDate = new Date(Date.UTC(sYear, sMonth - 1, 1, 12, 0, 0));
    // تحديد الحد الأقصى: تاريخ النهاية (إن وجد) أو الشهر الحالي
    const endLimit = contract.endDate 
      ? new Date(Date.UTC(contract.endDate.getUTCFullYear(), contract.endDate.getUTCMonth(), 1, 12, 0, 0))
      : now;
    
    while (currentDate <= endLimit) {
      const month = `${String(currentDate.getUTCFullYear()).padStart(4, '0')}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;

      const exists = await ContractMonth.findOne({
        contract: contract._id,
        month: month
      });

      if (!exists) {
        const dueDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), contract.dueDayOfMonth || 10, 12, 0, 0));

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
      currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1, 12, 0, 0));
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
  // const { updateClientStats } = require('./clientController');
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
  // 🟢 نجيب العقد القديم أولاً عشان نقارن القيم قبل التحديث
  const oldContract = await Contract.findById(req.params.id);
  if (!oldContract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  // 👈 توليد الأشهر المفقودة من البداية حتى الشهر الحالي
  if (contract.status === 'نشط' && contract.autoGeneration && contract.autoGeneration.enabled) {
    const Invoice = require('../models/Invoice');
    
    const startDate = new Date(contract.startDate);
    const now = new Date();
    const startISO = startDate.toISOString().slice(0, 10);
    const [sYear, sMonth] = startISO.split('-').map(Number);
    let currentDate = new Date(Date.UTC(sYear, sMonth - 1, 1, 12, 0, 0));
    // تحديد الحد الأقصى: تاريخ النهاية (إن وجد) أو الشهر الحالي
    const endLimit = contract.endDate 
      ? new Date(Date.UTC(contract.endDate.getUTCFullYear(), contract.endDate.getUTCMonth(), 1, 12, 0, 0))
      : now;
    let generatedCount = 0;
    
    while (currentDate <= endLimit) {
      const month = `${String(currentDate.getUTCFullYear()).padStart(4, '0')}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;

      const exists = await ContractMonth.findOne({
        contract: contract._id,
        month: month
      });

      if (!exists) {
        const dueDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), contract.dueDayOfMonth || 10, 12, 0, 0));

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
      
      // الشهر التالي
      currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1, 12, 0, 0));
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
    // تحديث أشهر العقد المرتبطة إذا تغيرت القيمة الشهرية
    const { defaultMonthlyValue, currency } = req.body;
    if (defaultMonthlyValue !== undefined || currency !== undefined) {
      const Invoice = require('../models/Invoice');
      const monthsToUpdate = await ContractMonth.find({
        contract: contract._id,
        status: { $in: ['pending_review', 'confirmed', 'partial'] }
      });
      
      let monthsUpdated = 0;
      for (const m of monthsToUpdate) {
        const oldValue = m.value;
        const oldCurrency = m.currency;
        if (defaultMonthlyValue !== undefined) m.value = defaultMonthlyValue;
        if (currency !== undefined) m.currency = currency;
        await m.save();
        
        if (m.invoice) {
          const invoice = await Invoice.findById(m.invoice);
          if (invoice && invoice.status !== 'مدفوعة') {
            if (defaultMonthlyValue !== undefined) invoice.totalAmount = defaultMonthlyValue;
            if (currency !== undefined) invoice.currency = currency;
            
            // بناء ملاحظة ذكية حسب الحقول اللي تغيرت فعلاً
            let changes = [];
            if (defaultMonthlyValue !== undefined && Number(oldValue) !== Number(defaultMonthlyValue)) {
              changes.push('القيمة: ' + oldValue + ' ' + (currency || oldCurrency) + ' -> ' + defaultMonthlyValue + ' ' + (currency || oldCurrency));
            }
            if (currency !== undefined && oldCurrency !== currency) {
              changes.push('العملة: ' + oldCurrency + ' -> ' + currency);
            }
            
            if (changes.length > 0) {
              const note = 'تم تعديل العقد - ' + changes.join('، ') + ' (' + new Date().toISOString().slice(0,10) + ')';
              invoice.notes = invoice.notes ? invoice.notes + '\n' + note : note;
              await invoice.save();
            }
          }
        }
        monthsUpdated++;
      }
      
      if (monthsUpdated > 0) {
        console.log('[Contract] تم تحديث ' + monthsUpdated + ' شهر عقد بعد تعديل القيمة');
      }
    }
    // إذا تغير تاريخ النهاية — حذف أو إضافة الفواتير حسب النطاق الجديد
    if (req.body.endDate !== undefined) {
      const Invoice = require('../models/Invoice');
      const newEndDate = new Date(req.body.endDate);
      newEndDate.setHours(12, 0, 0, 0);
      const newEndMonth = String(newEndDate.getUTCFullYear()) + '-' + String(newEndDate.getUTCMonth() + 1).padStart(2, '0');
      
      const oldEndDate = oldContract.endDate ? new Date(oldContract.endDate) : null;
      let oldEndMonth = null;
      if (oldEndDate) {
        oldEndDate.setHours(12, 0, 0, 0);
        oldEndMonth = String(oldEndDate.getUTCFullYear()) + '-' + String(oldEndDate.getUTCMonth() + 1).padStart(2, '0');
      }
      
      if (req.body.endDate === null) {
        // النهاية أصبحت مفتوحة — توليد الأشهر المفقودة حتى الشهر الحالي
        await generateMonthsUpTo(contract, new Date());
      } else if (oldEndMonth && newEndMonth < oldEndMonth) {
        // تقليص المدة — حذف أشهر العقد وفواتيرها (غير المدفوعة) بعد تاريخ النهاية الجديد
        const monthsToDelete = await ContractMonth.find({
          contract: contract._id,
          status: { $ne: 'paid' },
          $expr: {
            $gt: [
              { $dateFromString: { dateString: { $concat: ['$month', '-01'] }, format: '%Y-%m-%d' } },
              newEndDate
            ]
          }
        });
        
        let deletedInvoiceCount = 0;
        let deletedMonthCount = 0;
        for (const m of monthsToDelete) {
          if (m.invoice) {
            const inv = await Invoice.findById(m.invoice);
            if (inv && inv.paidAmount === 0 && inv.status !== 'مدفوعة') {
              // احذف الفاتورة إذا غير مدفوعة (أي حالة: مصدرة، مسودة، متأخرة...)
              await Invoice.findByIdAndDelete(m.invoice);
              deletedInvoiceCount++;
            }
          }
          await ContractMonth.findByIdAndDelete(m._id);
          deletedMonthCount++;
        }
        
        if (deletedMonthCount > 0) {
          console.log('[Contract] تم حذف ' + deletedMonthCount + ' شهر عقد و ' + deletedInvoiceCount + ' فاتورة بعد تعديل تاريخ النهاية');
        }
      } else if (newEndMonth > (oldEndMonth || '0000-00')) {
        // توسيع المدة — توليد أشهر جديدة
        const now = new Date();
        const endLimit = newEndDate < now ? newEndDate : now;
        await generateMonthsUpTo(contract, endLimit);
      }
    }

    // تسجيل التغيير في changeLog
    const changedFields = [];
    const changeableFields = ['defaultMonthlyValue', 'currency', 'title', 'description', 'serviceType', 'startDate', 'endDate', 'dueDayOfMonth', 'status'];
    for (const field of changeableFields) {
      if (req.body[field] === undefined) continue;
      
      let oldVal = oldContract[field];
      let newVal = req.body[field];
      
      // توحيد تنسيق التواريخ قبل المقارنة (مقارنة YYYY-MM-DD فقط)
      if (field === 'startDate' || field === 'endDate') {
        oldVal = oldVal ? new Date(oldVal).toISOString().slice(0, 10) : null;
        newVal = newVal ? newVal.slice(0, 10) : null;
      }
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changedFields.push({
          field,
          oldValue: oldContract[field],
          newValue: req.body[field],
          changedBy: req.user?._id,
          changedAt: new Date(),
          reason: req.body.changeReason || ''
        });
      }
    }
    if (changedFields.length > 0) {
      await Contract.findByIdAndUpdate(contract._id, { $push: { changeLog: { $each: changedFields } } });
    }

    // تحديث إحصائيات العميل إذا تغيرت حالة العقد
  if (req.body.status) {
    await updateClientStats(contract.client);
  }

  // إعادة جلب العقد بعد تحديث changeLog
  const updatedContract = await Contract.findById(contract._id)
    .populate('client', 'name company email phone');

  res.status(200).json({
    status: 'success',
    data: { contract: updatedContract }
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

  // حذف الفواتير المرتبطة بأشهر العقد
  const Invoice = require('../models/Invoice');
  const months = await ContractMonth.find({ contract: req.params.id });
  for (const month of months) {
    if (month.invoice) {
      await Invoice.findByIdAndDelete(month.invoice);
    }
  }

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

    // 👈 تحديث إحصائيات العميل
  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(clientId);


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

// دالة مساعدة: توليد أشهر عقد من البداية حتى تاريخ معين
const generateMonthsUpTo = async (contract, endDate) => {
  const startDate = new Date(contract.startDate);
  const Invoice = require('../models/Invoice');
  
  const startISO = startDate.toISOString().slice(0, 10);
  const [sYear, sMonth] = startISO.split('-').map(Number);
  let currentDate = new Date(Date.UTC(sYear, sMonth - 1, 1, 12, 0, 0));
  const endLimit = contract.endDate && contract.endDate < endDate
    ? new Date(Date.UTC(contract.endDate.getUTCFullYear(), contract.endDate.getUTCMonth(), 1, 12, 0, 0))
    : endDate;
  
  let generated = 0;
  while (currentDate <= endLimit) {
    const month = String(currentDate.getUTCFullYear()).padStart(4, '0') + '-' + String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    
    const exists = await ContractMonth.findOne({ contract: contract._id, month });
    if (!exists) {
      const dueDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), contract.dueDayOfMonth || 10, 12, 0, 0));
      const contractMonth = await ContractMonth.create({
        contract: contract._id,
        client: contract.client,
        month,
        value: contract.defaultMonthlyValue,
        currency: contract.currency,
        dueDate,
        status: 'pending_review',
        generationType: 'auto',
        createdBy: null
      });

      const invoice = await Invoice.create({
        client: contract.client,
        invoiceType: 'عقد شهري',
        totalAmount: contract.defaultMonthlyValue,
        currency: contract.currency,
        issueDate: currentDate,
        dueDate,
        status: 'مصدرة',
        contractMonth: contractMonth._id,
        notes: 'فاتورة شهر ' + month + ' - ' + contract.title,
        items: [{
          description: 'رسوم العقد الشهري - ' + contract.title + ' - ' + month,
          quantity: 1,
          unitPrice: contract.defaultMonthlyValue,
          totalPrice: contract.defaultMonthlyValue
        }],
        createdBy: null
      });

      contractMonth.invoice = invoice._id;
      await contractMonth.save();
      generated++;
    }
    
    currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1, 12, 0, 0));
  }
  
  if (generated > 0) {
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
  
  return generated;
};

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

// @desc    حذف entries محددة من سجل التعديلات
// @route   DELETE /api/contracts/:id/changes
// @access  Private (admin)
exports.deleteChangeLogEntries = asyncHandler(async (req, res, next) => {
  const { entryIds } = req.body;
  
  if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
    return next(new ApiError('يرجى تحديد السجلات المطلوب حذفها', 400));
  }

  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  // 1. حفظ السجلات المطلوب حذفها قبل الحذف
  const deletedEntries = contract.changeLog.filter(entry =>
    entryIds.some(id => String(entry._id) === String(id))
  );

  // 2. حذف السجلات من changeLog
  let deletedCount = 0;
  contract.changeLog = contract.changeLog.filter(entry => {
    const shouldDelete = entryIds.some(id => String(entry._id) === String(id));
    if (shouldDelete) deletedCount++;
    return !shouldDelete;
  });
  
  await contract.save();

  // 3. حذف الملاحظات المرتبطة من الفواتير
  if (deletedEntries.length > 0) {
    const Invoice = require('../models/Invoice');
    const ContractMonth = require('../models/ContractMonth');
    
    const months = await ContractMonth.find({ 
      contract: contract._id,
      invoice: { $ne: null }
    });
    
    const invoiceIds = months.map(m => m.invoice).filter(Boolean);
    
    if (invoiceIds.length > 0) {
      const invoices = await Invoice.find({ _id: { $in: invoiceIds } });
      
      for (const entry of deletedEntries) {
        // بناء نمط للمطابقة في الملاحظات
        let notePattern = null;
        if (entry.field === 'defaultMonthlyValue' || entry.field === 'currency') {
          const oldVal = entry.oldValue !== undefined ? entry.oldValue : '';
          const newVal = entry.newValue !== undefined ? entry.newValue : '';
          const ccy = contract.currency || '';
          notePattern = oldVal + ' ' + ccy + ' -> ' + newVal + ' ' + ccy;
        } else {
          notePattern = String(entry.oldValue !== undefined ? entry.oldValue : '') + ' -> ' + String(entry.newValue !== undefined ? entry.newValue : '');
        }
        
        if (notePattern) {
          for (const inv of invoices) {
            if (inv.notes) {
              const lines = inv.notes.split('\n').filter(line => !line.includes(notePattern));
              if (lines.length !== inv.notes.split('\n').length) {
                inv.notes = lines.join('\n');
                await inv.save();
              }
            }
          }
        }
      }
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: 'تم حذف ' + deletedCount + ' سجل من سجل التعديلات والملاحظات المرتبطة'
  });
});
