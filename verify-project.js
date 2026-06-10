#!/usr/bin/env node

/**
 * سكريبت التحقق السريع من نظام غايتك
 * يتحقق من:
 * - وجود جميع الملفات الأساسية
 * - إعدادات البيئة
 * - الحزم المثبتة
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const tests = {
  passed: 0,
  failed: 0,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${name}`, 'green');
    tests.passed++;
  } else {
    log(`❌ ${name} - ملف غير موجود`, 'red');
    tests.failed++;
  }
}

function checkDirectory(dirPath, name) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log(`✅ مجلد ${name}`, 'green');
    tests.passed++;
  } else {
    log(`❌ مجلد ${name} - غير موجود`, 'red');
    tests.failed++;
  }
}

// البدء
log('\n🚀 بدء التحقق من نظام غايتك...\n', 'cyan');

const projectRoot = process.cwd();

// 1. التحقق من ملفات المشروع الرئيسية
log('📋 التحقق من ملفات المشروع الرئيسية:', 'blue');
checkFile(path.join(projectRoot, 'package.json'), 'package.json');
checkFile(path.join(projectRoot, 'README.md'), 'README.md');
checkFile(path.join(projectRoot, 'PROJECT_OVERVIEW.md'), 'PROJECT_OVERVIEW.md');
checkFile(path.join(projectRoot, '.gitignore'), '.gitignore');

// 2. التحقق من المجلدات الرئيسية
log('\n📁 التحقق من المجلدات الرئيسية:', 'blue');
checkDirectory(path.join(projectRoot, 'client'), 'client');
checkDirectory(path.join(projectRoot, 'server'), 'server');

// 3. التحقق من ملفات الخادم
log('\n🖥️  التحقق من ملفات الخادم:', 'blue');
checkFile(path.join(projectRoot, 'server', 'server.js'), 'server.js');
checkFile(path.join(projectRoot, 'server', 'package.json'), 'server/package.json');
checkDirectory(path.join(projectRoot, 'server', 'models'), 'server/models');
checkDirectory(path.join(projectRoot, 'server', 'routes'), 'server/routes');
checkDirectory(path.join(projectRoot, 'server', 'controllers'), 'server/controllers');
checkDirectory(path.join(projectRoot, 'server', 'middleware'), 'server/middleware');
checkDirectory(path.join(projectRoot, 'server', 'config'), 'server/config');
checkDirectory(path.join(projectRoot, 'server', 'seed'), 'server/seed');

// 4. التحقق من ملفات الواجهة
log('\n🎨 التحقق من ملفات الواجهة الأمامية:', 'blue');
checkFile(path.join(projectRoot, 'client', 'package.json'), 'client/package.json');
checkFile(path.join(projectRoot, 'client', 'vite.config.js'), 'client/vite.config.js');
checkFile(path.join(projectRoot, 'client', 'tailwind.config.js'), 'client/tailwind.config.js');
checkDirectory(path.join(projectRoot, 'client', 'src'), 'client/src');
checkDirectory(path.join(projectRoot, 'client', 'src', 'pages'), 'client/src/pages');
checkDirectory(path.join(projectRoot, 'client', 'src', 'components'), 'client/src/components');
checkDirectory(path.join(projectRoot, 'client', 'src', 'api'), 'client/src/api');
checkDirectory(path.join(projectRoot, 'client', 'src', 'redux'), 'client/src/redux');

// 5. التحقق من ملفات .env
log('\n🔐 التحقق من ملفات البيئة:', 'blue');
if (fs.existsSync(path.join(projectRoot, 'server', '.env'))) {
  log('✅ server/.env', 'green');
  tests.passed++;
} else {
  log('⚠️  server/.env - غير موجود (قد تحتاج إلى إنشاء ملف جديد)', 'yellow');
}

if (fs.existsSync(path.join(projectRoot, 'client', '.env'))) {
  log('✅ client/.env', 'green');
  tests.passed++;
} else {
  log('⚠️  client/.env - غير موجود (قد تحتاج إلى إنشاء ملف جديد)', 'yellow');
}

// 6. التحقق من النماذج في الخادم
log('\n📊 التحقق من النماذج (Models):', 'blue');
const models = [
  'User.js',
  'Client.js',
  'Contract.js',
  'ContractMonth.js',
  'Project.js',
  'ProjectTask.js',
  'Employee.js',
  'Transaction.js',
  'Account.js',
  'Invoice.js',
  'Expense.js',
  'Partner.js',
  'PartnerFunding.js',
  'Salary.js',
  'Advance.js',
  'IncomeSource.js',
  'Subscription.js',
  'CurrencyExchange.js',
  'Notification.js',
];

models.forEach(model => {
  checkFile(path.join(projectRoot, 'server', 'models', model), model);
});

// 7. التحقق من المسارات في الخادم
log('\n🛣️  التحقق من المسارات (Routes):', 'blue');
const routes = [
  'authRoutes.js',
  'clientRoutes.js',
  'contractRoutes.js',
  'projectRoutes.js',
  'transactionRoutes.js',
  'invoiceRoutes.js',
  'expenseRoutes.js',
  'employeeRoutes.js',
  'salaryRoutes.js',
  'advanceRoutes.js',
  'partnerRoutes.js',
  'subscriptionRoutes.js',
  'currencyRoutes.js',
  'reportRoutes.js',
];

routes.forEach(route => {
  checkFile(path.join(projectRoot, 'server', 'routes', route), route);
});

// 8. التحقق من الصفحات في الواجهة
log('\n📄 التحقق من الصفحات (Pages):', 'blue');
const pages = [
  'Dashboard/Dashboard.jsx',
  'Auth/Login.jsx',
  'Clients/ClientList.jsx',
  'Contracts/ContractList.jsx',
  'Projects/ProjectList.jsx',
  'Transactions/TransactionList.jsx',
  'Invoices/InvoiceList.jsx',
  'Expenses/ExpenseList.jsx',
  'Employees/EmployeeList.jsx',
  'Salaries/SalaryList.jsx',
  'Advances/AdvanceList.jsx',
  'Partners/PartnerList.jsx',
  'Subscriptions/SubscriptionList.jsx',
];

pages.forEach(page => {
  checkFile(path.join(projectRoot, 'client', 'src', 'pages', page), page);
});

// النتيجة النهائية
log('\n' + '='.repeat(50), 'cyan');
log(`📊 نتائج التحقق:`, 'blue');
log(`✅ نجح: ${tests.passed}`, 'green');
log(`❌ فشل: ${tests.failed}`, tests.failed > 0 ? 'red' : 'green');
log('='.repeat(50) + '\n', 'cyan');

if (tests.failed === 0) {
  log('🎉 كل شيء بخير! المشروع جاهز للتشغيل.', 'green');
  log('\nالخطوات التالية:', 'blue');
  log('1. npm run install:all  (إذا لم تثبت الحزم من قبل)', 'yellow');
  log('2. npm run seed         (لزرع البيانات الأولية)', 'yellow');
  log('3. npm run dev          (لتشغيل المشروع)', 'yellow');
  process.exit(0);
} else {
  log('❌ يوجد مشاكل في المشروع. يرجى التحقق من الملفات الناقصة.', 'red');
  process.exit(1);
}
