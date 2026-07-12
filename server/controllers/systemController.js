const mongoose = require('mongoose');

// النماذج التي سيتم حذف جميع بياناتها
const MODELS_TO_CLEAR = [
  'Transaction',
  'Expense',
  'Invoice',
  'Contract',
  'ContractMonth',
  'Project',
  'ProjectTask',
  'Client',
  'Employee',
  'Salary',
  'Advance',
  'Subscription',
  'Vendor',
  'CurrencyExchange',
  'Notification',
  'Partner',
  'PartnerFunding',
  'Department',
  'JobTitle',
  'IncomeSource',
  'ExpenseCategory',
  'SystemSettings',
  'City',
  'Country',
];

// النماذج المحتفظ بها (لا تمسح، فقط رصيد المحافظ يتصفر)
const MODELS_TO_KEEP = ['User', 'Account', 'Wallet', 'Currency'];

// @desc    تهيئة النظام — حذف جميع البيانات مع الاحتفاظ بالمستخدمين والحسابات والمحافظ والعملات
// @route   POST /api/system/reset
// @access  Private/Admin
exports.resetSystem = async (req, res) => {
  const stats = {
    deleted: {},
    zeroed: 0,
    kept: {},
  };

  try {
    // 1. حذف جميع البيانات من النماذج المحددة
    for (const modelName of MODELS_TO_CLEAR) {
      const Model = mongoose.model(modelName);
      const result = await Model.deleteMany({});
      stats.deleted[modelName] = result.deletedCount;
    }

    // 2. تصفير أرصدة المحافظ فقط (الحسابات تبقى كما هي)
    const Wallet = mongoose.model('Wallet');
    const walletResult = await Wallet.updateMany({}, { $set: { balance: 0 } });
    stats.zeroed = walletResult.modifiedCount;

    // 3. إحصاء المحفوظات
    for (const modelName of MODELS_TO_KEEP) {
      stats.kept[modelName] = await mongoose.model(modelName).countDocuments();
    }

    res.json({
      success: true,
      message: '✅ تمت تهيئة النظام بنجاح — تم حذف البيانات التشغيلية مع الاحتفاظ بالمستخدمين، الحسابات، المحافظ، والعملات',
      stats,
    });
  } catch (error) {
    console.error('❌ فشل تهيئة النظام:', error);
    res.status(500).json({
      success: false,
      message: '❌ فشل في تهيئة النظام',
      error: error.message,
    });
  }
};
