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
  'Account',
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

// @desc    تهيئة النظام — حذف جميع البيانات ما عدا المستخدمين والمحافظ والعملات
// @route   POST /api/system/reset
// @access  Private/Admin
exports.resetSystem = async (req, res) => {
  const stats = {
    deleted: {},
    zeroed: 0,
    kept: { users: 0, currencies: 0, wallets: 0 },
  };

  try {
    // 1. حذف جميع البيانات من النماذج المحددة
    for (const modelName of MODELS_TO_CLEAR) {
      const Model = mongoose.model(modelName);
      const result = await Model.deleteMany({});
      stats.deleted[modelName] = result.deletedCount;
    }

    // 2. إسقاط المؤشر الفريد على المحافظ (account+currency) لتجنب التعارض
    const Wallet = mongoose.model('Wallet');
    try {
      await Wallet.collection.dropIndex('account_1_currency_1');
    } catch (e) {
      // المؤشر قد لا يكون موجوداً، لا مشكلة
    }

    // 3. تصفير أرصدة المحافظ وإزالة مرجع الحساب
    const walletResult = await Wallet.collection.updateMany(
      {},
      {
        $set: { balance: 0 },
        $unset: { account: '' },
      }
    );
    stats.zeroed = walletResult.modifiedCount;

    // 4. إعادة إنشاء المؤشر الفريد (بدون account الآن، المؤشر يكون sparse)
    // نترك المؤشر مفكوكاً لأن المحافظ بلا حسابات بعد التهيئة
    // عند إضافة حسابات جديدة لاحقاً، سينشئ Mongoose المؤشر تلقائياً

    // 5. إحصاء المحفوظات
    stats.kept.users = await mongoose.model('User').countDocuments();
    stats.kept.currencies = await mongoose.model('Currency').countDocuments();
    stats.kept.wallets = await mongoose.model('Wallet').countDocuments();

    res.json({
      success: true,
      message: '✅ تمت تهيئة النظام بنجاح — تم حذف جميع البيانات مع الاحتفاظ بالمستخدمين والمحافظ والعملات',
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
