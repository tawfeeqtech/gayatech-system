const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Client = require('../models/Client');
const Wallet = require('../models/Wallet');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Advance = require('../models/Advance');
const asyncHandler = require('../utils/asyncHandler');

// ======================== ADMIN DASHBOARD ========================

exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // 1. الإيرادات الشهرية
  const [monthlyRevenue, lastMonthRevenue] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: lastMonth, $lt: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const revenue = monthlyRevenue[0]?.total || 0;
  const prevRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueChange = prevRevenue ? ((revenue - prevRevenue) / prevRevenue * 100) : 0;

  // 2. المصاريف الشهرية
  const [monthlyExpenses, lastMonthExpenses] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'expense', date: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { type: 'expense', date: { $gte: lastMonth, $lt: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const expenses = monthlyExpenses[0]?.total || 0;
  const prevExpenses = lastMonthExpenses[0]?.total || 0;
  const expensesChange = prevExpenses ? ((expenses - prevExpenses) / prevExpenses * 100) : 0;

  // 3. صافي الربح
  const netProfit = revenue - expenses;
  const prevNetProfit = prevRevenue - prevExpenses;
  const profitChange = prevNetProfit ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit) * 100) : 0;

  // 4. رصيد الشركة (كل المحافظ)
  const wallets = await Wallet.aggregate([
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]);
  const totalBalance = wallets[0]?.total || 0;

  // 5. العقود النشطة
  const activeContracts = await Contract.countDocuments({ status: 'active' });

  // 6. المشاريع النشطة
  const activeProjects = await Project.countDocuments({ status: 'active' });

  // 7. العملاء النشطون
  const activeClients = await Client.countDocuments({ isActive: true });

  // 8. فواتير متأخرة
  const overdueInvoices = await Invoice.aggregate([
    { $match: { status: { $in: ['مصدرة', 'مرسلة'] }, dueDate: { $lt: now } } },
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }
  ]);
  const overdueCount = overdueInvoices[0]?.count || 0;
  const overdueTotal = overdueInvoices[0]?.total || 0;

  // 9. رسم بياني: الإيرادات والمصاريف (آخر 12 شهر)
  const monthlyChart = await getMonthlyChart();

  // 10. توزيع الدخل حسب المصدر
  const incomeBySource = await Transaction.aggregate([
    { $match: { type: 'income', date: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } }
  ]);

  // 11. أرصدة الحسابات
  const accounts = await Wallet.find({}).populate('account', 'name').lean();
  const accountBalances = accounts.map(w => ({
    name: w.account?.name || w.name || 'غير معروف',
    balance: w.balance,
    currency: w.currency
  }));

  // 12. أداء المشاريع (حسب الحالة)
  const projectStatus = await Project.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 13. تنبيهات سريعة
  const alerts = [];
  if (overdueCount > 0) {
    alerts.push({
      type: 'warning',
      message: `${overdueCount} فواتير متأخرة (إجمالي $${overdueTotal.toLocaleString()})`,
      icon: '⚠️'
    });
  }
  // فحص اشتراكات تنتهي قريباً
  const Subscription = require('../models/Subscription');
  const expiringSubs = await Subscription.countDocuments({
    endDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    status: 'active'
  });
  if (expiringSubs > 0) {
    alerts.push({
      type: 'info',
      message: `${expiringSubs} اشتراكات تنتهي خلال 30 يوم`,
      icon: '🔄'
    });
  }

  // 14. آخر 5 معاملات
  const recentTransactions = await Transaction.find({ status: { $ne: 'cancelled' } })
    .sort({ date: -1 })
    .limit(5)
    .populate('client', 'name')
    .populate('project', 'name')
    .lean();

  res.json({
    status: 'success',
    data: {
      stats: {
        revenue: { value: revenue, change: Math.round(revenueChange * 10) / 10, trend: revenueChange >= 0 ? 'up' : 'down' },
        expenses: { value: expenses, change: Math.round(expensesChange * 10) / 10, trend: expensesChange <= 0 ? 'up' : 'down' },
        netProfit: { value: netProfit, change: Math.round(profitChange * 10) / 10, trend: profitChange >= 0 ? 'up' : 'down' },
        totalBalance: { value: totalBalance },
        activeContracts: { value: activeContracts },
        activeProjects: { value: activeProjects },
        activeClients: { value: activeClients },
        overdueInvoices: { count: overdueCount, total: overdueTotal }
      },
      charts: {
        monthly: monthlyChart,
        incomeBySource,
        projectStatus,
        accountBalances
      },
      alerts,
      recentTransactions: recentTransactions.map(t => ({
        id: t._id,
        number: t.transactionNumber,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        clientName: t.client?.name || '',
        projectName: t.project?.name || '',
        date: t.date
      }))
    }
  });
});

// ======================== FINANCE DASHBOARD ========================

exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenue, expenses, wallets, pendingInvoices, recentCollections] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { type: 'expense', date: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Invoice.find({ status: { $in: ['مصدرة', 'مرسلة'] } }).sort({ dueDate: 1 }).limit(10).populate('client', 'name').lean(),
    Transaction.find({ type: 'income', status: { $ne: 'cancelled' } }).sort({ date: -1 }).limit(5).populate('client', 'name').lean()
  ]);

  const monthlyRev = revenue[0]?.total || 0;
  const monthlyExp = expenses[0]?.total || 0;
  const debts = await Invoice.aggregate([
    { $match: { status: { $in: ['مصدرة', 'مرسلة'] } } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
  ]);

  // توزيع المصاريف
  const expensesByCategory = await Expense.aggregate([
    { $match: { date: { $gte: thisMonth } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const monthlyChart = await getMonthlyChart();

  res.json({
    status: 'success',
    data: {
      stats: {
        revenue: monthlyRev,
        expenses: monthlyExp,
        netProfit: monthlyRev - monthlyExp,
        totalDebt: debts[0]?.total || 0,
        debtCount: debts[0]?.count || 0
      },
      balance: wallets[0]?.total || 0,
      charts: { monthly: monthlyChart, expensesByCategory },
      pendingInvoices,
      recentCollections
    }
  });
});

// ======================== PM DASHBOARD ========================

exports.getPMDashboard = asyncHandler(async (req, res) => {
  const [projects, activeProjects, completedProjects, activeContracts, endedContracts, activeClients, pendingTasks] = await Promise.all([
    Project.find({}).lean(),
    Project.countDocuments({ status: 'active' }),
    Project.countDocuments({ status: 'completed' }),
    Contract.countDocuments({ status: 'active' }),
    Contract.countDocuments({ status: 'ended' }),
    Client.countDocuments({ isActive: true }),
    Project.aggregate([
      { $unwind: { path: '$tasks', preserveNullAndEmptyArrays: true } },
      { $match: { 'tasks.status': { $in: ['pending', 'in_progress'] } } },
      { $count: 'total' }
    ])
  ]);

  const projectStatusDistribution = await Project.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    status: 'success',
    data: {
      stats: {
        activeProjects,
        completedProjects,
        activeContracts,
        endedContracts,
        activeClients,
        pendingTasks: pendingTasks[0]?.total || 0
      },
      projectStatus: projectStatusDistribution,
      projects: projects.slice(0, 10)
    }
  });
});

// ======================== ACCOUNTANT DASHBOARD ========================

exports.getAccountantDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingInvoices, monthlyExpenses, pendingPayments, wallets, recentExpenses, expensesByCategory] = await Promise.all([
    Invoice.countDocuments({ status: { $in: ['مصدرة', 'مرسلة'] } }),
    Expense.aggregate([
      { $match: { date: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Invoice.countDocuments({ status: 'مدفوعة جزئياً' }),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Expense.find({}).sort({ date: -1 }).limit(10).populate('category').lean(),
    Expense.aggregate([
      { $match: { date: { $gte: thisMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ])
  ]);

  const dueInvoices = await Invoice.find({ status: { $in: ['مصدرة', 'مرسلة'] }, dueDate: { $gte: now } })
    .sort({ dueDate: 1 }).limit(10).populate('client', 'name').lean();

  res.json({
    status: 'success',
    data: {
      stats: {
        pendingInvoices,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
        pendingPayments,
        totalBalance: wallets[0]?.total || 0
      },
      charts: { expensesByCategory },
      dueInvoices,
      recentExpenses
    }
  });
});

// ======================== EMPLOYEE DASHBOARD ========================

exports.getEmployeeDashboard = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId;

  if (!employeeId) {
    return res.json({
      status: 'success',
      data: {
        stats: { salary: 0, advance: 0, activeTasks: 0, completedTasks: 0 },
        tasks: [],
        salaries: [],
        advances: []
      }
    });
  }

  const [employee, advances, salaries] = await Promise.all([
    Employee.findById(employeeId).lean(),
    Advance.find({ employeeId, status: { $ne: 'cancelled' } }).lean(),
    require('../models/Salary').find({ employeeId }).sort({ month: -1 }).limit(6).lean()
  ]);

  const pendingAdvances = advances.reduce((sum, a) => {
    const paid = a.payments?.reduce((p, pmt) => p + pmt.amount, 0) || 0;
    return sum + (a.amount - paid);
  }, 0);

  const recentSalaries = salaries.map(s => ({
    month: s.month,
    year: s.year,
    amount: s.netSalary,
    status: s.status
  }));

  // المهام من المشاريع
  const projects = await Project.find({
    'team.employee': employeeId
  }).lean();

  let activeTasks = 0;
  let completedTasks = 0;
  const myTasks = [];

  projects.forEach(p => {
    (p.tasks || []).forEach(t => {
      if (t.assignedTo?.toString() === employeeId?.toString()) {
        if (t.status === 'completed') completedTasks++;
        else activeTasks++;
        myTasks.push({
          id: t._id,
          title: t.title,
          status: t.status,
          projectName: p.name,
          dueDate: t.dueDate
        });
      }
    });
  });

  res.json({
    status: 'success',
    data: {
      stats: {
        salary: employee?.salary || 0,
        advance: pendingAdvances,
        activeTasks,
        completedTasks
      },
      tasks: myTasks.slice(0, 10),
      salaries: recentSalaries,
      employee: { name: employee?.fullName, department: employee?.department }
    }
  });
});

// ======================== HELPER ========================

async function getMonthlyChart() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    months.push({ start, end, label: getMonthLabel(start) });
  }

  const chartData = await Promise.all(months.map(async (m) => {
    const [rev, exp] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'income', date: { $gte: m.start, $lte: m.end }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense', date: { $gte: m.start, $lte: m.end }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    return {
      month: m.label,
      revenue: rev[0]?.total || 0,
      expenses: exp[0]?.total || 0
    };
  }));

  return chartData;
}

function getMonthLabel(date) {
  const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return names[date.getMonth()];
}
