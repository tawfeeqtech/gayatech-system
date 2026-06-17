const express = require('express');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { port, nodeEnv } = require('./config/env');
const corsConfig = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');


// ============================================
// ✅ تسجيل جميع موديلات قاعدة البيانات (الأهم!)
// ============================================
require('./models/User');
require('./models/Client');
require('./models/Account');
require('./models/Transaction');
require('./models/Contract');
require('./models/ContractMonth');
require('./models/Project');
require('./models/ProjectTask');
require('./models/Employee');
require('./models/IncomeSource');
require('./models/Expense');
require('./models/Partner');
require('./models/PartnerFunding');
require('./models/Subscription');
require('./models/CurrencyExchange');
require('./models/Invoice');
require('./models/Notification');
// ============================================


// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// Middleware
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تسجيل الطلبات في وضع التطوير
if (nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// مجلد المرفقات
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/contract-months', require('./routes/contractMonthRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/expense-categories', require('./routes/expenseCategoryRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/salaries', require('./routes/salaryRoutes'));
app.use('/api/advances', require('./routes/advanceRoutes'));
app.use('/api/partners', require('./routes/partnerRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/currency', require('./routes/currencyRoutes'));
app.use('/api/currencies', require('./routes/currencyListRoutes'));
app.use('/api/income-sources', require('./routes/incomeSourceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في نظام غايتك',
    version: '1.0.0',
    status: 'running'
  });
});

// معالجة الأخطاء
app.use(errorHandler);

// تشغيل الخادم
app.listen(port, () => {
  console.log(`🚀 Server running in ${nodeEnv} mode on port ${port}`);
  console.log(`📡 API: http://localhost:${port}/api`);
});

// التعامل مع الأخطاء غير المتوقعة
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = app;