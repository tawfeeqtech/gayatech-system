const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { updateClientStats } = require('../services/clientStatsService');

// @desc    الحصول على جميع العملاء
// @route   GET /api/clients
// @access  Private (admin, finance, pm, accountant)
exports.getClients = asyncHandler(async (req, res, next) => {
  // فلترة
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.clientType) {
    filter.clientType = req.query.clientType;
  }
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // ترتيب
  const sortBy = req.query.sortBy || '-createdAt';
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const clients = await Client.find(filter)
    .populate('source', 'name')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Client.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: clients.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { clients }
  });
});

// @desc    الحصول على عميل واحد
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id)
    .populate('source', 'name');

  if (!client) {
    return next(new ApiError('العميل غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { client }
  });
});

// @desc    إضافة عميل جديد
// @route   POST /api/clients
// @access  Private (admin, pm)
exports.createClient = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const client = await Client.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { client }
  });
});

// @desc    تحديث عميل
// @route   PUT /api/clients/:id
// @access  Private (admin, pm)
exports.updateClient = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user._id;

  const client = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!client) {
    return next(new ApiError('العميل غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { client }
  });
});

// @desc    حذف عميل
// @route   DELETE /api/clients/:id
// @access  Private (admin only)
exports.deleteClient = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return next(new ApiError('العميل غير موجود', 404));
  }

  // تحقق من وجود عقود أو مشاريع مرتبطة
  const Contract = require('../models/Contract');
  const Project = require('../models/Project');
  
  const hasContracts = await Contract.exists({ client: req.params.id });
  const hasProjects = await Project.exists({ client: req.params.id });

  if (hasContracts || hasProjects) {
    return next(
      new ApiError('لا يمكن حذف العميل لوجود عقود أو مشاريع مرتبطة به. قم بحذفها أولاً أو تعطيل العميل.', 400)
    );
  }

  await Client.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف العميل بنجاح'
  });
});

// @desc    الحصول على إحصائيات العميل
// @route   GET /api/clients/:id/stats
// @access  Private
exports.getClientStats = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id);
  if (!client) return next(new ApiError('العميل غير موجود', 404));

  const Contract = require('../models/Contract');
  const Project = require('../models/Project');
  const Transaction = require('../models/Transaction');
  const Invoice = require('../models/Invoice');

  const [contracts, projects, transactions, invoices] = await Promise.all([
    Contract.find({ client: req.params.id }).select('status'), 
    Project.find({ client: req.params.id }).select('status currency totalValue'), 
    Transaction.find({ client: req.params.id }).select('transactionDate'), 
    Invoice.find({ client: req.params.id }).select('currency totalAmount paidAmount project') 
  ]);

  const balances = {};
  const details = {};
  const projectIdsWithInvoices = new Set(); 
  
  invoices.forEach(inv => {
    const currency = inv.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += inv.totalAmount || 0;
    details[currency].paid += inv.paidAmount || 0;
    
    if (inv.project) {
      projectIdsWithInvoices.add(inv.project.toString()); 
    }
  });
  
  //  استخدم Set للتحقق
  projects.forEach(p => {
    if (!projectIdsWithInvoices.has(p._id.toString())) {
      const currency = p.currency || 'USD';
      if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
      details[currency].invoiced += p.totalValue || 0;
    }
  });

  Object.keys(details).forEach(currency => {
    balances[currency] = (details[currency].paid || 0) - (details[currency].invoiced || 0);
  });

  const totalInvoiced = Object.values(details).reduce((sum, d) => sum + (d.invoiced || 0), 0);
  const totalPaid = Object.values(details).reduce((sum, d) => sum + (d.paid || 0), 0);

  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'نشط').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'قيد التنفيذ').length,
    totalTransactions: transactions.length,
    totalInvoiced, totalPaid, balances, details,
    lastTransaction: transactions.length > 0 
      ? transactions.sort((a, b) => b.transactionDate - a.transactionDate)[0] : null
  };

  await Client.findByIdAndUpdate(req.params.id, {
    computedStats: {
      ...client.computedStats,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'نشط').length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'قيد التنفيذ').length,
      totalInvoiced, totalPaid,
      balance: totalPaid - totalInvoiced,
      balances, details,
    }
  });

  res.status(200).json({ status: 'success', data: { stats } });
});

// @desc    الحصول على عقود العميل
// @route   GET /api/clients/:id/contracts
// @access  Private
exports.getClientContracts = asyncHandler(async (req, res, next) => {
  const Contract = require('../models/Contract');
  
  const contracts = await Contract.find({ client: req.params.id })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: contracts.length,
    data: { contracts }
  });
});

// @desc    تحديث إحصائيات جميع العملاء
// @route   POST /api/clients/update-all-stats
// @access  Private (admin)
exports.updateAllClientStats = asyncHandler(async (req, res, next) => {
  const Client = require('../models/Client');
  const clients = await Client.find();
  let updated = 0;

  for (const client of clients) {
    try {
      await updateClientStats(client._id);
      updated++;
    } catch (e) {
      console.error(`Failed: ${client._id}`);
    }
  }

  res.status(200).json({
    status: 'success',
    message: `تم تحديث ${updated} من ${clients.length} عميل`,
    data: { updated, total: clients.length }
  });
});

// @desc    الحصول على مشاريع العميل
// @route   GET /api/clients/:id/projects
// @access  Private
exports.getClientProjects = asyncHandler(async (req, res, next) => {
  const Project = require('../models/Project');
  
  const projects = await Project.find({ client: req.params.id })
    .populate('team.employee', 'name jobTitle')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: { projects }
  });
});

// @desc    الحصول على معاملات العميل
// @route   GET /api/clients/:id/transactions
// @access  Private
exports.getClientTransactions = asyncHandler(async (req, res, next) => {
  const Transaction = require('../models/Transaction');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({ client: req.params.id })
    .populate('invoice', 'invoiceNumber')
    .populate('project', 'title')
    .sort('-transactionDate')
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments({ client: req.params.id });

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { transactions }
  });
});