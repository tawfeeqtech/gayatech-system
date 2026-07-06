const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import all models
const User = require('../models/User');
const Client = require('../models/Client');
const Account = require('../models/Account');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const ContractMonth = require('../models/ContractMonth');
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Partner = require('../models/Partner');
const PartnerFunding = require('../models/PartnerFunding');
const Salary = require('../models/Salary');
const Advance = require('../models/Advance');
const IncomeSource = require('../models/IncomeSource');
const Subscription = require('../models/Subscription');
const CurrencyExchange = require('../models/CurrencyExchange');
const Currency = require('../models/Currency');
const Notification = require('../models/Notification');

// =============================================
// بيانات أولية
// =============================================

const users = [
  { username: 'admin', email: 'admin@gayatech.ps', password: 'admin123', fullName: 'مدير النظام', role: 'admin' },
  { username: 'finance', email: 'finance@gayatech.ps', password: 'finance123', fullName: 'المدير المالي', role: 'finance' },
  { username: 'pm', email: 'pm@gayatech.ps', password: 'pm123', fullName: 'مدير المشاريع', role: 'pm' },
  { username: 'accountant', email: 'accountant@gayatech.ps', password: 'accountant123', fullName: 'المحاسب', role: 'accountant' },
  { username: 'employee', email: 'employee@gayatech.ps', password: 'employee123', fullName: 'موظف تجريبي', role: 'employee' }
];

const accounts = [
  { name: 'حساب الشركة', accountType: 'بنك', currency: 'USD', isDefault: true, description: 'الحساب الرئيسي' },
  { name: 'صندوق ريم', accountType: 'وسيط', currency: 'USD', description: 'وسيط استقبال المدفوعات' },
  { name: 'نقد', accountType: 'نقد', currency: 'USD', description: 'الأموال النقدية' }
];

const incomeSources = [
  { name: 'عقود شهرية', description: 'إيرادات العقود الشهرية', isDefault: true },
  { name: 'مشاريع', description: 'إيرادات المشاريع المستقلة', isDefault: true },
  { name: 'متجر سلة', description: 'مبيعات المتجر الإلكتروني' },
  { name: 'استقطاب مشاريع', description: 'عمولات استقطاب المشاريع' },
  { name: 'أخرى', description: 'مصادر دخل أخرى' }
];

const expenseCategories = [
  { name: 'رواتب', icon: '💰', color: '#3B82F6' },
  { name: 'إيجارات', icon: '🏢', color: '#10B981' },
  { name: 'كهرباء', icon: '⚡', color: '#F59E0B' },
  { name: 'إنترنت', icon: '🌐', color: '#8B5CF6' },
  { name: 'رسوم حكومية', icon: '📋', color: '#EF4444' },
  { name: 'تسويق', icon: '📢', color: '#EC4899' },
  { name: 'أدوات وخدمات', icon: '🛠️', color: '#6366F1' },
  { name: 'مصاريف إدارية', icon: '📎', color: '#14B8A6' },
  { name: 'أخرى', icon: '📌', color: '#6B7280' }
];

const subscriptions = [
  {
    provider: 'Vercel', serviceName: 'استضافة Pro', category: 'استضافة',
    amount: 20, currency: 'USD',
    startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
    renewalType: 'سنوي', status: 'نشط'
  },
  {
    provider: 'MongoDB Atlas', serviceName: 'قاعدة بيانات M10', category: 'خدمات سحابية',
    amount: 57, currency: 'USD',
    startDate: new Date('2026-03-01'), endDate: new Date('2026-09-01'),
    renewalType: 'شهري', status: 'نشط'
  },
  {
    provider: 'GitHub', serviceName: 'Team Plan', category: 'برمجيات',
    amount: 44, currency: 'USD',
    startDate: new Date('2026-02-01'), endDate: new Date('2026-08-01'),
    renewalType: 'شهري', status: 'نشط'
  },
  {
    provider: 'Figma', serviceName: 'Professional', category: 'أدوات',
    amount: 12, currency: 'USD',
    startDate: new Date('2026-01-15'), endDate: new Date('2026-07-15'),
    renewalType: 'شهري', status: 'نشط'
  },
  {
    provider: 'Canva', serviceName: 'Pro', category: 'أدوات',
    amount: 13, currency: 'USD',
    startDate: new Date('2025-06-01'), endDate: new Date('2026-06-01'),
    renewalType: 'شهري', status: 'نشط'
  }
];

