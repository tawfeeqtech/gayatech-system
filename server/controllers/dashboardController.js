const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Client = require('../models/Client');
const Wallet = require('../models/Wallet');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Advance = require('../models/Advance');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const asyncHandler = require('../utils/asyncHandler');

// ======================== HELPERS ========================

function getMonthLabel(date) {
  const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return names[date.getMonth()];
}

function getDateRange(range, now) {
  const n = now || new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  switch (range) {
    case 'day': return { from: today, label: 'اليوم' };
    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: d, label: 'آخر 7 أيام' };
    }
    case 'year': return { from: new Date(today.getFullYear(), 0, 1), label: 'هذه السنة' };
    case 'month':
    default: return { from: new Date(today.getFullYear(), today.getMonth(), 1), label: 'هذا الشهر' };
  }
}

async function aggregateIncome(from, to) {
  const match = { type: 'income', date: { $gte: from }, status: { $ne: 'cancelled' } };
  if (to) match.date.$lte = to;
  const r = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return r[0]?.total || 0;
}

async function aggregateExpense(from, to) {
  const match = { type: 'expense', date: { $gte: from }, status: { $ne: 'cancelled' } };
  if (to) match.date.$lte = to;
  const r = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return r[0]?.total || 0;
}

function calcChange(current, prev) {
  if (!prev || prev === 0) return { value: 0, trend: 'neutral' };
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  return { value: Math.round(pct * 10) / 10, trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' };
}

/**
 * التنبؤ المالي: توقع آخر 3 شهور بناءً على متوسط آخر N شهر
 */
function forecastFromChart(chartData, months = 3) {
  if (!chartData || chartData.length < 3) return [];
  const recent = chartData.slice(-6); // آخر 6 شهور
  const avgRev = recent.reduce((s, m) => s + m.revenue, 0) / recent.length;
  const avgExp = recent.reduce((s, m) => s + m.expenses, 0) / recent.length;

  const forecast = [];
  const lastMonth = chartData[chartData.length - 1];
  const lastDate = new Date();
  for (let i = 1; i <= months; i++) {
    const d = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
    forecast.push({
      month: getMonthLabel(d),
      revenue: Math.round(avgRev),
      expenses: Math.round(avgExp),
      isForecast: true
    });
  }
  return forecast;
}

// ======================== ADMIN DASHBOARD ========================

exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const { range = 'month' } = req.query;
  const { from } = getDateRange(range, now);

  // حساب الفترة السابقة بنفس المدة للمقارنة
  const rangeMs = now.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - rangeMs);

  // 📊 1. الإيرادات — فترة محددة + مقارنة مع الفترة السابقة
  const [revenue, prevRevenue] = await Promise.all([
    aggregateIncome(from, now), aggregateIncome(prevFrom, prevTo)
  ]);
  const revenueKPI = calcChange(revenue, prevRevenue);

  // 📊 2. المصاريف — فترة محددة + مقارنة
  const [expenses, prevExpenses] = await Promise.all([
    aggregateExpense(from, now), aggregateExpense(prevFrom, prevTo)
  ]);
  const expensesKPI = calcChange(expenses, prevExpenses);

  // 📊 3. صافي الربح
  const netProfit = revenue - expenses;
  const prevNetProfit = prevRevenue - prevExpenses;
  const profitKPI = calcChange(netProfit, prevNetProfit);

  // 📊 4. مقارنة سنوية (هذه السنة vs السنة الماضية)
  const thisYear = new Date(now.getFullYear(), 0, 1);
  const lastYear = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  const [yearRevenue, lastYearRevenue] = await Promise.all([
    aggregateIncome(thisYear), aggregateIncome(lastYear, lastYearEnd)
  ]);
  const [yearExpenses, lastYearExpenses] = await Promise.all([
    aggregateExpense(thisYear), aggregateExpense(lastYear, lastYearEnd)
  ]);
  const yoyRevenue = calcChange(yearRevenue, lastYearRevenue);
  const yoyExpenses = calcChange(yearExpenses, lastYearExpenses);

  // 📊 5. رصيد الشركة
  const wallets = await Wallet.aggregate([
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]);
  const totalBalance = wallets[0]?.total || 0;

  // 📊 6-8. أرقام سريعة
  const [activeContracts, activeProjects, activeClients] = await Promise.all([
    Contract.countDocuments({ status: 'active' }),
    Project.countDocuments({ status: 'active' }),
    Client.countDocuments({ isActive: true })
  ]);

  // 📊 9. فواتير متأخرة
  const overdueInvoices = await Invoice.aggregate([
    { $match: { status: { $in: ['مصدرة', 'مرسلة'] }, dueDate: { $lt: now } } },
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }
  ]);
  const overdueCount = overdueInvoices[0]?.count || 0;
  const overdueTotal = overdueInvoices[0]?.total || 0;

  // 📊 10. رسم بياني شهري
  const monthlyChart = await getMonthlyChart();

  // 📊 11. التنبؤ المالي
  const forecast = forecastFromChart(monthlyChart);

  // 📊 12. توزيع الدخل حسب المصدر
  const incomeBySource = await Transaction.aggregate([
    { $match: { type: 'income', date: { $gte: from }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } }
  ]);

  // 📊 13. أرصدة الحسابات
  const accounts = await Wallet.find({}).populate('account', 'name').lean();
  const accountBalances = accounts.map(w => ({
    name: w.account?.name || w.name || 'غير معروف',
    balance: w.balance,
    currency: w.currency
  }));

  // 📊 14. أداء المشاريع
  const projectStatus = await Project.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 📊 15. آخر 5 معاملات
  const recentTransactions = await Transaction.find({ status: { $ne: 'cancelled' } })
    .sort({ date: -1 }).limit(5)
    .populate('client', 'name').populate('project', 'name').lean();

  // 📊 16. تنبيهات
  const alerts = [];
  if (overdueCount > 0) {
    alerts.push({ type: 'warning', message: `${overdueCount} فواتير متأخرة (إجمالي $${overdueTotal.toLocaleString()})`, icon: '⚠️' });
  }
  const expiringSubs = await Subscription.countDocuments({
    endDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    status: 'active'
  });
  if (expiringSubs > 0) {
    alerts.push({ type: 'info', message: `${expiringSubs} اشتراكات تنتهي خلال 30 يوم`, icon: '🔄' });
  }

  // 📊 17. آخر 5 إشعارات
  const recentNotifications = await Notification.find({})
    .sort({ createdAt: -1 }).limit(5).lean();

  res.json({
    status: 'success',
    data: {
      stats: {
        revenue: { value: revenue, ...revenueKPI },
        expenses: { value: expenses, ...expensesKPI },
        netProfit: { value: netProfit, ...profitKPI },
        totalBalance: { value: totalBalance },
        activeContracts: { value: activeContracts },
        activeProjects: { value: activeProjects },
        activeClients: { value: activeClients },
        overdueInvoices: { count: overdueCount, total: overdueTotal }
      },
      yoy: {
        revenue: { current: yearRevenue, previous: lastYearRevenue, ...yoyRevenue },
        expenses: { current: yearExpenses, previous: lastYearExpenses, ...yoyExpenses }
      },
      charts: {
        monthly: monthlyChart,
        forecast,
        incomeBySource,
        projectStatus,
        accountBalances
      },
      alerts,
      notifications: recentNotifications,
      recentTransactions: recentTransactions.map(t => ({
        id: t._id, number: t.transactionNumber, type: t.type,
        amount: t.amount, currency: t.currency,
        clientName: t.client?.name || '', projectName: t.project?.name || '',
        date: t.date
      })),
      range
    }
  });
});

