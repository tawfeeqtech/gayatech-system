const Transaction = require('../models/Transaction');
const ContractMonth = require('../models/ContractMonth');
const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Partner = require('../models/Partner');
const Employee = require('../models/Employee');
const Expense = require('../models/Expense');
const Subscription = require('../models/Subscription');
const Account = require('../models/Account');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الإيرادات الشهرية
// @route   GET /api/reports/monthly-revenue
exports.getMonthlyRevenue = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const revenue = await Transaction.aggregate([
    {
      $match: {
        type: 'دخل',
        nature: 'خارجي',
        status: 'مكتمل',
        transactionDate: {
          $gte: new Date(`${targetYear}-01-01`),
          $lte: new Date(`${targetYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$transactionDate' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({ status: 'success', data: { year: targetYear, revenue } });
});

// @desc    المصاريف الشهرية
// @route   GET /api/reports/monthly-expenses
exports.getMonthlyExpenses = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const expenses = await Expense.aggregate([
    {
      $match: {
        status: 'مدفوع',
        expenseDate: {
          $gte: new Date(`${targetYear}-01-01`),
          $lte: new Date(`${targetYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$expenseDate' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({ status: 'success', data: { year: targetYear, expenses } });
});

// @desc    الأرباح والخسائر
// @route   GET /api/reports/profit-loss
exports.getProfitLoss = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate || `${new Date().getFullYear()}-01-01`);
  const end = new Date(endDate || new Date());

  const [income, expense] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'دخل', nature: 'خارجي', status: 'مكتمل', transactionDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { status: 'مدفوع', expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalIncome = income[0]?.total || 0;
  const totalExpense = expense[0]?.total || 0;

  res.status(200).json({
    status: 'success',
    data: {
      period: { start, end },
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0
    }
  });
});

// @desc    الديون المستحقة
// @route   GET /api/reports/outstanding-debts
exports.getOutstandingDebts = asyncHandler(async (req, res) => {
  const contractMonths = await ContractMonth.find({
    status: { $in: ['confirmed', 'overdue', 'partially_paid'] }
  })
    .populate('client', 'name company phone')
    .populate('contract', 'title')
    .sort('dueDate');

  const total = contractMonths.reduce((sum, cm) => sum + (cm.value - cm.paidAmount), 0);

  res.status(200).json({
    status: 'success',
    results: contractMonths.length,
    totalOutstanding: total,
    data: { debts: contractMonths }
  });
});

// @desc    أرصدة العملاء
// @route   GET /api/reports/client-balances
exports.getClientBalances = asyncHandler(async (req, res) => {
  const clients = await Client.find()
    .select('name company phone computedStats')
    .sort('name');

  res.status(200).json({ status: 'success', results: clients.length, data: { clients } });
});

// @desc    أرصدة الشركاء
// @route   GET /api/reports/partner-balances
exports.getPartnerBalances = asyncHandler(async (req, res) => {
  const partners = await Partner.find()
    .select('name partnerType phone computedStats')
    .sort('name');

  res.status(200).json({ status: 'success', results: partners.length, data: { partners } });
});

// @desc    أداء الموظفين
// @route   GET /api/reports/employee-performance
exports.getEmployeePerformance = asyncHandler(async (req, res) => {
  const employees = await Employee.find()
    .select('name jobTitle department computedStats')
    .sort('name');

  res.status(200).json({ status: 'success', results: employees.length, data: { employees } });
});

// @desc    المشاريع المنجزة
// @route   GET /api/reports/completed-projects
exports.getCompletedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ status: { $in: ['مكتمل', 'تم التسليم'] } })
    .populate('client', 'name')
    .sort('-updatedAt');

  res.status(200).json({ status: 'success', results: projects.length, data: { projects } });
});

// @desc    العقود النشطة
// @route   GET /api/reports/active-contracts
exports.getActiveContracts = asyncHandler(async (req, res) => {
  const contracts = await Contract.find({ status: 'نشط' })
    .populate('client', 'name company')
    .sort('startDate');

  res.status(200).json({ status: 'success', results: contracts.length, data: { contracts } });
});

// @desc    حركة صندوق ريم
// @route   GET /api/reports/reem-movements
exports.getReemMovements = asyncHandler(async (req, res) => {
  const reemAccount = await Account.findOne({ name: 'صندوق ريم' });

  if (!reemAccount) {
    return res.status(200).json({ status: 'success', data: { movements: [], balance: 0 } });
  }

  const movements = await Transaction.find({
    status: 'مكتمل',
    $or: [{ fromAccount: reemAccount._id }, { toAccount: reemAccount._id }]
  })
    .populate('client', 'name')
    .sort('-transactionDate')
    .limit(50);

  const totalIn = await Transaction.aggregate([
    { $match: { toAccount: reemAccount._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalOut = await Transaction.aggregate([
    { $match: { fromAccount: reemAccount._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const balance = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

  res.status(200).json({ status: 'success', data: { movements, balance } });
});

// @desc    حركة حساب الشركة
// @route   GET /api/reports/company-account
exports.getCompanyAccountMovements = asyncHandler(async (req, res) => {
  const companyAccount = await Account.findOne({ name: 'حساب الشركة' });

  if (!companyAccount) {
    return res.status(200).json({ status: 'success', data: { movements: [], balance: 0 } });
  }

  const movements = await Transaction.find({
    status: 'مكتمل',
    $or: [{ fromAccount: companyAccount._id }, { toAccount: companyAccount._id }]
  })
    .populate('client', 'name')
    .sort('-transactionDate')
    .limit(50);

  const totalIn = await Transaction.aggregate([
    { $match: { toAccount: companyAccount._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalOut = await Transaction.aggregate([
    { $match: { fromAccount: companyAccount._id, status: 'مكتمل' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const balance = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

  res.status(200).json({ status: 'success', data: { movements, balance } });
});

// @desc    تحليل مصادر الدخل
// @route   GET /api/reports/income-sources
exports.getIncomeSourcesAnalysis = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();

  const incomeBySource = await Transaction.aggregate([
    {
      $match: {
        type: 'دخل',
        nature: 'خارجي',
        status: 'مكتمل',
        transactionDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const totalIncome = incomeBySource.reduce((sum, s) => sum + s.total, 0);

  res.status(200).json({
    status: 'success',
    data: { period: { start, end }, totalIncome, sources: incomeBySource }
  });
});

// @desc    تقرير الاشتراكات
// @route   GET /api/reports/subscriptions
exports.getSubscriptionsReport = asyncHandler(async (req, res) => {
  const [active, expiringSoon, expired] = await Promise.all([
    Subscription.countDocuments({ status: 'نشط' }),
    Subscription.countDocuments({ endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $gte: new Date() }, status: 'نشط' }),
    Subscription.countDocuments({ endDate: { $lt: new Date() }, status: { $in: ['نشط', 'بانتظار التجديد'] } })
  ]);

  const allSubscriptions = await Subscription.find().sort('endDate');

  res.status(200).json({
    status: 'success',
    data: {
      summary: { active, expiringSoon, expired, total: allSubscriptions.length },
      subscriptions: allSubscriptions
    }
  });
});