// =============================================
// دالة seed الرئيسية
// =============================================

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech_system';
    console.log('📡 Connecting to database...');
    await mongoose.connect(connStr);
    console.log('✅ Connected\n');

    // حذف البيانات القديمة
    console.log('🗑️  Clearing all existing data...');
    await Promise.all([
      User.deleteMany(),
      Client.deleteMany(),
      Account.deleteMany(),
      Employee.deleteMany(),
      Contract.deleteMany(),
      ContractMonth.deleteMany(),
      Project.deleteMany(),
      ProjectTask.deleteMany(),
      Transaction.deleteMany(),
      Invoice.deleteMany(),
      Expense.deleteMany(),
      ExpenseCategory.deleteMany(),
      Partner.deleteMany(),
      PartnerFunding.deleteMany(),
      Salary.deleteMany(),
      Advance.deleteMany(),
      IncomeSource.deleteMany(),
      Subscription.deleteMany(),
      CurrencyExchange.deleteMany(),
      Notification.deleteMany()
    ]);
    console.log('✅ All data cleared\n');

    // =============================================
    // إنشاء البيانات الأساسية
    // =============================================

    // 1. Users
    console.log('👤 Creating users...');
    const createdUsers = {};
    for (const u of users) {
      const user = await User.create(u);
      createdUsers[u.username] = user;
      console.log(`   ✅ ${u.username} (${u.role})`);
    }

    // 2. Accounts
    console.log('\n🏦 Creating accounts...');
    const createdAccounts = {};
    for (const a of accounts) {
      const account = await Account.create({ ...a, createdBy: createdUsers['admin']._id });
      createdAccounts[a.name] = account;
      console.log(`   ✅ ${a.name}`);
    }

    console.log('\n👛 Creating wallets...');

    const Wallet = require('../models/Wallet');

    const walletsData = [
      // محافظ حساب الشركة
      {
        name: 'محفظة الدولار - الشركة',
        account: createdAccounts['حساب الشركة']._id,
        currency: 'USD',
        isDefault: true,
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'محفظة الشيكل - الشركة',
        account: createdAccounts['حساب الشركة']._id,
        currency: 'ILS',
        createdBy: createdUsers['admin']._id
      },
      // محافظ صندوق ريم
      {
        name: 'محفظة الدولار - ريم',
        account: createdAccounts['صندوق ريم']._id,
        currency: 'USD',
        isDefault: true,
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'محفظة الريال - ريم',
        account: createdAccounts['صندوق ريم']._id,
        currency: 'SAR',
        createdBy: createdUsers['admin']._id
      },
      // محفظة النقد
      {
        name: 'محفظة الدولار - نقد',
        account: createdAccounts['نقد']._id,
        currency: 'USD',
        isDefault: true,
        createdBy: createdUsers['admin']._id
      }
    ];

    for (const w of walletsData) {
      await Wallet.create(w);
      console.log(`   ✅ ${w.name} (${w.currency})`);
    }


    // 3. Income Sources
    console.log('\n📑 Creating income sources...');
    const createdSources = {};
    for (const s of incomeSources) {
      const source = await IncomeSource.create(s);
      createdSources[s.name] = source;
      console.log(`   ✅ ${s.name}`);
    }

    // 4. Expense Categories
    console.log('\n🏷️  Creating expense categories...');
    const createdCategories = {};
    for (const c of expenseCategories) {
      const cat = await ExpenseCategory.create(c);
      createdCategories[c.name] = cat;
      console.log(`   ✅ ${c.name}`);
    }

    // 4. Currencies
    console.log('\n💰 Seeding currencies...');
    const currencyData = [
      { code: 'USD', nameAr: 'دولار', symbol: '$', sortOrder: 1, isActive: true },
      { code: 'ILS', nameAr: 'شيكل اسرائيلي', symbol: '₪', sortOrder: 2, isActive: true },
      { code: 'SAR', nameAr: 'ريال سعودي', symbol: '﷼', sortOrder: 3, isActive: true },
      { code: 'JOD', nameAr: 'دينار اردني', symbol: 'د.أ', sortOrder: 4, isActive: true },
      { code: 'EUR', nameAr: 'يورو', symbol: '€', sortOrder: 5, isActive: true },
    ];
    for (const c of currencyData) {
      await Currency.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true }
      );
      console.log(`   ✅ ${c.code} - ${c.nameAr}`);
    }

    // 5. Employees
    console.log('\n👨‍💼 Creating employees...');
    const createdEmployees = {};
    const employeesData = [
      {
        name: 'أحمد محمد', email: 'ahmed@gayatech.ps', phone: '0599123456',
        jobTitle: 'مطور Full Stack', department: 'التطوير',
        baseSalary: 1500, salaryCurrency: 'USD',
        joiningDate: new Date('2025-01-15'),
        skills: ['React', 'Node.js', 'MongoDB'],
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'سارة علي', email: 'sara@gayatech.ps', phone: '0599234567',
        jobTitle: 'مصممة UI/UX', department: 'التصميم',
        baseSalary: 1200, salaryCurrency: 'USD',
        joiningDate: new Date('2025-03-01'),
        skills: ['Figma', 'Adobe XD', 'Photoshop'],
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'محمد خالد', email: 'mohamed@gayatech.ps', phone: '0599345678',
        jobTitle: 'مسوق رقمي', department: 'التسويق',
        baseSalary: 1000, salaryCurrency: 'USD',
        joiningDate: new Date('2025-06-01'),
        skills: ['SEO', 'Google Ads', 'Social Media'],
        createdBy: createdUsers['admin']._id
      }
    ];
    for (const e of employeesData) {
      const employee = await Employee.create(e);
      createdEmployees[e.name] = employee;
      console.log(`   ✅ ${e.name} - ${e.jobTitle}`);
    }

    // ربط مستخدم employee بسجل الموظف (حتى يعمل /salaries/me)
    await User.findByIdAndUpdate(createdUsers['employee']._id, { employee: createdEmployees['أحمد محمد']._id });
    await Employee.findByIdAndUpdate(createdEmployees['أحمد محمد']._id, { user: createdUsers['employee']._id });
    console.log('   🔗 Linked employee user to أحمد محمد');

    // 6. Clients
    console.log('\n👥 Creating clients...');
    const createdClients = {};
    const clientsData = [
      {
        name: 'شركة الأفق', company: 'Al-Ofuq Tech', email: 'info@ofuq.ps',
        phone: '0599456789', clientType: 'شركة',
        source: createdSources['عقود شهرية']._id,
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'مؤسسة النور', company: 'Al-Noor Foundation', email: 'info@noor.ps',
        phone: '0599567890', clientType: 'مؤسسة',
        source: createdSources['مشاريع']._id,
        createdBy: createdUsers['admin']._id
      },
      {
        name: 'TechStart', email: 'hello@techstart.ps',
        phone: '0599678901', clientType: 'شركة',
        source: createdSources['عقود شهرية']._id,
        createdBy: createdUsers['admin']._id
      }
    ];
    for (const c of clientsData) {
      const client = await Client.create(c);
      createdClients[c.name] = client;
      console.log(`   ✅ ${c.name}`);
    }

    // 7. Contracts
    console.log('\n📋 Creating contracts...');
    const contractsData = [
      {
        client: createdClients['شركة الأفق']._id,
        title: 'عقد تسويق شهري', serviceType: 'تسويق رقمي',
        defaultMonthlyValue: 500, currency: 'USD',
        startDate: new Date('2026-01-01'),
        dueDayOfMonth: 10,
        status: 'نشط',
        autoGeneration: { enabled: true, dayOfMonth: 1, autoConfirm: false },
        createdBy: createdUsers['admin']._id
      },
      {
        client: createdClients['شركة الأفق']._id,
        title: 'عقد إدارة مواقع', serviceType: 'إدارة مواقع',
        defaultMonthlyValue: 300, currency: 'USD',
        startDate: new Date('2026-02-01'),
        dueDayOfMonth: 15,
        status: 'نشط',
        autoGeneration: { enabled: true, dayOfMonth: 1, autoConfirm: false },
        createdBy: createdUsers['admin']._id
      },
      {
        client: createdClients['TechStart']._id,
        title: 'عقد استشارات تقنية', serviceType: 'استشارات',
        defaultMonthlyValue: 800, currency: 'USD',
        startDate: new Date('2026-03-01'),
        dueDayOfMonth: 5,
        status: 'نشط',
        autoGeneration: { enabled: true, dayOfMonth: 1, autoConfirm: false },
        createdBy: createdUsers['admin']._id
      }
    ];
    const createdContracts = [];
    for (const c of contractsData) {
      const contract = await Contract.create(c);
      createdContracts.push(contract);
      console.log(`   ✅ ${c.title}`);
    }

    // 8. Contract Months
    console.log('\n📅 Creating contract months...');
    const monthsData = [
      { contract: createdContracts[0]._id, client: createdClients['شركة الأفق']._id, month: '2026-04', value: 500, currency: 'USD', dueDate: new Date('2026-04-10'), status: 'paid', paidAmount: 500 },
      { contract: createdContracts[0]._id, client: createdClients['شركة الأفق']._id, month: '2026-05', value: 500, currency: 'USD', dueDate: new Date('2026-05-10'), status: 'paid', paidAmount: 500 },
      { contract: createdContracts[0]._id, client: createdClients['شركة الأفق']._id, month: '2026-06', value: 500, currency: 'USD', dueDate: new Date('2026-06-10'), status: 'confirmed' },
      { contract: createdContracts[1]._id, client: createdClients['شركة الأفق']._id, month: '2026-04', value: 300, currency: 'USD', dueDate: new Date('2026-04-15'), status: 'paid', paidAmount: 300 },
      { contract: createdContracts[1]._id, client: createdClients['شركة الأفق']._id, month: '2026-05', value: 300, currency: 'USD', dueDate: new Date('2026-05-15'), status: 'paid', paidAmount: 300 },
      { contract: createdContracts[1]._id, client: createdClients['شركة الأفق']._id, month: '2026-06', value: 300, currency: 'USD', dueDate: new Date('2026-06-15'), status: 'confirmed' },
      { contract: createdContracts[2]._id, client: createdClients['TechStart']._id, month: '2026-05', value: 800, currency: 'USD', dueDate: new Date('2026-05-05'), status: 'paid', paidAmount: 800 },
      { contract: createdContracts[2]._id, client: createdClients['TechStart']._id, month: '2026-06', value: 800, currency: 'USD', dueDate: new Date('2026-06-05'), status: 'confirmed' }
    ];
    const createdMonths = [];
    for (const m of monthsData) {
      const month = await ContractMonth.create({ ...m, generationType: 'manual' });
      createdMonths.push(month);
      console.log(`   ✅ ${m.month} - ${m.value}${m.currency}`);
    }

    // 9. Projects
    console.log('\n🚀 Creating projects...');
    const projectsData = [
      {
        client: createdClients['مؤسسة النور']._id,
        title: 'تصميم هوية بصرية', serviceType: 'تصميم جرافيك',
        totalValue: 2000, currency: 'USD',
        startDate: new Date('2026-05-01'), deliveryDate: new Date('2026-07-01'),
        status: 'قيد التنفيذ',
        team: [{ employee: createdEmployees['سارة علي']._id, role: 'مصمم رئيسي' }],
        createdBy: createdUsers['admin']._id
      },
      {
        client: createdClients['TechStart']._id,
        title: 'تطوير موقع ويب', serviceType: 'برمجة',
        totalValue: 5000, currency: 'USD',
        startDate: new Date('2026-04-01'), deliveryDate: new Date('2026-08-01'),
        status: 'قيد التنفيذ',
        team: [
          { employee: createdEmployees['أحمد محمد']._id, role: 'مطور رئيسي' },
          { employee: createdEmployees['سارة علي']._id, role: 'مصمم واجهات' }
        ],
        createdBy: createdUsers['admin']._id
      }
    ];
    const createdProjects = [];
    for (const p of projectsData) {
      const project = await Project.create(p);
      createdProjects.push(project);
      console.log(`   ✅ ${p.title}`);
    }

    // 10. Transactions
    console.log('\n💰 Creating transactions...');
    const transactionsData = [
      {
        type: 'دخل', nature: 'خارجي', amount: 500, currency: 'USD',
        toAccount: createdAccounts['صندوق ريم']._id,
        client: createdClients['شركة الأفق']._id,
        contractMonth: createdMonths[0]._id,
        transactionDate: new Date('2026-04-10'),
        paymentMethod: 'ريم', status: 'مكتمل',
        description: 'دفعة عقد تسويق - أبريل',
        createdBy: createdUsers['admin']._id
      },
      {
        type: 'دخل', nature: 'خارجي', amount: 500, currency: 'USD',
        toAccount: createdAccounts['صندوق ريم']._id,
        client: createdClients['شركة الأفق']._id,
        contractMonth: createdMonths[1]._id,
        transactionDate: new Date('2026-05-12'),
        paymentMethod: 'ريم', status: 'مكتمل',
        description: 'دفعة عقد تسويق - مايو',
        createdBy: createdUsers['admin']._id
      },
      {
        type: 'دخل', nature: 'خارجي', amount: 800, currency: 'USD',
        toAccount: createdAccounts['حساب الشركة']._id,
        client: createdClients['TechStart']._id,
        contractMonth: createdMonths[6]._id,
        transactionDate: new Date('2026-05-05'),
        paymentMethod: 'تحويل بنكي', status: 'مكتمل',
        description: 'دفعة عقد استشارات - مايو (مباشر للشركة)',
        createdBy: createdUsers['admin']._id
      },
      {
        type: 'تحويل', nature: 'داخلي', amount: 1000, currency: 'USD',
        fromAccount: createdAccounts['صندوق ريم']._id,
        toAccount: createdAccounts['حساب الشركة']._id,
        transactionDate: new Date('2026-05-15'),
        status: 'مكتمل',
        description: 'تحويل من صندوق ريم إلى حساب الشركة',
        createdBy: createdUsers['admin']._id
      }
    ];
    for (const t of transactionsData) {
      await Transaction.create(t);
      console.log(`   ✅ ${t.description}`);
    }

    // 11. Expenses
    console.log('\n💸 Creating expenses...');
    const expensesData = [
      {
        category: createdCategories['إنترنت']._id,
        amount: 150, currency: 'USD',
        expenseDate: new Date('2026-05-01'),
        description: 'فاتورة إنترنت شهر مايو',
        vendor: 'شركة الاتصالات',
        paidFrom: createdAccounts['حساب الشركة']._id,
        createdBy: createdUsers['admin']._id
      },
      {
        category: createdCategories['إيجارات']._id,
        amount: 400, currency: 'USD',
        expenseDate: new Date('2026-05-01'),
        description: 'إيجار المكتب - مايو',
        paidFrom: createdAccounts['حساب الشركة']._id,
        createdBy: createdUsers['admin']._id
      }
    ];
    for (const e of expensesData) {
      await Expense.create(e);
      console.log(`   ✅ ${e.description}`);
    }

    // 12. Subscriptions
    console.log('\n🔄 Creating subscriptions...');
    for (const s of subscriptions) {
      await Subscription.create({ ...s, createdBy: createdUsers['admin']._id });
      console.log(`   ✅ ${s.provider} - ${s.serviceName}`);
    }

    // 13. Partners
    console.log('\n🤝 Creating partners...');
    const partnersData = [
      {
        name: 'خالد العمري', partnerType: 'ممول',
        email: 'khaled@example.com', phone: '0599789012',
        createdBy: createdUsers['admin']._id
      }
    ];
    const createdPartners = [];
    for (const p of partnersData) {
      const partner = await Partner.create(p);
      createdPartners.push(partner);
      console.log(`   ✅ ${p.name}`);
    }

    // 14. Partner Fundings
    console.log('\n💵 Creating partner fundings...');
    const fundingsData = [
      {
        partner: createdPartners[0]._id,
        direction: 'تمويل وارد', amount: 3000, currency: 'USD',
        fundingDate: new Date('2026-03-01'),
        toAccount: createdAccounts['حساب الشركة']._id,
        reason: 'تمويل تشغيلي للربع الثاني',
        createdBy: createdUsers['admin']._id
      }
    ];
    for (const f of fundingsData) {
      await PartnerFunding.create(f);
      console.log(`   ✅ ${f.reason}`);
    }

    // =============================================
    // النهاية
    // =============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database seeded successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log('   admin      / admin123      (مدير النظام)');
    console.log('   finance    / finance123    (مدير مالي)');
    console.log('   pm         / pm123         (مدير مشاريع)');
    console.log('   accountant / accountant123 (محاسب)');
    console.log('   employee   / employee123   (موظف)');
    console.log('\n📊 Data Summary:');
    console.log(`   👤 Users:             5`);
    console.log(`   👥 Clients:           3`);
    console.log(`   🏦 Accounts:          3`);
    console.log(`   👨‍💼 Employees:        3`);
    console.log(`   📋 Contracts:         3`);
    console.log(`   📅 Contract Months:   8`);
    console.log(`   🚀 Projects:          2`);
    console.log(`   💰 Transactions:      4`);
    console.log(`   💸 Expenses:          2`);
    console.log(`   🔄 Subscriptions:     5`);
    console.log(`   🤝 Partners:          1`);
    console.log(`   💵 Partner Fundings:  1`);
    console.log(`   📑 Income Sources:    5`);
    console.log(`   💰 Currencies:         ${Object.keys(currencyData).length}`);
    console.log(`   🏷️  Exp. Categories:  9`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();