// ======================== FINANCE DASHBOARD ========================

exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const { range = 'month' } = req.query;
  const { from } = getDateRange(range, now);

  // الفترة السابقة للمقارنة
  const rangeMs = now.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - rangeMs);

  const [revenue, expenses, wallets, pendingInvoices, recentCollections] = await Promise.all([
    aggregateIncome(from, now), aggregateExpense(from, now),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Invoice.find({ status: { $in: ['مصدرة', 'مرسلة'] } }).sort({ dueDate: 1 }).limit(10).populate('client', 'name').lean(),
    Transaction.find({ type: 'income', status: { $ne: 'cancelled' } }).sort({ date: -1 }).limit(5).populate('client', 'name').lean()
  ]);

  const debts = await Invoice.aggregate([
    { $match: { status: { $in: ['مصدرة', 'مرسلة'] } } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
  ]);

  const expensesByCategory = await Expense.aggregate([
    { $match: { date: { $gte: from } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const monthlyChart = await getMonthlyChart();
  const forecast = forecastFromChart(monthlyChart);

  // مقارنة مع الفترة السابقة
  const [prevRevenue, prevExpenses] = await Promise.all([
    aggregateIncome(prevFrom, prevTo), aggregateExpense(prevFrom, prevTo)
  ]);

  res.json({
    status: 'success',
    data: {
      stats: {
        revenue: revenue,
        expenses: expenses,
        netProfit: revenue - expenses,
        totalDebt: debts[0]?.total || 0,
        debtCount: debts[0]?.count || 0
      },
      kpi: {
        revenue: calcChange(revenue, prevRevenue),
        expenses: calcChange(expenses, prevExpenses),
        netProfit: calcChange(revenue - expenses, prevRevenue - prevExpenses)
      },
      balance: wallets[0]?.total || 0,
      charts: { monthly: monthlyChart, forecast, expensesByCategory },
      pendingInvoices,
      recentCollections,
      range
    }
  });
});

// ======================== PM DASHBOARD ========================

exports.getPMDashboard = asyncHandler(async (req, res) => {
  const { range = 'month' } = req.query;
  const { from } = getDateRange(range);

  const [projects, activeProjects, completedProjects, activeContracts, endedContracts,
    activeClients, pendingTasks] = await Promise.all([
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
        activeProjects, completedProjects, activeContracts,
        endedContracts, activeClients,
        pendingTasks: pendingTasks[0]?.total || 0
      },
      projectStatus: projectStatusDistribution,
      projects: projects.slice(0, 10),
      range
    }
  });
});

// ======================== ACCOUNTANT DASHBOARD ========================

exports.getAccountantDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const { range = 'month' } = req.query;
  const { from } = getDateRange(range, now);

  const [pendingInvoices, monthlyExpenses, pendingPayments, wallets, recentExpenses, expensesByCategory] = await Promise.all([
    Invoice.countDocuments({ status: { $in: ['مصدرة', 'مرسلة'] } }),
    Expense.aggregate([
      { $match: { date: { $gte: from } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Invoice.countDocuments({ status: 'مدفوعة جزئياً' }),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Expense.find({}).sort({ date: -1 }).limit(10).populate('category').lean(),
    Expense.aggregate([
      { $match: { date: { $gte: from } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ])
  ]);

  const dueInvoices = await Invoice.find({
    status: { $in: ['مصدرة', 'مرسلة'] }, dueDate: { $gte: now }
  }).sort({ dueDate: 1 }).limit(10).populate('client', 'name').lean();

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
      recentExpenses,
      range
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
        tasks: [], salaries: [], advances: []
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
    month: s.month, year: s.year, amount: s.netSalary, status: s.status
  }));

  const projects = await Project.find({ 'team.employee': employeeId }).lean();
  let activeTasks = 0, completedTasks = 0;
  const myTasks = [];

  projects.forEach(p => {
    (p.tasks || []).forEach(t => {
      if (t.assignedTo?.toString() === employeeId?.toString()) {
        if (t.status === 'completed') completedTasks++;
        else activeTasks++;
        myTasks.push({ id: t._id, title: t.title, status: t.status, projectName: p.name, dueDate: t.dueDate });
      }
    });
  });

  res.json({
    status: 'success',
    data: {
      stats: {
        salary: employee?.salary || 0, advance: pendingAdvances,
        activeTasks, completedTasks
      },
      tasks: myTasks.slice(0, 10),
      salaries: recentSalaries,
      employee: { name: employee?.fullName, department: employee?.department }
    }
  });
});

// ======================== NOTIFICATIONS (للإشعارات الحية) ========================

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ status: 'success', data: notifications });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ read: false });
  res.json({ status: 'success', count });
});

// ======================== EXPORT ========================

exports.getDashboardExport = asyncHandler(async (req, res) => {
  const now = new Date();
  thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [revenue, prevRevenue, expenses, prevExpenses, wallets, activeContracts,
    activeProjects, activeClients, overdue] = await Promise.all([
    aggregateIncome(thisMonth), aggregateIncome(lastMonth, lastMonthEnd),
    aggregateExpense(thisMonth), aggregateExpense(lastMonth, lastMonthEnd),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Contract.countDocuments({ status: 'active' }),
    Project.countDocuments({ status: 'active' }),
    Client.countDocuments({ isActive: true }),
    Invoice.aggregate([
      { $match: { status: { $in: ['مصدرة', 'مرسلة'] }, dueDate: { $lt: now } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } }
    ])
  ]);

  res.json({
    status: 'success',
    data: {
      generatedAt: now,
      revenue: { current: revenue, previous: prevRevenue, change: calcChange(revenue, prevRevenue) },
      expenses: { current: expenses, previous: prevExpenses, change: calcChange(expenses, prevExpenses) },
      netProfit: revenue - expenses,
      totalBalance: wallets[0]?.total || 0,
      activeContracts, activeProjects, activeClients,
      overdueInvoices: overdue[0] || { count: 0, total: 0 }
    }
  });
});

// ======================== MONTHLY CHART HELPER ========================

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
      expenses: exp[0]?.total || 0,
      isForecast: false
    };
  }));

  return chartData;
}
